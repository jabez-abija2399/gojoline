"use client";

import { useEffect } from "react";
import { markFeedbackRead } from "@/app/[lang]/feedback/actions";

/** Rendered only when the page showed a new reply: tells the server once the owner has seen it. */
export function MarkRepliesRead() {
  useEffect(() => {
    void markFeedbackRead();
  }, []);
  return null;
}
