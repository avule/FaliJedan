import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            FaliJedan
          </Link>
          <p className="mt-2 text-muted-foreground">Prijavi se na nalog</p>
        </div>
        <LoginForm next={searchParams.next} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nemaš nalog?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registruj se
          </Link>
        </p>
      </div>
    </main>
  );
}
