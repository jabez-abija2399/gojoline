import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

/** Stops or restarts something that moves by itself (a ribbon, a strip, a photo wall). */
export function PauseButton({ paused, onToggle, photos = false, className = "" }: { paused: boolean; onToggle: () => void; photos?: boolean; className?: string }) {
  const { lang } = useSite();
  const label = uiText(paused ? (photos ? "playPhotos" : "play") : photos ? "pausePhotos" : "pause", lang);
  return (
    <button type="button" onClick={onToggle} aria-pressed={paused} aria-label={label} title={label} className={`pause-btn ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
        {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
      </svg>
    </button>
  );
}
