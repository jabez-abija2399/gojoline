/** "Chrome on Android", from a user agent: enough for the admin's card (the full string goes in a tooltip). */
export function shortAgent(ua: string | null): string | null {
  if (!ua) return null;
  const browser = /Edg(A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser\//.test(ua)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS\//.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS\//.test(ua)
            ? "Chrome"
            : /Version\/[\d.]+.*Safari\//.test(ua)
              ? "Safari"
              : null;
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /CrOS/.test(ua)
        ? "ChromeOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : null;
  if (browser && os) return `${browser} · ${os}`;
  return browser ?? os ?? ua.slice(0, 24);
}
