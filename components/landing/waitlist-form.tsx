"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { joinWaitlist, type WaitlistState } from "@/app/[lang]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";

interface Props {
  locale: Locale;
  t: Messages["waitlist"];
}

const initial: WaitlistState = { status: "idle" };

export function WaitlistForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Keep keyboard and screen-reader users oriented after each submit.
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error") {
      const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      target?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="flex items-start gap-3 rounded-xl border border-teal-mid bg-teal-soft p-6 text-teal">
        <CheckCircle2 aria-hidden="true" className="mt-1 size-6 shrink-0" />
        <div>
          <p className="text-lg font-semibold">{t.successTitle}</p>
          <p>{t.successBody}</p>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? state.values : { name: "", contact: "", business: "" };
  const formError = state.status === "error" ? state.formError : undefined;

  return (
    <form ref={formRef} action={action} onSubmit={(e) => pending && e.preventDefault()} noValidate className="flex flex-col gap-5" aria-describedby="waitlist-privacy">
      <input type="hidden" name="locale" value={locale} />
      {formError && (
        <p role="alert" tabIndex={-1} className="rounded-lg border border-destructive bg-clay-soft px-4 py-3 text-destructive">
          {t.errors[formError]}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="wl-name">{t.nameLabel}</Label>
        <Input
          id="wl-name"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "wl-name-error" : undefined}
        />
        {errors.name && <p id="wl-name-error" role="alert" className="text-destructive">{t.errors[errors.name]}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="wl-contact">{t.contactLabel}</Label>
        <Input
          id="wl-contact"
          name="contact"
          autoComplete="tel"
          required
          maxLength={254}
          defaultValue={values.contact}
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={errors.contact ? "wl-contact-error wl-contact-hint" : "wl-contact-hint"}
        />
        <p id="wl-contact-hint" className="text-base text-ink-muted">{t.contactHint}</p>
        {errors.contact && <p id="wl-contact-error" role="alert" className="text-destructive">{t.errors[errors.contact]}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="wl-business">{t.businessLabel}</Label>
        <Input
          id="wl-business"
          name="business"
          maxLength={80}
          placeholder={t.businessPlaceholder}
          defaultValue={values.business}
          aria-invalid={errors.business ? true : undefined}
          aria-describedby={errors.business ? "wl-business-error" : undefined}
        />
        {errors.business && <p id="wl-business-error" role="alert" className="text-destructive">{t.errors[errors.business]}</p>}
      </div>
      <Button type="submit" size="lg" aria-disabled={pending}>
        {pending ? t.submitting : t.submit}
      </Button>
      <p id="waitlist-privacy" className="text-base text-ink-muted">{t.privacy}</p>
    </form>
  );
}
