# Video renderer

Films a public page at phone size into a 1080×1920 MP4 for Admin → Posts (Step 3). `POST /render`
with `Authorization: Bearer $RENDERER_SECRET` and `{ url, style: "tour" | "spotlight" | "template", lang, text }`.

`POST /greeting` (2026-11-21) draws a holiday greeting card instead: `{lang, motif, text: {kicker, title, sub, footer}}`, where `motif` is one of meskel, flowers, star, water, dawn, crescent, mountains, sparkle (`lib.ts` MOTIFS). The browser for it has no network at all (every request is refused); the picture is there from the first frame (the networks' cover) and the words appear over 4.5 s, then it holds: an 8 s MP4 with the music, about 200 KB. Only the JPEG screenshots are kept (about 7 MB) and ffmpeg runs after Chromium has closed: measured on one CPU, about 9 s and a 523 MB peak (container limit 700 MB). Same secret, same one-at-a-time queue.
One video at a time, about 20 seconds long, made in roughly 30–90 seconds.

Music: J.S. Bach, Prelude in C major (BWV 846), performed by Kimiko Ishizaka, from the Open
Well-Tempered Clavier (CC0, archive.org item `bach-well-tempered-clavier-book-1`): the first 45 seconds.


`POST /story` (2026-11-22) draws a text video for posts with no page to film (a tip, myth, how-to, question, feature, idea, story or a custom post): `{lang, kicker, title, lines: [1–4], cta, footer}`. The hook is on screen from the first frame; each line slides in about every 2.4 s, then the ask. 11–14 s long, drawn at 10 frames a second in a browser with no network and JavaScript off, then held; about 270 KB, made in about 12 s on one CPU.
