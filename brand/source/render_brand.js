// Render Gojoline brand SVGs to PNG exports and build a preview sheet.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BRAND = process.argv[2];
const FONTS = process.argv[3];
const PREVIEW_ONLY = process.argv[4] === 'preview';

const read = (p) => fs.readFileSync(path.join(BRAND, p), 'utf8');
const dataUri = (p) => 'data:image/svg+xml;base64,' + Buffer.from(read(p)).toString('base64');
const fontUri = (p) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(FONTS, p)).toString('base64');

async function shot(page, html, w, h, out, transparent) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } });
}

const imgPage = (src, w, h) =>
  `<html><body style="margin:0;background:transparent"><img src="${src}" style="display:block;width:${w}px;height:${h}px"></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  if (!PREVIEW_ONLY) {
    const png = path.join(BRAND, 'png');
    for (const s of [16, 32, 48, 64, 128, 256, 512, 1024]) {
      const src = s <= 48 ? 'logo/gojoline-mark-simple.svg' : 'logo/gojoline-mark.svg';
      await shot(page, imgPage(dataUri(src), s, s), s, s, path.join(png, `mark/gojoline-mark-${s}.png`), true);
    }
    for (const [name, size] of [['app-icon-1024', 1024], ['app-icon-512', 512], ['icon-192', 192], ['apple-touch-icon', 180]]) {
      await shot(page, imgPage(dataUri('icons/app-icon.svg'), size, size), size, size, path.join(png, `icons/${name}.png`), false);
    }
    for (const size of [512, 192]) {
      await shot(page, imgPage(dataUri('icons/maskable-icon.svg'), size, size), size, size, path.join(png, `icons/maskable-icon-${size}.png`), false);
    }
    await shot(page, imgPage(dataUri('icons/telegram-avatar.svg'), 640, 640), 640, 640, path.join(png, 'icons/telegram-avatar-640.png'), false);
    for (const s of [16, 32, 48]) {
      await shot(page, imgPage(dataUri('icons/favicon.svg'), s, s), s, s, path.join(png, `icons/favicon-${s}.png`), true);
    }
    // Lockups at 2x height 240
    for (const f of ['gojoline-logo', 'gojoline-logo-reversed', 'gojoline-logo-amharic', 'gojoline-logo-amharic-reversed', 'gojoline-logo-black', 'gojoline-logo-white', 'gojoline-logo-stacked', 'gojoline-wordmark']) {
      const svg = read(`logo/${f}.svg`);
      const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
      const scale = 480 / vh;
      const w = Math.round(vw * scale), h = 480;
      await shot(page, imgPage(dataUri(`logo/${f}.svg`), w, h), w, h, path.join(png, `logo/${f}.png`), true);
    }
    // Social share image
    const og = `<html><head><style>
      @font-face{font-family:Outfit;src:url(${fontUri('outfit/package/files/outfit-latin-700-normal.woff2')})}
      @font-face{font-family:Inter;src:url(${fontUri('inter/package/files/inter-latin-500-normal.woff2')})}
      @font-face{font-family:Ethi;src:url(${fontUri('noto-sans-ethiopic/package/files/noto-sans-ethiopic-ethiopic-700-normal.woff2')})}
      </style></head><body style="margin:0">
      <div style="width:1200px;height:630px;background:#FFF7F0;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box;gap:28px;font-family:Inter">
        <img src="${dataUri('logo/gojoline-logo.svg')}" style="height:120px;align-self:flex-start">
        <div style="font-family:Outfit;font-size:64px;line-height:1.05;color:#1C1917;letter-spacing:-0.02em">Describe your business.<br><span style="color:#C2410C">Get your home online.</span></div>
        <div style="font-family:Ethi;font-size:30px;color:#0E3B43">ቤትዎ በመስመር ላይ</div>
      </div></body></html>`;
    await shot(page, og, 1200, 630, path.join(png, 'social/og-image-1200x630.png'), false);
  }

  // Preview sheet (2x for people)
  const p2 = await browser.newPage({ deviceScaleFactor: 2 });
  const tile = (bg, inner, label) => `<div style="background:${bg};border-radius:20px;padding:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:200px;border:1px solid #E7E5E4"><div style="display:flex;align-items:center;justify-content:center;gap:18px">${inner}</div><div style="font:500 13px Inter;color:${bg === '#0E3B43' || bg === '#1C1917' || bg === '#C2410C' ? '#CDE3E5' : '#57534E'}">${label}</div></div>`;
  const im = (p, h) => `<img src="${dataUri(p)}" style="height:${h}px">`;
  const sheet = `<html><head><style>
    @font-face{font-family:Outfit;src:url(${fontUri('outfit/package/files/outfit-latin-700-normal.woff2')})}
    @font-face{font-family:Inter;font-weight:500;src:url(${fontUri('inter/package/files/inter-latin-500-normal.woff2')})}
    </style></head><body style="margin:0">
    <div style="width:1400px;background:#FFF7F0;padding:56px;box-sizing:border-box;display:flex;flex-direction:column;gap:24px;font-family:Inter">
      <div style="font:700 44px Outfit;color:#1C1917">Gojoline brand assets</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        ${tile('#FFFFFF', im('logo/gojoline-logo.svg', 120), 'Primary logo')}
        ${tile('#0E3B43', im('logo/gojoline-logo-reversed.svg', 120), 'Reversed, on deep teal')}
        ${tile('#FFFFFF', im('logo/gojoline-logo-amharic.svg', 120), 'Amharic logo')}
        ${tile('#1C1917', im('logo/gojoline-logo-amharic-reversed.svg', 120), 'Amharic, on dark')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
        ${tile('#FFFFFF', im('logo/gojoline-mark.svg', 150), 'Mark · full colour')}
        ${tile('#FFFFFF', im('logo/gojoline-mark-teal.svg', 150), 'Mark · teal variant')}
        ${tile('#E7E5E4', im('logo/gojoline-mark-black.svg', 150), 'One colour · black (true cut-out)')}
        ${tile('#C2410C', im('logo/gojoline-mark-white.svg', 150), 'One colour · white (true cut-out)')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
        ${tile('#FFFFFF', `<img src="${dataUri('icons/app-icon.svg')}" style="height:150px;border-radius:34px">`, 'App icon')}
        ${tile('#FFFFFF', `<img src="${dataUri('icons/app-icon-light.svg')}" style="height:150px;border-radius:34px;border:1px solid #E7E5E4">`, 'App icon · light')}
        ${tile('#FFFFFF', `<img src="${dataUri('icons/telegram-avatar.svg')}" style="height:150px;border-radius:999px">`, 'Telegram avatar')}
        ${tile('#FFFFFF', [128, 64, 32, 16].map(s => im(s <= 48 ? 'logo/gojoline-mark-simple.svg' : 'logo/gojoline-mark.svg', s)).join(''), 'Size test 128 · 64 · 32 · 16 px')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:24px">
        ${tile('#FFFFFF', im('logo/gojoline-logo-stacked.svg', 200), 'Stacked logo')}
        <div style="background:#FFFFFF;border-radius:20px;padding:28px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;border:1px solid #E7E5E4">
          ${[['#C2410C', 'Clay', 'Main'], ['#0E3B43', 'Deep teal', 'Partner'], ['#1C1917', 'Ink', 'Text'], ['#FFF7F0', 'Sand', 'Background']].map(([c, n, r]) => `<div style="display:flex;flex-direction:column;gap:8px"><div style="height:110px;border-radius:14px;background:${c};border:1px solid #E7E5E4"></div><div style="font:700 18px Outfit;color:#1C1917">${n}</div><div style="font:500 13px Inter;color:#57534E">${c} · ${r}</div></div>`).join('')}
        </div>
      </div>
    </div></body></html>`;
  await p2.setViewportSize({ width: 1400, height: 1500 });
  await p2.setContent(sheet, { waitUntil: 'load' });
  await p2.evaluate(() => document.fonts.ready);
  const h = await p2.evaluate(() => document.body.scrollHeight);
  await p2.setViewportSize({ width: 1400, height: h });
  await p2.screenshot({ path: path.join(BRAND, 'preview.png'), fullPage: true });
  await browser.close();
  console.log('done');
})();
