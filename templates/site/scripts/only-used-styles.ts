import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const siteJson = fileURLToPath(new URL("../src/site.json", import.meta.url));

/** Styles that ship in their own file: only a site that uses one gets its CSS (it blocks the first paint), and only avant sites get the pointer script. */
export function onlyUsedStyles(): Plugin {
  const own = /\/src\/(grand|avant|precise|monochrome|drafting|noir|folio|estate|voyage|museum)\.css$/;
  const readSite = () => {
    try {
      return readFileSync(siteJson, "utf8");
    } catch {
      return "";
    }
  };
  const style = () => {
    try {
      return (JSON.parse(readSite()) as { theme?: { style?: string } }).theme?.style;
    } catch {
      return undefined;
    }
  };
  return {
    name: "gojoline-only-used-styles",
    enforce: "pre",
    load(id) {
      // The avant pointer: other sites get an empty stand-in, so its code costs them nothing.
      if (/\/src\/components\/pointer\.ts$/.test(id.split("?")[0]!)) {
        this.addWatchFile(siteJson);
        return ["avant", "folio"].includes(style() ?? "") ? null : "export function startPointer() { return () => {}; }";
      }
      // The software drawings: only for a site that shows one.
      if (/\/src\/components\/art-app\.tsx$/.test(id.split("?")[0]!)) {
        this.addWatchFile(siteJson);
        return /"art"\s*:\s*"(dashboard|mobile|chart)"/.test(readSite()) ? null : "export const appScenes = {};";
      }
      const m = own.exec(id.split("?")[0]!);
      if (!m) return null;
      this.addWatchFile(siteJson);
      return style() === m[1] ? readFileSync(id.split("?")[0]!, "utf8") : "";
    },
    handleHotUpdate({ file, server }) {
      if (file !== siteJson) return;
      for (const mod of server.moduleGraph.idToModuleMap.values()) if (mod.id && (own.test(mod.id.split("?")[0]!) || /\/src\/components\/(pointer\.ts|art-app\.tsx)$/.test(mod.id.split("?")[0]!))) server.reloadModule(mod);
    },
  };
}
