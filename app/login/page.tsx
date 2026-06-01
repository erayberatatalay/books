import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Giriş Yap · Ev Kitaplığım",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">📚</div>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Ev Kitaplığım</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ev içi kitap takip sistemine giriş yap
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Bu sistem yalnızca ev içi kullanım içindir.
        </p>
      </div>
    </div>
  );
}
