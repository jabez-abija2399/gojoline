import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuilderHeader } from "@/components/builder/builder-header";
import { SignInForm } from "@/components/auth/sign-in-form";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).auth.metaTitle : undefined, robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const rawNext = (await searchParams).next;
  const next = typeof rawNext === "string" ? rawNext : `/${lang}/build`;
  if (await currentUser()) redirect(`/${lang}/build`);
  const t = getMessages(lang);
  return (
    <>
      <BuilderHeader locale={lang} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
        <SignInForm locale={lang} t={t.auth} next={next} />
      </main>
    </>
  );
}
