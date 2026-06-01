import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Profile;
};

/**
 * Mevcut oturum açmış kullanıcıyı ve profilini döndürür.
 * Oturum yoksa veya profil bulunamazsa null döner.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
  };
}
