"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { signInStep, type SignInState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";

export function SignInForm({ locale, t, next }: { locale: Locale; t: Messages["auth"]; next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInStep, { step: "contact" });
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
