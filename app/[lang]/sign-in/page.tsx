import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/next";
import { BuilderHeader } from "@/components/builder/builder-header";
import { SignInForm } from "@/components/auth/sign-in-form";
import { currentUser } from "@/lib/auth/session";
import { googleAuth } from "@/lib/auth/server";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).auth.metaTitle : undefined, robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const sp = await searchParams;
  const rawNext = sp.next;
  const rawError = typeof sp.error === "string" ? sp.error : undefined;
  const next = typeof rawNext === "string" ? rawNext : `/${lang}/build`;
  // Already signed in (e.g. a pricing "Choose" button): go straight to where they were headed.
  if (await currentUser()) redirect(safeNext(lang, next));
  const t = getMessages(lang);
  return (
    <>
      <BuilderHeader locale={lang} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
        <SignInForm locale={lang} t={t.auth} next={next} google={!!googleAuth} initialError={rawError === "google" || rawError === "tooMany" ? rawError : undefined} />
      </main>
    </>
  );
}
