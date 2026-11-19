import { BuildingPausedError } from "@/lib/providers/sandbox/paused";
import type { DomainStatus, PublishProvider, PublishResult } from "./types";

/** While building is paused nothing can be published; existing live sites stay as they are. */
export class PausedPublishProvider implements PublishProvider {
  readonly name = "paused";
  constructor(private base = "") {}
  urlFor(slug: string): string {
    // Always a valid URL (abuse reports parse a sample address): `.invalid` when no domain is set.
    return `https://${slug}.${this.base || "invalid"}`;
  }
  async publish(): Promise<PublishResult> {
    throw new BuildingPausedError();
  }
  async addDomain(): Promise<DomainStatus> {
    throw new BuildingPausedError();
  }
  async checkDomain(): Promise<DomainStatus> {
    throw new BuildingPausedError();
  }
  async removeDomain(): Promise<void> {
    throw new BuildingPausedError();
  }
}
