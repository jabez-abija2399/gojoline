import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { isLocale } from "@/lib/i18n/config";

/**
 * Checks access before anything streams: the loading skeleton (loading.tsx) would otherwise
 * send a 200 first, and non-admins must get the same 404 as a missing page. The page checks again.
 */
export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/admin`);
  if (!isAdmin(user)) notFound();
  return children;
}
