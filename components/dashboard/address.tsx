import { Fragment } from "react";

/** A web address that wraps only after a dot or a hyphen ("bole-buna.<wbr>afridea.et"), never mid-word. */
export function Address({ text }: { text: string }) {
  const parts = text.split(/(?<=[.\-/])/);
  return (
    <span className="[overflow-wrap:anywhere]">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && <wbr />}
        </Fragment>
      ))}
    </span>
  );
}
