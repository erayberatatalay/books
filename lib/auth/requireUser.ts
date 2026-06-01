import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./getCurrentUser";

/**
 * Oturum açmış kullanıcıyı döndürür. Oturum yoksa /login'e yönlendirir.
 * Server Component'ler içinde kullanılır.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
