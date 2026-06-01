import { requireUser } from "@/lib/auth/requireUser";
import { getBookListItems } from "@/lib/server/books";
import { MyBooksTabs } from "@/components/books/MyBooksTabs";

export const dynamic = "force-dynamic";

export default async function MyBooksPage() {
  const user = await requireUser();
  const items = await getBookListItems(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Kitaplarım</h1>
      <p className="text-sm text-gray-500">
        Kendi okuma durumuna göre kitapların.
      </p>
      <MyBooksTabs items={items} />
    </div>
  );
}
