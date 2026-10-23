import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const { email, password, user_type, full_name } = await req.json();

  if (
    typeof email !== "string" ||
    typeof password !== "string" || password.length < 8 ||
    !["candidate", "company"].includes(user_type) ||
    (full_name !== undefined && typeof full_name !== "string")
  ) {
    return new Response(JSON.stringify({ error: "Campos obrigatorios ausentes." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Public registration must never allow administrative roles.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message.includes("already registered") || error.message.includes("already exists")
      ? "Este email ja esta cadastrado."
      : error.message;
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (data.user) {
    const userId = data.user.id;

    await supabaseAdmin.from("users").upsert({
      id: userId,
      user_type,
      full_name: full_name || "",
      location_country: "Brasil",
    });

    if (user_type === "candidate") {
      await supabaseAdmin.from("candidate_profiles").upsert({
        user_id: userId,
        experience: [],
        education: [],
        certifications: [],
        languages: [],
        technologies: [],
      });
    }

    const { data: freePlan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id")
      .eq("slug", "free")
      .maybeSingle();

    if (freePlan) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        plan_id: freePlan.id,
        status: "active",
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
