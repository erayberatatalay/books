import { createClient } from "@supabase/supabase-js";

/**
 * Service role key kullanan admin client.
 *
 * DİKKAT: Bu dosya sadece server tarafında (Route Handler / Server Action)
 * import edilmelidir. Service role key RLS'i bypass eder ve kesinlikle
 * client bundle içine girmemelidir.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Admin işlemleri yapılamıyor."
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
