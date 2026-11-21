# Video renderer

Films a public page at phone size into a 1080×1920 MP4 for Admin → Posts (Step 3). `POST /render`
with `Authorization: Bearer $RENDERER_SECRET` and `{ url, style: "tour" | "spotlight" | "template", lang, text }`.
One video at a time, about 20 seconds long, made in roughly 30–90 seconds.

Music: J.S. Bach, Prelude in C major (BWV 846), performed by Kimiko Ishizaka, from the Open
Well-Tempered Clavier (CC0, archive.org item `bach-well-tempered-clavier-book-1`): the first 45 seconds.
