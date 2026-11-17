import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Inline } from "@/lib/chat/markdown";

function inline(nodes: Inline[], key = ""): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    if (n.type === "text") return <Fragment key={k}>{n.text}</Fragment>;
    if (n.type === "code") return <code key={k} className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.9em]">{n.text}</code>;
    if (n.type === "bold") return <strong key={k} className="font-semibold">{inline(n.children, `${k}.`)}</strong>;
    return <em key={k}>{inline(n.children, `${k}.`)}</em>;
  });
}

/**
 * The AI's reply with a small markdown subset (bold, italic, code, lists, line breaks), built
 * as React elements: every piece of text is escaped by React, nothing is set as HTML.
 */
export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseMarkdown(text);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) => {
        if (b.type === "paragraph")
          return (
            <p key={i}>
              {b.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(line, `${i}.${j}.`)}
                </Fragment>
              ))}
            </p>
          );
        if (b.type === "bullets")
          return (
            <ul key={i} className="flex list-disc flex-col gap-1 ps-5">
              {b.items.map((it, j) => <li key={j}>{inline(it, `${i}.${j}.`)}</li>)}
            </ul>
          );
        return (
          <ol key={i} start={b.start} className="flex list-decimal flex-col gap-1 ps-5">
            {b.items.map((it, j) => <li key={j}>{inline(it, `${i}.${j}.`)}</li>)}
          </ol>
        );
      })}
    </div>
  );
}
