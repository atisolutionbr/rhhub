import { jwtVerify } from "jsr:@panva/jose@6";

const functions = new Set(["create-user", "parse-resume", "csv-import", "rss-fetch", "scrape-tech-jobs", "scrape-trabalhaes", "webhook-receiver"]);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-webhook-token", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const reply = (status: number, error: string) => Response.json({ error }, { status, headers: cors });
const key = new TextEncoder().encode(Deno.env.get("JWT_SECRET"));
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const name = new URL(req.url).pathname.split("/")[1];
  if (!functions.has(name)) return reply(404, "Função não encontrada.");
  if (["scrape-tech-jobs", "scrape-trabalhaes", "rss-fetch", "csv-import", "webhook-receiver"].includes(name)) return reply(410, "Importador legado desativado. A coleta usa somente fontes públicas documentadas pelo serviço rhhub-sync.");
  if (!["GET", "POST"].includes(req.method)) return reply(405, "Método não permitido.");
  if (name === "webhook-receiver") {
    const secret = Deno.env.get("WEBHOOK_TOKEN");
    if (!secret || req.headers.get("x-webhook-token") !== secret) return reply(401, "Webhook não autorizado.");
  } else {
    let claims;
    try {
      const authorization = req.headers.get("authorization") || "";
      if (!authorization.startsWith("Bearer ")) return reply(401, "Autenticação necessária.");
      claims = (await jwtVerify(authorization.slice(7), key, { algorithms: ["HS256"] })).payload;
    } catch { return reply(401, "Sessão inválida ou expirada."); }
    if (!["anon", "authenticated", "service_role"].includes(String(claims.role))) return reply(401, "Sessão inválida.");
    if (name !== "create-user" && claims.role !== "service_role") {
      if (claims.role !== "authenticated" || !claims.sub || !/^[0-9a-f-]{36}$/i.test(claims.sub)) return reply(401, "Entre na sua conta para continuar.");
      if (name === "parse-resume") {
        const body = await req.clone().json().catch(() => null);
        if (typeof body?.file_path !== "string" || !body.file_path.startsWith(claims.sub + "/") || body.file_path.split("/").some((part: string) => part === "." || part === "..")) return reply(403, "Acesso ao currículo não autorizado.");
      } else {
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/users?id=eq.${encodeURIComponent(claims.sub)}&select=user_type`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, signal: AbortSignal.timeout(10000),
        });
        const rows = await response.json().catch(() => []);
        if (!response.ok || rows[0]?.user_type !== "admin") return reply(403, "Acesso administrativo necessário.");
      }
    }
  }
  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: `/home/deno/functions/${name}`,
      memoryLimitMb: 128, workerTimeoutMs: 90000, cpuTimeLimitMs: 10000,
      noModuleCache: false, envVars: Object.entries(Deno.env.toObject()),
    });
    return await worker.fetch(req);
  } catch {
    console.error(`Function worker failed: ${name}`);
    return reply(503, "Não foi possível processar a solicitação. Tente novamente.");
  }
});
