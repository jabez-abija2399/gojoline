import { PLAN_FEATURES, PLAN_IDS, storageLabel, type PlanFeatures, type PlanId } from "./plans";

/** One cell of the plan comparison: included or not, a number, or a phrase from the messages. */
export type Cell =
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "number"; n: number }
  | { kind: "upTo"; n: number }
  | { kind: "months"; n: number }
  | { kind: "size"; text: string }
  | { kind: "domainHelp"; value: "guide" | "done_for_you" }
  | { kind: "support"; value: PlanFeatures["support"] };

export const COMPARE_ROWS = [
  "sites",
  "changes",
  "rollover",
  "freeAddress",
  "ownDomain",
  "domainHelp",
  "noBadge",
  "answers",
  "dashboard",
  "languages",
  "templates",
  "telegramNotify",
  "telegramEdits",
  "storage",
  "download",
  "support",
] as const;
export type CompareRow = (typeof COMPARE_ROWS)[number];

const yesNo = (v: boolean): Cell => (v ? { kind: "yes" } : { kind: "no" });

function cell(row: CompareRow, f: PlanFeatures): Cell {
  switch (row) {
    case "sites":
      return f.maxSites > 1 ? { kind: "upTo", n: f.maxSites } : { kind: "number", n: f.maxSites };
    case "changes":
      return { kind: "number", n: f.monthlyEdits };
    case "rollover":
      return f.rolloverMonths > 1 ? { kind: "months", n: f.rolloverMonths } : { kind: "no" };
    case "freeAddress":
      return yesNo(f.freeAddress);
    case "ownDomain":
      return yesNo(f.customDomain);
    case "domainHelp":
      return f.domainHelp === "none" ? { kind: "no" } : { kind: "domainHelp", value: f.domainHelp };
    case "noBadge":
      return yesNo(!f.badge);
    case "answers":
      return { kind: "number", n: f.answersPerMonth };
    case "dashboard":
      return yesNo(f.ownerDashboard);
    case "languages":
      return yesNo(f.bilingualSites);
    case "templates":
      return yesNo(f.allTemplates);
    case "telegramNotify":
      return yesNo(f.telegramNotify);
    case "telegramEdits":
      return yesNo(f.telegramEdits);
    case "storage":
      return { kind: "size", text: storageLabel(f.storageBytes) };
    case "download":
      return yesNo(f.siteDownload);
    case "support":
      return { kind: "support", value: f.support };
  }
}

/** The full comparison table, generated from PLAN_FEATURES so it can't drift from the limits. */
export function planComparison(features: Record<PlanId, PlanFeatures> = PLAN_FEATURES): { row: CompareRow; cells: Record<PlanId, Cell> }[] {
  return COMPARE_ROWS.map((row) => ({ row, cells: Object.fromEntries(PLAN_IDS.map((p) => [p, cell(row, features[p])])) as Record<PlanId, Cell> }));
}

/** Highlight keys for a plan card, most important first; each maps to a message with {n}/{size}. */
export type Highlight =
  | { key: "sitesOne" | "freeAddress" | "ownDomainGuide" | "ownDomainForYou" | "badge" | "noBadge" | "telegramNotify" | "telegramEdits" | "download" | "supportChannel" | "supportChat" | "supportPriority" }
  | { key: "sitesMany" | "changes" | "changesRollover" | "answers"; n: number }
  | { key: "storage"; size: string };

export function planHighlights(plan: PlanId, features: Record<PlanId, PlanFeatures> = PLAN_FEATURES): Highlight[] {
  const f = features[plan];
  const out: Highlight[] = [];
  out.push(f.maxSites > 1 ? { key: "sitesMany", n: f.maxSites } : { key: "sitesOne" });
  if (f.domainHelp === "done_for_you") out.push({ key: "ownDomainForYou" });
  else if (f.customDomain) out.push({ key: "ownDomainGuide" });
  else out.push({ key: "freeAddress" });
  out.push({ key: f.rolloverMonths > 1 ? "changesRollover" : "changes", n: f.monthlyEdits });
  out.push({ key: f.badge ? "badge" : "noBadge" });
  out.push({ key: "answers", n: f.answersPerMonth });
  if (f.telegramEdits) out.push({ key: "telegramEdits" });
  if (f.telegramNotify) out.push({ key: "telegramNotify" });
  out.push({ key: "storage", size: storageLabel(f.storageBytes) });
  if (f.siteDownload) out.push({ key: "download" });
  out.push({ key: f.support === "priority" ? "supportPriority" : f.support === "chat" ? "supportChat" : "supportChannel" });
  return out;
}
