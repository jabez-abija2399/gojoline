# Regenerating the brand assets

All logo and icon files are generated from `build_brand.py` (SVG) and `render_brand.js` (PNG exports and `preview.png`).

```bash
mkdir -p /tmp/fonts && cd /tmp/fonts
npm pack @fontsource/outfit @fontsource/noto-sans-ethiopic @fontsource/inter
for f in *.tgz; do tar xzf "$f"; mv package "$(echo $f | sed -E 's/fontsource-(.*)-[0-9.]+\.tgz/\1/')"; mkdir -p tmp; done
pip install fonttools brotli
python3 brand/source/build_brand.py brand /tmp/fonts
node brand/source/render_brand.js brand /tmp/fonts
```

The fonts folder must contain `outfit/package/...`, `noto-sans-ethiopic/package/...` and `inter/package/...` as unpacked from npm (adjust the move step if needed). Rendering needs Playwright with Chromium.
