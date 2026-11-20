import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const siteJson = fileURLToPath(new URL("../src/site.json", import.meta.url));

/** Styles that ship in their own file: only a site that uses one gets its CSS (it blocks the first paint). */
export function onlyUsedStyles(): Plugin {
  const own = /\/src\/(grand|avant)\.css$/;
  const style = () => {
    try {
      return (JSON.parse(readFileSync(siteJson, "utf8")) as { theme?: { style?: string } }).theme?.style;
    } catch {
      return undefined;
    }
  };
  return {
    name: "gojoline-only-used-styles",
    enforce: "pre",
    load(id) {
      const m = own.exec(id.split("?")[0]!);
      if (!m) return null;
      this.addWatchFile(siteJson);
      return style() === m[1] ? readFileSync(id.split("?")[0]!, "utf8") : "";
    },
    handleHotUpdate({ file, server }) {
      if (file !== siteJson) return;
      for (const mod of server.moduleGraph.idToModuleMap.values()) if (mod.id && own.test(mod.id.split("?")[0]!)) server.reloadModule(mod);
    },
  };
}
