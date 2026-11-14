"use client";

import { useActionState } from "react";
import { enterAccessCode } from "@/app/[lang]/build/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";

export function AccessForm({ locale, t }: { locale: Locale; t: Messages["builder"] }) {
  const [state, action, pending] = useActionState(enterAccessCode, { error: false });
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={locale} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{t.accessLabel}</Label>
        <Input id="code" name="code" required autoComplete="one-time-code" aria-invalid={state.error || undefined} aria-describedby={state.error ? "code-error" : undefined} />
        {state.error && <p id="code-error" role="alert" className="text-destructive">{t.accessWrong}</p>}
      </div>
      <Button type="submit" size="lg" aria-disabled={pending}>{t.accessSubmit}</Button>
    </form>
  );
}
