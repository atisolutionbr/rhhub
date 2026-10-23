import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; } }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
      } else { field += ch; }
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

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

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";
    let sourceId: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const sourceIdField = formData.get("source_id");
      if (sourceIdField) sourceId = String(sourceIdField);
      if (file instanceof File) csvText = await file.text();
      else return new Response(JSON.stringify({ ok: false, error: "No file field in multipart data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      const body = await req.json().catch(() => null);
      if (!body || !body.csv) return new Response(JSON.stringify({ ok: false, error: "Send csv as JSON {csv: '...'} or multipart file" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      csvText = body.csv;
      sourceId = body.source_id ?? null;
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) return new Response(JSON.stringify({ ok: false, error: "CSV needs a header row and at least one data row" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const header = rows[0].map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const dataRows = rows.slice(1);
    const idx = (name: string) => header.indexOf(name);
    const iTitle = idx("title") ?? idx("titulo") ?? idx("cargo");
    const iUrl = idx("url") ?? idx("link") ?? idx("apply_url") ?? idx("external_url");
    const iDesc = idx("description") ?? idx("descricao");
    const iLoc = idx("location") ?? idx("local") ?? idx("cidade");
    const iSalMin = idx("salary_min") ?? idx("salario_min");
    const iSalMax = idx("salary_max") ?? idx("salario_max");
    const iModality = idx("modality") ?? idx("modalidade");
    const iSeniority = idx("seniority") ?? idx("senioridade");
    const iId = idx("id") ?? idx("external_id");
    const iTags = idx("tags") ?? idx("technologies");

    if (iTitle < 0 || iUrl < 0) return new Response(JSON.stringify({ ok: false, error: "CSV must have at least 'title' and 'url' columns" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let inserted = 0;
    const errors: { external_id: string; error: string }[] = [];

    for (const row of dataRows) {
      const title = (row[iTitle] || "").trim();
      const applyUrl = (row[iUrl] || "").trim();
      if (!title || !applyUrl) continue;
      const externalId = iId >= 0 ? (row[iId] || applyUrl).trim() : applyUrl;
      const seniority = iSeniority >= 0 ? (row[iSeniority] || guessSeniority(title)).trim() : guessSeniority(title);
      const modality = iModality >= 0 ? (row[iModality] || guessModality(title)).trim() : guessModality(title);
      const tags = iTags >= 0 ? (row[iTags] || "").split(";").map((t) => t.trim()).filter(Boolean) : [];
      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) + "-csv-" + String(externalId).slice(-10);

      const { error } = await supabase.from("jobs").upsert({
        title: title.slice(0, 200), slug, description: iDesc >= 0 ? (row[iDesc] || "").slice(0, 5000) : "",
        salary_min: iSalMin >= 0 ? parseInt(row[iSalMin]) || null : null,
        salary_max: iSalMax >= 0 ? parseInt(row[iSalMax]) || null : null,
        salary_currency: "BRL", salary_period: "monthly",
        location_city: iLoc >= 0 ? (row[iLoc] || "Brasil").trim() : "Brasil",
        location_country: "Brasil", modality, seniority, employment_type: "clt",
        is_internal: false, external_url: applyUrl, external_source: "CSV",
        external_id: externalId, source_id: sourceId, status: "published",
        published_at: new Date().toISOString(), technologies: tags,
      }, { onConflict: "external_id", ignoreDuplicates: false });

      if (error) errors.push({ external_id: externalId, error: error.message });
      else inserted++;
    }

    if (sourceId) await supabase.from("job_sources").update({ jobs_found_total: dataRows.length, jobs_imported_total: inserted, last_synced_at: new Date().toISOString() }).eq("id", sourceId);

    return new Response(JSON.stringify({ ok: true, total_rows: dataRows.length, inserted, errors: errors.slice(0, 10), error_count: errors.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
