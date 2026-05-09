import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            FaliJedan
          </Link>
          <p className="mt-2 text-muted-foreground">Napravi nalog</p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Već imaš nalog?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  );
}
