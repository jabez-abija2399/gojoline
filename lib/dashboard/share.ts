/** The address a printed QR code opens: `?src=qr` lets the visit count say it came from the code. */
export function qrTarget(href: string): string {
  const u = new URL(href);
  u.searchParams.set("src", "qr");
  return u.toString();
}

/** The dashboard's own "Open" link: `#me` tells the site not to count the owner's visits. */
export function ownerOpen(href: string): string {
  const u = new URL(href);
  u.hash = "me";
  return u.toString();
}

/** Share links for apps that take a URL (and text where they can). */
export function shareLinks(href: string, text: string) {
  const u = encodeURIComponent(href);
  const t = encodeURIComponent(text);
  return {
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  };
}

/** A file name for the poster: "selam-cafe-qr.png". */
export function posterName(siteName: string): string {
  const base = siteName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "site"}-qr.png`;
}
