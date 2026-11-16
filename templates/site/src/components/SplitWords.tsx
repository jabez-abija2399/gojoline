/** A headline whose words rise into place one after another (motion.css). Read as one line of text. */
export function SplitWords({ text }: { text: string }) {
  const words = text.split(/(\s+)/);
  let n = 0;
  return (
    <>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span key={i} className="w" style={{ "--w": n++ } as React.CSSProperties}>
            {w}
          </span>
        ),
      )}
    </>
  );
}
