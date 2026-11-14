import { readFileSync } from "node:fs";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import type { BuilderDeps } from "@/lib/builder/service";
import { MemoryAssetStore } from "@/lib/cloud/assets";
import { extractForms } from "@/lib/cloud/forms";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { DemoLLMProvider } from "@/lib/providers/llm/demo";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { publishSite, type PublishDeps } from "@/lib/publish/service";
import { MemoryRateLimiter } from "@/lib/rate-limit";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { handleUpdate, type BotDeps } from "./bot";
import { MemoryTelegramClient } from "./client";
import { TelegramNotifier } from "./notifier";
import { MemoryTelegramStore } from "./store";

const starter = readFileSync("templates/site/src/site.json", "utf8");
let deps: BotDeps;
let client: MemoryTelegramClient;
let store: MemoryTelegramStore;
let builder: BuilderDeps;
let publish: PublishDeps;
let n = 0;
const msg = (text: string, extra: Record<string, unknown> = {}, chatId = 42, type = "private") => ({
  update_id: ++n,
  message: { chat: { id: chatId, type }, from: { username: "abebe" }, text, ...extra },
});
const last = () => client.sent.at(-1)?.html ?? "";

beforeEach(() => {
  client = new MemoryTelegramClient();
  store = new MemoryTelegramStore();
  const projects = new MemoryProjectStore();
  builder = {
    store: projects,
    sandboxes: new MemorySandboxProvider({ "src/site.json": starter }),
    llm: new DemoLLMProvider(),
    usage: new MemoryUsageLogger(),
    model: "claude-opus-5-5",
    lock: new MemoryLock(),
    assets: new MemoryAssetStore(),
  };
  publish = { store: projects, sites: new MemorySiteStore(), sandboxes: builder.sandboxes, publisher: new MemoryPublishProvider(), lock: builder.lock, appUrl: "https://gojoline.com", assets: builder.assets };
  deps = { store, client, builder, publish, limiter: new MemoryRateLimiter(), isVerified: async () => true };
});

async function linked(locale: "en" | "am" = "en") {
  const code = await store.createLinkCode("alice", locale);
  await handleUpdate(deps, msg(`/start ${code}`));
  return code;
}

describe("telegram bot", () => {
  it("links a chat with a one-time code, once", async () => {
    const code = await linked("am");
    expect(last()).toContain("ተገናኝቷል");
    expect((await store.byUser("alice"))?.chatId).toBe("42");
    await handleUpdate(deps, msg(`/start ${code}`, {}, 99));
    expect(last()).toContain("expired");
    expect(await store.byChat("99")).toBeNull();
  });

  it("won't move a connected chat to another account", async () => {
    await linked();
    const other = await store.createLinkCode("mallory", "en");
    await handleUpdate(deps, msg(`/start ${other}`));
    expect(last()).toContain("already connected");
    expect((await store.byChat("42"))?.userId).toBe("alice");
  });

  it("tells the owner when an edit fails unexpectedly", async () => {
    await linked();
    await builder.store.createProject("alice", { name: "A", locale: "en" });
    deps.builder = { ...builder, sandboxes: { open: async () => { throw new Error("boom"); } } };
    await handleUpdate(deps, msg("make it blue"));
    expect(last()).toContain("couldn't make that change");
  });

  it("ignores repeated updates and group chats", async () => {
    await linked();
    const count = client.sent.length;
    const u = msg("/help");
    await handleUpdate(deps, u);
    await handleUpdate(deps, u);
    await handleUpdate(deps, msg("/help", {}, -100, "group"));
    expect(client.sent.length).toBe(count + 1);
  });

  it("asks unlinked chats to connect and never acts for them", async () => {
    await handleUpdate(deps, msg("make it green"));
    expect(last()).toContain("isn't connected");
  });

  it("edits the site through the agent and republishes it when live", async () => {
    await linked();
    const p = await builder.store.createProject("alice", { name: "Bole Buna", locale: "en" });
    await builder.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.json": starter } });
    await publishSite(publish, { id: "alice", verified: true }, p.id, "bole-buna");
    await handleUpdate(deps, msg("Abol Cafe"));
    expect(last()).toContain("live on your site");
    expect((await builder.store.latestVersion("alice", p.id))?.files["src/site.json"]).toContain('"en": "Abol Cafe"');
  });

  it("lets the owner pick a site and saves photos", async () => {
    await linked();
    await builder.store.createProject("alice", { name: "One", locale: "en" });
    const two = await builder.store.createProject("alice", { name: "<b>Two</b>", locale: "en" });
    await handleUpdate(deps, msg("/sites"));
    expect(last()).toContain("&lt;b&gt;Two&lt;/b&gt;");
    const listed = last().split("\n").findIndex((l) => l.includes("Two"));
    await handleUpdate(deps, msg(String(listed)));
    expect((await store.byUser("alice"))?.activeProjectId).toBe(two.id);
    client.files.set("f1", await sharp({ create: { width: 50, height: 40, channels: 3, background: "#fff" } }).jpeg().toBuffer());
    await handleUpdate(deps, msg("", { text: undefined, photo: [{ file_id: "f1", width: 50, height: 40 }] }));
    expect(last()).toContain("Photo saved as telegram-photo-");
    expect(await builder.assets!.list("alice", two.id)).toHaveLength(1);
  });

  it("disconnects with /stop", async () => {
    await linked();
    await handleUpdate(deps, msg("/stop"));
    expect(await store.byUser("alice")).toBeNull();
  });
});

describe("TelegramNotifier", () => {
  it("sends escaped answers with field labels in the owner's language", async () => {
    await linked("am");
    const projects = builder.store;
    const p = await projects.createProject("alice", { name: "Selam", locale: "am" });
    const form = extractForms(starter)[0]!;
    await new TelegramNotifier(store, client, projects).notify(
      { id: "s", siteId: "x", projectId: p.id, ownerId: "alice", formKey: "booking", kind: "booking", data: { name: "<script>x</script>", phone: "0911" }, lang: "am", readAt: null, createdAt: new Date() },
      form,
    );
    expect(last()).toContain("አዲስ ቀጠሮ ከSelam");
    expect(last()).toContain("<b>ስምዎ:</b> &lt;script&gt;x&lt;/script&gt;");
  });
});
