"use client";

import { useState } from "react";
import { CodePanel } from "@/components/builder/code-panel";
import type { Messages } from "@/lib/i18n";

/** Admin → Sites: a site's files, fetched only when a staff member opens them. */
export function SiteFiles({ t, label, siteId }: { t: Messages["builder"]; label: string; siteId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="inline-flex min-h-11 pointer-fine:min-h-9 cursor-pointer items-center font-medium text-ink underline underline-offset-4">{label}</summary>
      {open && (
        <div className="mt-2 flex min-h-0 flex-col">
          <CodePanel t={t} src={`/api/admin/sites/${siteId}/files`} viewOnly={false} />
        </div>
      )}
    </details>
  );
}
