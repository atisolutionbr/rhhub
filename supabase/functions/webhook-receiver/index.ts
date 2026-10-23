import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function guessSeniority(title: string): string {
  const t = (title || "").toLowerCase();
  if (/(tech lead|techlead|tl\b|arquiteto|arquiteta)/.test(t)) return "lead";
  if (/(sênior|senior|sr\.?)/.test(t)) return "senior";
  if (/(pleno|pl\.?)/.test(t)) return "mid";
  if (/(júnior|junior|jr\.?|trainee)/.test(t)) return "junior";
  return "mid";
}

function guessModality(text: string): string {
  const t = (text || "").toLowerCase();
  if (/(remoto|remote|home office)/.test(t)) return "remote";
  if (/(híbrido|hybrid)/.test(t)) return "hybrid";
  return "onsite";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Only POST is supported" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const payload = await req.json().catch(() => null);
    if (!payload) return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const jobs: Record<string, unknown>[] = Array.isArray(payload.jobs) ? payload.jobs : Array.isArray(payload) ? payload : [payload];
    let inserted = 0;
    const results: unknown[] = [];

    for (const item of jobs) {
      const title = String(item.title || item.job_title || "").slice(0, 200);
      const applyUrl = String(item.url || item.link || item.apply_url || item.external_url || "");
      const externalId = String(item.id || item.external_id || applyUrl || crypto.randomUUID());

      if (!title || !applyUrl) { results.push({ ok: false, error: "title and url are required", item }); continue; }

      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) + "-wh-" + externalId.slice(-10);

      const { data, error } = await supabase.from("jobs").upsert({
        title, slug, description: String(item.description || item.summary || "").slice(0, 5000),
        salary_min: (item.salary_min as number) ?? null, salary_max: (item.salary_max as number) ?? null,
        salary_currency: (item.salary_currency as string) || "BRL", salary_period: (item.salary_period as string) || "monthly",
        location_city: (item.location as string) || (item.city as string) || "Brasil",
        location_state: (item.state as string) || null, location_country: "Brasil",
        modality: (item.modality as string) || guessModality(`${title} ${item.description || ""}`),
        seniority: (item.seniority as string) || guessSeniority(title),
        employment_type: (item.employment_type as string) || "clt", is_internal: false,
        external_url: applyUrl, external_source: (item.source as string) || "webhook",
        external_id: externalId, source_id: (item.source_id as string) ?? null,
        status: "published", published_at: (item.posted_at as string) || new Date().toISOString(),
        technologies: (item.technologies as string[]) || [],
      }, { onConflict: "external_id", ignoreDuplicates: false }).select("id").maybeSingle();

      if (error) results.push({ ok: false, error: error.message, external_id: externalId });
      else { inserted++; results.push({ ok: true, id: data?.id, external_id: externalId }); }
    }

    return new Response(JSON.stringify({ ok: true, received: jobs.length, inserted, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
