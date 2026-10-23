import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TECH_KEYWORDS = [
  "desenvolvedor", "developer", "engenheiro", "engineer", "programador", "programmer",
  "frontend", "backend", "fullstack", "full stack", "full-stack",
  "devops", "sre", "site reliability", "platform",
  "data scientist", "data engineer", "data analyst", "cientista de dados",
  "machine learning", "ml engineer", "ai engineer", "ia",
  "mobile", "android", "ios", "flutter", "react native",
  "tech lead", "arquiteto", "architect", "tech lead",
  "qa", "quality assurance", "teste", "tester", "automação",
  "security", "segurança", "cybersecurity", "pentest",
  "cloud", "aws", "azure", "gcp",
  "python", "java", "javascript", "typescript", "react", "node",
  "go", "rust", "ruby", "php", "c#", ".net", "kotlin", "swift",
  "scrum master", "product owner", "product manager", "gerente de produto",
  "ux", "ui", "designer", "product designer",
  "analista de sistemas", "analista de ti", "analista de suporte",
  "suporte técnico", "help desk", "sysadmin", "administrador de redes",
  "banco de dados", "database", "dba", "sql",
  "infraestrutura", "infrastructure",
];

function isTechJob(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return TECH_KEYWORDS.some((kw) => text.includes(kw));
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractSalary(text: string): { min: number; max: number } | null {
  const patterns = [
    /R\$\s*([\d.,]+)\s*(?:a|até)\s*R\$\s*([\d.,]+)/i,
    /([\d.,]+)\s*(?:a|até)\s*([\d.,]+)\s*(?:reais)?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const min = parseInt(m[1].replace(/\./g, "").replace(",", ""));
      const max = parseInt(m[2].replace(/\./g, "").replace(",", ""));
      if (min > 0 && max > 0 && min <= max) return { min, max };
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

interface ScrapedJob {
  title: string;
  description: string;
  external_url: string;
  external_id: string;
  external_source: string;
  location_city: string;
  location_state: string;
  salary_min: number | null;
  salary_max: number | null;
}

async function scrapeGupy(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const res = await fetch("https://www.gupy.com.br/trabalhe-conosco?jobTitle=desenvolvedor", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return jobs;
    const html = await res.text();
    const jobLinks = html.matchAll(/href="(\/[^"]*\/job\/[^"]*)"/gi);
    const seen = new Set<string>();
    for (const m of jobLinks) {
      const path = m[1];
      const idMatch = path.match(/\/job\/(\d+)/);
      if (!idMatch) continue;
      const externalId = `gupy-${idMatch[1]}`;
      if (seen.has(externalId)) continue;
      seen.add(externalId);
      const fullUrl = `https://www.gupy.com.br${path}`;
      const ctx = html.slice(Math.max(0, m.index - 300), m.index + 300);
      const titleMatch = ctx.match(/<[^>]*>([^<]{5,100})<\/[^>]*>/);
      const title = titleMatch ? decodeHtml(titleMatch[1]) : "Vaga de Tecnologia";
      if (!isTechJob(title, "")) continue;
      jobs.push({
        title, description: "Vaga de tecnologia no Gupy. Acesse o link para mais detalhes.",
        external_url: fullUrl, external_id: externalId, external_source: "Gupy",
        location_city: "", location_state: "",
        salary_min: null, salary_max: null,
      });
      if (jobs.length >= 15) break;
    }
  } catch (e) { console.error("Gupy error:", (e as Error).message); }
  return jobs;
}

async function scrapeMelhoresEmpregos(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const res = await fetch("https://www.melhoresempregos.com/vagas?cargo=tecnologia", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return jobs;
    const html = await res.text();
    const jobLinks = html.matchAll(/href="(\/vaga\/[^"]*)"/gi);
    const seen = new Set<string>();
    for (const m of jobLinks) {
      const path = m[1];
      const idMatch = path.match(/\/vaga\/([^\/\?]+)/);
      if (!idMatch) continue;
      const externalId = `melhores-${idMatch[1]}`;
      if (seen.has(externalId)) continue;
      seen.add(externalId);
      const fullUrl = `https://www.melhoresempregos.com${path}`;
      const ctx = html.slice(Math.max(0, m.index - 300), m.index + 300);
      const titleMatch = ctx.match(/<[^>]*>([^<]{5,100})<\/[^>]*>/);
      const title = titleMatch ? decodeHtml(titleMatch[1]) : "Vaga de Tecnologia";
      if (!isTechJob(title, "")) continue;
      jobs.push({
        title, description: "Vaga de tecnologia no Melhores Empregos.",
        external_url: fullUrl, external_id: externalId, external_source: "Melhores Empregos",
        location_city: "", location_state: "",
        salary_min: null, salary_max: null,
      });
      if (jobs.length >= 15) break;
    }
  } catch (e) { console.error("Melhores Empregos error:", (e as Error).message); }
  return jobs;
}

async function scrapeGlassdoor(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const res = await fetch("https://www.glassdoor.com/Job/tecnologia-jobs-SRCH_KO0,10.htm", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return jobs;
    const html = await res.text();
    const jobLinks = html.matchAll(/href="(\/partner\/jobListing\.htm[^"]*)"/gi);
    const seen = new Set<string>();
    for (const m of jobLinks) {
      const path = m[1];
      const idMatch = path.match(/jobListingId=(\d+)/);
      if (!idMatch) continue;
      const externalId = `glassdoor-${idMatch[1]}`;
      if (seen.has(externalId)) continue;
      seen.add(externalId);
      const fullUrl = `https://www.glassdoor.com${path}`;
      const ctx = html.slice(Math.max(0, m.index - 400), m.index + 400);
      const titleMatch = ctx.match(/<[^>]*>([^<]{5,100})<\/[^>]*>/);
      const title = titleMatch ? decodeHtml(titleMatch[1]) : "Vaga de Tecnologia";
      if (!isTechJob(title, "")) continue;
      jobs.push({
        title, description: "Vaga de tecnologia no Glassdoor.",
        external_url: fullUrl, external_id: externalId, external_source: "Glassdoor",
        location_city: "", location_state: "",
        salary_min: null, salary_max: null,
      });
      if (jobs.length >= 15) break;
    }
  } catch (e) { console.error("Glassdoor error:", (e as Error).message); }
  return jobs;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

    const [gupyJobs, melhoresJobs, glassdoorJobs] = await Promise.all([
      scrapeGupy(),
      scrapeMelhoresEmpregos(),
      scrapeGlassdoor(),
    ]);

    const allJobs = [...gupyJobs, ...melhoresJobs, ...glassdoorJobs];
    let inserted = 0;

    for (const job of allJobs) {
      const seniority = guessSeniority(job.title);
      const modality = guessModality(`${job.title} ${job.description}`);
      const salary = extractSalary(`${job.title} ${job.description}`);

      const { error } = await supabase.from("jobs").upsert({
        title: job.title,
        slug: `${job.external_id}`,
        description: job.description,
        salary_min: salary?.min || null,
        salary_max: salary?.max || null,
        salary_currency: "BRL",
        salary_period: "monthly",
        location_city: job.location_city || null,
        location_state: job.location_state || null,
        location_country: "Brasil",
        modality, seniority,
        employment_type: "clt",
        is_internal: false,
        external_url: job.external_url,
        external_source: job.external_source,
        external_id: job.external_id,
        status: "published",
        published_at: new Date().toISOString(),
        technologies: [],
      }, { onConflict: "external_id", ignoreDuplicates: true });

      if (!error) inserted++;
    }

    return new Response(JSON.stringify({
      ok: true, found: allJobs.length, inserted,
      sources: { gupy: gupyJobs.length, melhores: melhoresJobs.length, glassdoor: glassdoorJobs.length },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
