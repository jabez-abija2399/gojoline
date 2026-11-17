"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { TYPE_ICONS } from "./type-icons";
import type { Messages } from "@/lib/i18n";
import { FEEDBACK_TYPES, MAX_SCREENSHOT_BYTES, MESSAGE_MAX, MESSAGE_MIN, type Device, type FeedbackType } from "@/lib/feedback/types";

type Text = Messages["feedback"];
type ErrorCode = keyof Text["errors"];
type State = { kind: "idle" | "sending" | "sent" } | { kind: "error"; code: ErrorCode };

/** Phone, tablet or computer, from the pointer and the screen's short side (not the window, which may be narrow on a computer). */
function deviceType(): Device {
  if (!matchMedia("(pointer: coarse)").matches) return "computer";
  return Math.min(screen.width, screen.height) < 600 ? "phone" : "tablet";
}

/** `canAttach`: only owners with a confirmed email or phone may add a screenshot (the server checks too). */
export function FeedbackForm({ t, locale, page, initialType, canAttach }: { t: Text; locale: "en" | "am"; page: string | null; initialType: FeedbackType | null; canAttach: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [type, setType] = useState<FeedbackType | null>(initialType);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const typeRef = useRef<HTMLFieldSetElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const shotErrRef = useRef<HTMLParagraphElement>(null);
  // "Send another" puts focus back at the start of the form.
  const againRef = useRef(false);
  const code = state.kind === "error" ? state.code : null;
  const shotError = code === "screenshot" || code === "screenshot_size" || code === "screenshot_unverified" || code === "screenshot_quota";

  useEffect(() => {
    if (state.kind === "sent") sentRef.current?.focus();
    else if (code === "type") typeRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    else if (code === "message") messageRef.current?.focus();
    else if (shotError) (fileRef.current ?? shotErrRef.current)?.focus();
    else if (code) alertRef.current?.focus();
    else if (state.kind === "idle" && againRef.current) {
      againRef.current = false;
      typeRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [state, code, shotError]);

  const reset = () => {
    againRef.current = true;
    setState({ kind: "idle" });
    setType(null);
    setMessage("");
    setRating(null);
    setFile(null);
  };

  if (state.kind === "sent")
    return (
      <div className="flex flex-col items-start gap-3">
        <p ref={sentRef} tabIndex={-1} role="status" className="w-full rounded-xl border border-lagoon bg-white px-4 py-3 text-lg font-medium text-lagoon">
          {t.sent}
        </p>
        <p className="text-ink-muted">{t.sentBody}</p>
        <button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line px-4 font-medium hover:border-faint">
          {t.sendAnother}
        </button>
      </div>
    );

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    if (!type) return setState({ kind: "error", code: "type" });
    const trimmed = message.trim();
    if (trimmed.length < MESSAGE_MIN || trimmed.length > MESSAGE_MAX) return setState({ kind: "error", code: "message" });
    if (file && file.size > MAX_SCREENSHOT_BYTES) return setState({ kind: "error", code: "screenshot_size" });
    if (file && !file.type.startsWith("image/")) return setState({ kind: "error", code: "screenshot" });
    const body = new FormData();
    body.set("type", type);
    body.set("message", trimmed);
    body.set("rating", rating ? String(rating) : "");
    body.set("page", page ?? "");
    body.set("locale", locale);
    body.set("device", deviceType());
    if (file) body.set("screenshot", file);
    setState({ kind: "sending" });
    const res = await fetch("/api/feedback", { method: "POST", body }).catch(() => null);
    const d: { error?: unknown } = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setState({ kind: "sent" });
      // My feedback (a server component) shows the new item.
      router.refresh();
      return;
    }
    const known = typeof d.error === "string" && d.error in t.errors ? (d.error as ErrorCode) : "failed";
    setState({ kind: "error", code: known });
  };

  const described = (id: string, err: boolean, errId: string) => (err ? `${id} ${errId}` : id);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset ref={typeRef} aria-describedby={code === "type" ? "fb-type-error" : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">{t.typeLabel}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FEEDBACK_TYPES.map((x) => {
            const Icon = TYPE_ICONS[x];
            return (
              <label
                key={x}
                className="relative flex min-h-24 cursor-pointer flex-col items-start gap-2 rounded-xl border border-line bg-white p-3 transition-colors hover:border-faint has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link"
              >
                <input type="radio" name="type" value={x} checked={type === x} onChange={() => setType(x)} aria-describedby={`fb-type-hint-${x}`} className="peer sr-only" />
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-sunken text-ink peer-checked:bg-ink peer-checked:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t.types[x]}</span>
                  <span id={`fb-type-hint-${x}`} className="text-sm text-ink-muted">{t.typeHints[x]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {code === "type" && <p id="fb-type-error" role="alert" className="text-destructive">{t.errors.type}</p>}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="fb-message" className="font-medium">{t.messageLabel}</label>
        <textarea
          ref={messageRef}
          id="fb-message"
          name="message"
          rows={5}
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={code === "message" || undefined}
          aria-describedby={described("fb-message-hint", code === "message", "fb-message-error")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-base aria-invalid:border-destructive"
        />
        <div className="flex flex-wrap justify-between gap-x-3 text-sm text-ink-muted">
          <p id="fb-message-hint">{t.messageHint}</p>
          <p aria-hidden="true" className="tabular-nums">{t.counter.replace("{n}", String(message.length))}</p>
        </div>
        {code === "message" && <p id="fb-message-error" role="alert" className="text-destructive">{t.errors.message}</p>}
      </div>

      <fieldset aria-describedby="fb-rating-hint" className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t.ratingLabel}</legend>
        <p id="fb-rating-hint" className="text-sm text-ink-muted">{t.ratingHint}</p>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex size-12 cursor-pointer items-center justify-center rounded-xl border border-line bg-white font-display text-lg font-bold hover:border-faint has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <span aria-hidden="true">{n}</span>
              <span className="sr-only">{`${n}, ${t.ratings[`r${n}` as keyof Text["ratings"]]}`}</span>
            </label>
          ))}
          {rating !== null && (
            <>
              <span className="text-sm font-medium text-ink">{t.ratings[`r${rating}` as keyof Text["ratings"]]}</span>
              <button type="button" onClick={() => setRating(null)} className="min-h-11 rounded-lg px-2 text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink">
                {t.ratingClear}
              </button>
            </>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <p id="fb-shot-label" className="font-medium">{t.screenshotLabel}</p>
        <p id="fb-shot-hint" className="text-sm text-ink-muted">{canAttach ? t.screenshotHint : t.screenshotVerify}</p>
        {!canAttach ? null : file ? (
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white ps-3">
            <ImagePlus aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (code && (code === "screenshot" || code === "screenshot_size")) setState({ kind: "idle" });
              }}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-sunken"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{t.screenshotRemove}</span>
            </button>
          </div>
        ) : (
          <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 font-medium hover:border-faint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link">
            <ImagePlus aria-hidden="true" className="size-5" />
            {t.screenshotChoose}
            <input
              ref={fileRef}
              type="file"
              name="screenshot"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,image/avif"
              aria-labelledby="fb-shot-label"
              aria-describedby={described("fb-shot-hint", shotError, "fb-shot-error")}
              aria-invalid={shotError || undefined}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && f.size > MAX_SCREENSHOT_BYTES) setState({ kind: "error", code: "screenshot_size" });
                else if (shotError) setState({ kind: "idle" });
              }}
              className="sr-only"
            />
          </label>
        )}
        {shotError && (
          <p ref={shotErrRef} tabIndex={-1} id="fb-shot-error" role="alert" className="text-destructive">
            {t.errors[code]}
          </p>
        )}
      </div>

      <p className="text-sm text-ink-muted">{t.autoNote}</p>
      {code && code !== "type" && code !== "message" && !shotError && (
        <p ref={alertRef} tabIndex={-1} role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">
          {t.errors[code]}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {state.kind === "sending" ? t.sending : ""}
      </p>
      <button type="submit" aria-disabled={state.kind === "sending"} className="min-h-12 rounded-lg bg-coral px-5 font-medium text-on-coral hover:bg-coral-hover aria-disabled:opacity-50 sm:w-fit">
        {state.kind === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}
