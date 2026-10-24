import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/validators";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  const wantsAdmin = next.startsWith("/admin");

  if (session && (!wantsAdmin || session.role === "admin")) redirect(next);

  return (
    <AuthShell
      title="Sign in"
      intro={wantsAdmin ? "Sign in with an admin account to manage the store." : "Track your orders and check out faster."}
    >
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
