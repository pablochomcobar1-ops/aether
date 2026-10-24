import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/validators";

export const metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <AuthShell title="Create an account" intro="Save your details and see every order in one place.">
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
