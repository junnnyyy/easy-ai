import { createClient } from "npm:@supabase/supabase-js@2";

// Edge Function 환경에서는 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가
// Supabase Secrets로 자동 주입된다.
export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
