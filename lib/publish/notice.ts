/** Shared look of the plain notice pages (takedown, moved): brand ink on paper, no scripts. */
export const NOTICE_STYLE = `body{font-family:system-ui,"Noto Sans Ethiopic",sans-serif;max-width:36rem;margin:0 auto;padding:3rem 1rem;color:#121212;background:#FBF9F6;line-height:1.6}h1,h2{font-size:1.5rem;margin:0 0 .5rem}section{margin-bottom:2.5rem}a{color:#C2370F;display:inline-block;min-height:44px;line-height:44px}`;

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
