"use client";

import { useActionState, useEffect, useRef } from "react";
import { signInStep, type SignInState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";

export function SignInForm({ locale, t, next }: { locale: Locale; t: Messages["auth"]; next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInStep, { step: "contact" });
  const focusRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    focusRef.current?.focus();
  }, [state]);

  const error = state.error ? t.errors[state.error] : null;
  const hidden = (
    <>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="next" value={next} />
    </>
  );

  if (state.step === "code") {
    const shown = state.kind === "phone" ? state.to.replace(/^\+251/, "0") : state.to;
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t.codeTitle}</h2>
        <p className="text-ink-muted">{t.codeBody.replace("{to}", shown)}</p>
        <form action={action} className="flex flex-col gap-4" noValidate>
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
              aria-describedby={error ? "code-error" : undefined}
            />
            {error && <p id="code-error" role="alert" className="text-destructive">{error}</p>}
          </div>
          <Button type="submit" size="lg" aria-disabled={pending}>{pending ? t.verifying : t.verify}</Button>
        </form>
        <form action={action}>
          {hidden}
          <input type="hidden" name="intent" value="restart" />
          <button type="submit" className="min-h-11 font-medium text-teal underline underline-offset-4">{t.changeContact}</button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {hidden}
      <input type="hidden" name="intent" value="send" />
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact">{t.contactLabel}</Label>
        <Input
          ref={focusRef}
          id="contact"
          name="contact"
          autoComplete="tel"
          defaultValue={state.contact}
          maxLength={254}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "contact-error contact-hint" : "contact-hint"}
        />
        <p id="contact-hint" className="text-ink-muted">{t.contactHint}</p>
        {error && <p id="contact-error" role="alert" className="text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="lg" aria-disabled={pending}>{pending ? t.sending : t.sendCode}</Button>
    </form>
  );
}
