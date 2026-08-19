export async function createProductionSupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");

  return createClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
