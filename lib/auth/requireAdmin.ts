import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./getCurrentUser";

/**
 * Admin rolündeki kullanıcıyı döndürür.
 * Oturum yoksa /login'e, admin değilse /dashboard'a yönlendirir.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
