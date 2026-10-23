import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SCRAPE_URL = "https://www.trabalhaes.com.br/vagas-em-remoto";
const JOB_URL_PATTERN = /trabalhaes\.com\.br\/vaga\/([a-z0-9\-]+)\/(?:remoto(?:-es)?|remoto)\/(\d+)/gi;

function decodeHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractSalary(text: string): { min: number; max: number } | null {
  const patterns = [/R\$\s*([\d.,]+)\s*(?:a|até)\s*R\$\s*([\d.,]+)/i, /([\d.,]+)\s*(?:a|até)\s*([\d.,]+)\s*(?:reais|bucks)?/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const min = parseInt(m[1].replace(/\./g, "").replace(",", ""));
      const max = parseInt(m[2].replace(/\./g, "").replace(",", ""));
      if (min > 0 && max > 0 && min <= max) return { min: Math.min(min, 25000), max: Math.min(max, 28000) };
    }
  }
  return null;
}

function guessSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/(tech lead|techlead|tl|líder técnico|arquiteto|arquiteta)/.test(t)) return "lead";
  if (/(sênior|senior|sr\.?|especialista)/.test(t)) return "senior";
  if (/(pleno|pl\.?|mid)/.test(t)) return "mid";
  if (/(júnior|junior|jr\.?|estagiário|estagiario|trainee)/.test(t)) return "junior";
  if (/(gerente|manager|head|director|diretor)/.test(t)) return "manager";
  return "mid";
}

function guessModality(text: string): string {
  const t = text.toLowerCase();
  if (/(100%\s*remoto|home office|remoto|remote)/.test(t)) return "remote";
  if (/(híbrido|hybrid)/.test(t)) return "hybrid";
  return "onsite";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const startedAt = new Date().toISOString();
  let logId: string | null = null;

  try {
    const { data: logRow } = await supabase.from("scraping_logs").insert({ source_name: "TrabalhaES", status: "running", started_at: startedAt }).select("id").maybeSingle();
    logId = logRow?.id ?? null;

    const res = await fetch(SCRAPE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${SCRAPE_URL}`);

    const html = await res.text();
    const jobs: Array<{ external_id: string; slug: string; apply_url: string; title: string }> = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    const pattern = new RegExp(JOB_URL_PATTERN.source, "gi");
    while ((match = pattern.exec(html)) !== null) {
      const slug = match[1];
      const externalId = match[2];
      const key = `${slug}:${externalId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const anchorStart = match.index;
      const ctx = html.slice(Math.max(0, anchorStart - 400), anchorStart + 600);
      const titleMatch = ctx.match(/<a[^>]*href="[^"]*trabalhaes\.com\.br\/vaga\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
      let title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : slug.replace(/-/g, " ");
      title = title.slice(0, 200);
      const applyUrl = `https://www.trabalhaes.com.br/vaga/${slug}/remoto/${externalId}/`;
      jobs.push({ external_id: externalId, slug: `${slug}-remoto-${externalId}`, apply_url: applyUrl, title });
      if (jobs.length >= 50) break;
    }

    const { data: sourceRow } = await supabase.from("job_sources").select("id").eq("name", "TrabalhaES").maybeSingle();
    const sourceId = sourceRow?.id ?? null;
    let inserted = 0;

    for (const job of jobs.slice(0, 20)) {
      try {
        const detailRes = await fetch(job.apply_url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9" },
          signal: AbortSignal.timeout(12000),
        });

        let description = "";
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        let location = "Remoto";

        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          const h1Match = detailHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match) {
            const h1Text = decodeHtmlEntities(h1Match[1]);
            if (h1Text.length > 3 && h1Text.length < 200) job.title = h1Text;
          }
          const bodyMatch = detailHtml.match(/<div[^>]*class="[^"]*(?:vaga-conteudo|vaga-descricao|job-description|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || detailHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || detailHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
          if (bodyMatch) description = decodeHtmlEntities(bodyMatch[1]).slice(0, 5000);
          else { const stripped = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, ""); description = decodeHtmlEntities(stripped).slice(0, 5000); }
          const salaryMatch = extractSalary(description);
          if (salaryMatch) { salaryMin = salaryMatch.min; salaryMax = salaryMatch.max; }
          const locMatch = detailHtml.match(/(?:local|cidade|location)\s*[:\-]\s*([^<\n,]+)/i);
          if (locMatch) location = decodeHtmlEntities(locMatch[1]).slice(0, 100);
        }

        const seniority = guessSeniority(job.title);
        const modality = guessModality(`${job.title} ${description} ${location}`);

        const { error } = await supabase.from("jobs").upsert({
          title: job.title, slug: job.slug, description,
          salary_min: salaryMin, salary_max: salaryMax,
          salary_currency: "BRL", salary_period: "monthly",
          location_city: location, location_state: "ES", location_country: "Brasil",
          modality, seniority, employment_type: "clt", is_internal: false,
          external_url: job.apply_url, external_source: "TrabalhaES",
          external_id: job.external_id, source_id: sourceId,
          status: "published", published_at: new Date().toISOString(), technologies: [],
        }, { onConflict: "external_id", ignoreDuplicates: false });

        if (error) console.error("upsert error", job.external_id, error.message);
        else inserted++;
      } catch (e) { console.error("detail fetch failed", job.apply_url, (e as Error).message); }
    }

    if (sourceId) await supabase.from("job_sources").update({ jobs_found_total: jobs.length, jobs_imported_total: inserted, last_synced_at: new Date().toISOString() }).eq("id", sourceId);
    if (logId) await supabase.from("scraping_logs").update({ status: "success", jobs_found: jobs.length, jobs_imported: inserted, finished_at: new Date().toISOString() }).eq("id", logId);

    return new Response(JSON.stringify({ ok: true, found: jobs.length, inserted, sample: jobs.slice(0, 5).map((j) => ({ title: j.title, url: j.apply_url })) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = (err as Error).message;
    if (logId) await supabase.from("scraping_logs").update({ status: "error", error_message: message, finished_at: new Date().toISOString() }).eq("id", logId);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
