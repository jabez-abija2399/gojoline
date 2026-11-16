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
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = (focus: boolean) => {
      const wanted = fromHash();
      if (!wanted) return;
      setTab(wanted);
      wrapRef.current?.scrollIntoView({ block: "start" });
      // Arrived from the menu: focus lands on the tab, not lost on the page.
      if (focus) setTimeout(() => tabsRef.current?.querySelector<HTMLElement>(`#home-tab-${wanted}`)?.focus({ preventScroll: true }), 0);
    };
    // After hydration, so the server and the browser agree on the first render.
    const id = setTimeout(() => sync(false), 0);
    const onHash = () => sync(true);
    window.addEventListener("hashchange", onHash);
    return () => {
      clearTimeout(id);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const panels: Record<Tab, React.ReactNode> = { sites, templates };
  return (
    <div ref={wrapRef} className="flex scroll-mt-16 flex-col gap-4 rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-4">
      <div ref={tabsRef}>
        <TabList tabs={TABS} labels={labels} icons={ICONS} active={tab} onChange={setTab} label={label} idPrefix="home-tab" className="flex w-full rounded-xl bg-sunken p-1 sm:w-fit" />
      </div>
      {TABS.map((id) => (
        <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`home-tab-${id}`} hidden={tab !== id}>
          {panels[id]}
        </div>
      ))}
    </div>
  );
}
