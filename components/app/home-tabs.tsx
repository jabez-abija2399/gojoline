"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, LayoutTemplate } from "lucide-react";
import { TabList } from "@/components/builder/tab-list";

const TABS = ["sites", "templates"] as const;
type Tab = (typeof TABS)[number];
const ICONS = { sites: LayoutGrid, templates: LayoutTemplate };

interface Props {
  label: string;
  labels: Record<Tab, string>;
  initial: Tab;
  sites: React.ReactNode;
  templates: React.ReactNode;
}

const fromHash = (): Tab | null => TABS.find((t) => `#${t}` === location.hash) ?? null;

/** "Your sites" and "Templates" under the start box. The sidebar's links (#sites, #templates) open them. */
export function HomeTabs({ label, labels, initial, sites, templates }: Props) {
  const [tab, setTab] = useState<Tab>(initial);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = (scroll: boolean) => {
      const wanted = fromHash();
      if (!wanted) return;
      setTab(wanted);
      if (scroll) wrapRef.current?.scrollIntoView({ block: "start" });
    };
    // After hydration, so the server and the browser agree on the first render.
    const id = setTimeout(() => sync(true), 0);
    const onHash = () => sync(true);
    window.addEventListener("hashchange", onHash);
    return () => {
      clearTimeout(id);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const panels: Record<Tab, React.ReactNode> = { sites, templates };
  return (
    <div ref={wrapRef} className="flex scroll-mt-16 flex-col gap-4 rounded-3xl border border-line bg-white p-3 shadow-sm sm:p-5">
      <TabList tabs={TABS} labels={labels} icons={ICONS} active={tab} onChange={setTab} label={label} idPrefix="home-tab" className="flex w-full rounded-xl bg-sunken p-1 sm:w-fit" />
      {TABS.map((id) => (
        <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`home-tab-${id}`} hidden={tab !== id}>
          {panels[id]}
        </div>
      ))}
    </div>
  );
}
