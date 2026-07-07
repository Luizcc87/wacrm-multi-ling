import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseKeys } from "./validate";

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    validateSupabaseKeys(supabaseUrl, serviceRoleKey, 'service_role');
    adminClient = createClient(supabaseUrl, serviceRoleKey);
  }

  return adminClient;
}
