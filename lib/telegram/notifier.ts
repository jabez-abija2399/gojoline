import type { FormDef } from "@/lib/cloud/forms";
import type { Submission, SubmissionNotifier } from "@/lib/cloud/types";
import type { ProjectStore } from "@/lib/projects/types";
import { escapeHtml, type TelegramClient } from "./client";
import { botText, fill, kindNames } from "./messages";
import type { TelegramStore } from "./store";

/** Sends each new form answer to the owner's linked Telegram chat. */
export class TelegramNotifier implements SubmissionNotifier {
  constructor(
    private store: TelegramStore,
    private client: TelegramClient,
    private projects: ProjectStore,
  ) {}

  async notify(s: Submission, form: FormDef) {
    const link = await this.store.byUser(s.ownerId);
    if (!link) return;
    const project = await this.projects.getProject(s.ownerId, s.projectId);
    const lang = link.locale;
    const label = (name: string) => {
      const f = form.fields.find((x) => x.name === name);
      return f?.label[lang] ?? f?.label.en ?? f?.label.am ?? name;
    };
    const title = fill(botText[lang].newAnswer, { kind: kindNames[lang][form.kind], site: project?.name || form.id });
    // Shorten before escaping so a cut never splits an entity or tag.
    const short = (v: string, n: number) => (v.length > n ? `${v.slice(0, n)}…` : v);
    const lines = Object.entries(s.data).slice(0, 15).map(([k, v]) => `<b>${escapeHtml(short(label(k), 60))}:</b> ${escapeHtml(short(v, 200))}`);
    await this.client.sendMessage(link.chatId, [`<b>${escapeHtml(title)}</b>`, ...lines].join("\n"));
  }
}
