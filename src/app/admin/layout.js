import { requireAdmin } from "@/lib/session";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: { default: "Admin", template: "%s · Admin · AETHER" }, robots: { index: false } };

// The proxy already sends non-admins away; this is the second lock in case it is ever bypassed.
export default async function AdminLayout({ children }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-24 pt-24 md:px-8 md:pt-28">
      <AdminNav />
      <div className="mt-10">{children}</div>
    </div>
  );
}
