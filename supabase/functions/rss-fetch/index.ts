import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function decodeEntities(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function guessSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/(tech lead|techlead|tl\b|arquiteto|arquiteta)/.test(t)) return "lead";
  if (/(sênior|senior|sr\.?)/.test(t)) return "senior";
  if (/(pleno|pl\.?)/.test(t)) return "mid";
  if (/(júnior|junior|jr\.?|trainee)/.test(t)) return "junior";
  return "mid";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const sourceId = body.source_id;
    const feedUrl = body.feed_url;

    if (!feedUrl) return new Response(JSON.stringify({ ok: false, error: "feed_url is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const res = await fetch(feedUrl, { headers: { "User-Agent": "VagasTechBot/1.0 (RSS aggregator)", "Accept": "application/rss+xml, application/xml, text/xml, */*" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${feedUrl}`);

    const xml = await res.text();
    const items: Array<{ title: string; link: string; description: string; pubDate: string; guid: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(xml)) !== null && items.length < 50) {
      const block = m[1];
      const title = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "";
      const description = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "";
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
      const guid = block.match(/<guid>([\s\S]*?)<\/guid>/i)?.[1] ?? link;
      items.push({ title: decodeEntities(title), link: decodeEntities(link), description: decodeEntities(description).slice(0, 2000), pubDate: decodeEntities(pubDate), guid: decodeEntities(guid) });
    }

    let inserted = 0;
    for (const item of items) {
      const externalId = item.guid || item.link;
      if (!externalId) continue;
      const seniority = guessSeniority(item.title);
      const slug = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) + "-" + externalId.slice(-8);

      const { error } = await supabase.from("jobs").upsert({
        title: item.title.slice(0, 200), slug, description: item.description,
        salary_currency: "BRL", salary_period: "monthly",
        location_city: "Brasil", location_country: "Brasil",
        modality: "remote", seniority, employment_type: "clt", is_internal: false,
        external_url: item.link, external_source: "RSS", external_id: externalId,
        source_id: sourceId ?? null, status: "published",
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        technologies: [],
      }, { onConflict: "external_id", ignoreDuplicates: false });

      if (!error) inserted++;
    }

    if (sourceId) await supabase.from("job_sources").update({ jobs_found_total: items.length, jobs_imported_total: inserted, last_synced_at: new Date().toISOString() }).eq("id", sourceId);

    return new Response(JSON.stringify({ ok: true, found: items.length, inserted, source: feedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
