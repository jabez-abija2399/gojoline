"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInStep, type SignInState, signInWithGoogle } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";

export function SignInForm({ locale, t, next, google, initialError }: { locale: Locale; t: Messages["auth"]; next: string; google: boolean; initialError?: "google" | "tooMany" }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInStep, { step: "contact", error: initialError });
  const focusRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  // Move focus after each step change, but not on first load (the phone keyboard would cover the page).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    focusRef.current?.focus();
  }, [state]);

  const error = state.error ? t.errors[state.error] : null;
  const hidden = (
    <>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="next" value={next} />
    </>
  );
  const guard = (e: React.FormEvent) => {
    if (pending) e.preventDefault();
  };

  if (state.step === "code") {
    const shown = state.kind === "phone" ? state.to.replace(/^\+251/, "0") : state.to;
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{t.codeTitle}</h1>
        <p id="code-body" className="text-ink-muted">{t.codeBody.replace("{to}", shown)}</p>
        <form action={action} onSubmit={guard} className="flex flex-col gap-4" noValidate>
          {hidden}
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">{t.codeLabel}</Label>
            <Input
              ref={focusRef}
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              className="text-xl tracking-[0.3em]"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "code-error code-body" : "code-body"}
            />
            {error && <p id="code-error" role="alert" className="text-destructive">{error}</p>}
          </div>
          <Button type="submit" size="lg" disabled={pending}>{pending ? t.verifying : t.verify}</Button>
        </form>
        <div className="flex flex-col items-start gap-1">
          <form action={action} onSubmit={guard}>
            {hidden}
            <input type="hidden" name="intent" value="send" />
            <input type="hidden" name="contact" value={state.to} />
            <button type="submit" disabled={pending} className="min-h-11 font-medium text-teal underline underline-offset-4 disabled:opacity-50">
              {t.resend}
            </button>
          </form>
          <form action={action} onSubmit={guard}>
            {hidden}
            <input type="hidden" name="intent" value="restart" />
            <button type="submit" disabled={pending} className="min-h-11 font-medium text-teal underline underline-offset-4 disabled:opacity-50">
              {t.changeContact}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-ink-muted">{t.body}</p>
      {google && (
        <>
          <form action={signInWithGoogle}>
            {hidden}
            <GoogleButton label={t.google} />
          </form>
          <p className="flex items-center gap-3 text-ink-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">{t.or}</p>
        </>
      )}
      <form action={action} onSubmit={guard} className="flex flex-col gap-4" noValidate>
        {hidden}
        <input type="hidden" name="intent" value="send" />
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact">{t.contactLabel}</Label>
          <Input
            ref={focusRef}
            id="contact"
            name="contact"
            autoComplete="username"
            defaultValue={state.contact}
            maxLength={254}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "contact-error contact-hint" : "contact-hint"}
          />
          <p id="contact-hint" className="text-ink-muted">{t.contactHint}</p>
          {error && (
            <p id="contact-error" role="alert" className="text-destructive">
              {error}{" "}
              {state.error === "unavailable" && (
                <Link href={`/${locale}#waitlist`} className="font-medium underline underline-offset-4">
                  {t.joinWaitlist}
                </Link>
              )}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={pending}>{pending ? t.sending : t.sendCode}</Button>
      </form>
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      onClick={(e) => pending && e.preventDefault()}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 font-medium hover:border-teal-mid aria-disabled:opacity-60"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {label}
    </button>
  );
}
