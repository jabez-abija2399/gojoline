/**
 * The avant style's pointer: a ring that trails the mouse and swells over links and pictures, and
 * buttons that lean towards it. Loaded only by avant sites, only with a fine pointer, never when
 * the visitor asks for less motion. The system cursor stays: the ring is decoration.
 */
export function startPointer(): () => void {
  const query = matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (!query.matches) return () => {};
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  // Inside the styled page, so its look stays with the style.
  (document.querySelector("[data-style]") ?? document.body).append(ring);
  let x = -100,
    y = -100,
    rx = x,
    ry = y,
    frame = 0;
  let pulled: HTMLElement | null = null;
  // Measured once, before it moves: measuring the moved button would make it wobble.
  let rest: DOMRect | null = null;
  let over = "";
  const release = () => {
    if (pulled) pulled.style.translate = "";
    pulled = null;
    rest = null;
  };
  const tick = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    frame = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
  };
  const move = (e: PointerEvent) => {
    // A finger on a touch-screen laptop moves nothing.
    if (e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    if (!frame) frame = requestAnimationFrame(tick);
    const target = e.target instanceof Element ? e.target : null;
    const now = target?.closest("img, .placeholder") ? "picture" : target?.closest("a, button, summary, input, select, textarea, label") ? "link" : "";
    if (now !== over || ring.dataset.over === undefined) ring.dataset.over = over = now;
    // Buttons lean a little towards the pointer while it is over them.
    const btn = target?.closest<HTMLElement>(".btn") ?? null;
    if (btn !== pulled) release();
    if (btn) {
      if (btn !== pulled) rest = btn.getBoundingClientRect();
      const r = rest!;
      btn.style.translate = `${(x - r.left - r.width / 2) * 0.25}px ${(y - r.top - r.height / 2) * 0.35}px`;
      pulled = btn;
    }
  };
  const leave = () => {
    ring.dataset.over = over = "gone";
    release();
  };
  let stop = () => {};
  // Turning on "reduce motion" (or unplugging the mouse) later stops it at once.
  const changed = () => {
    if (!query.matches) stop();
  };
  document.addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  query.addEventListener("change", changed);
  stop = () => {
    query.removeEventListener("change", changed);
    document.removeEventListener("pointermove", move);
    document.documentElement.removeEventListener("pointerleave", leave);
    cancelAnimationFrame(frame);
    release();
    ring.remove();
  };
  return () => stop();
}
