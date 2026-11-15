import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { projectAssets } from "@/lib/db/schema";

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  createdAt: Date;
}

/** Owner photos for a project. Every method is owner-scoped. (R2 replaces the bytes storage later.) */
export interface AssetStore {
  list(ownerId: string, projectId: string): Promise<Asset[]>;
  get(ownerId: string, projectId: string, name: string): Promise<(Asset & { data: Buffer }) | null>;
  /** All files with bytes, for writing into a sandbox. */
  files(ownerId: string, projectId: string): Promise<{ path: string; data: Buffer }[]>;
  add(ownerId: string, projectId: string, a: { name: string; mime: string; width: number; height: number; data: Buffer }): Promise<Asset>;
  remove(ownerId: string, projectId: string, name: string): Promise<void>;
  /** Bytes stored by this owner across all projects (quota). */
  totalBytes(ownerId: string): Promise<number>;
}

export const MAX_ASSET_BYTES_PER_USER = 150 * 1024 * 1024;

export const MAX_ASSETS_PER_PROJECT = 60;

const toAsset = (a: Asset): Asset => ({ id: a.id, projectId: a.projectId, name: a.name, mime: a.mime, width: a.width, height: a.height, size: a.size, createdAt: a.createdAt });

export class MemoryAssetStore implements AssetStore {
  private items: (Asset & { ownerId: string; data: Buffer })[] = [];
  async list(ownerId: string, projectId: string) {
    return this.items.filter((a) => a.ownerId === ownerId && a.projectId === projectId).map(toAsset);
  }
  async get(ownerId: string, projectId: string, name: string) {
    const a = this.items.find((x) => x.ownerId === ownerId && x.projectId === projectId && x.name === name);
    return a ? { ...a } : null;
  }
  async files(ownerId: string, projectId: string) {
    return this.items.filter((a) => a.ownerId === ownerId && a.projectId === projectId).map((a) => ({ path: `public/images/${a.name}`, data: a.data }));
  }
  async add(ownerId: string, projectId: string, a: { name: string; mime: string; width: number; height: number; data: Buffer }) {
    const item = { ...a, id: randomUUID(), ownerId, projectId, size: a.data.length, createdAt: new Date() };
    this.items.push(item);
    return toAsset(item);
  }
  async totalBytes(ownerId: string) {
    return this.items.filter((a) => a.ownerId === ownerId).reduce((n, a) => n + a.size, 0);
  }
  async remove(ownerId: string, projectId: string, name: string) {
    this.items = this.items.filter((a) => !(a.ownerId === ownerId && a.projectId === projectId && a.name === name));
  }
}

const listCols = {
  id: projectAssets.id,
  projectId: projectAssets.projectId,
  name: projectAssets.name,
  mime: projectAssets.mime,
  width: projectAssets.width,
  height: projectAssets.height,
  size: projectAssets.size,
  createdAt: projectAssets.createdAt,
};

export class DbAssetStore implements AssetStore {
  constructor(private db: Database) {}
  private where(ownerId: string, projectId: string) {
    return and(eq(projectAssets.ownerId, ownerId), eq(projectAssets.projectId, projectId));
  }
  async list(ownerId: string, projectId: string) {
    return this.db.select(listCols).from(projectAssets).where(this.where(ownerId, projectId)).orderBy(asc(projectAssets.createdAt));
  }
  async get(ownerId: string, projectId: string, name: string) {
    const [row] = await this.db.select().from(projectAssets).where(and(this.where(ownerId, projectId), eq(projectAssets.name, name))).limit(1);
    return row ?? null;
  }
  async files(ownerId: string, projectId: string) {
    const rows = await this.db.select({ name: projectAssets.name, data: projectAssets.data }).from(projectAssets).where(this.where(ownerId, projectId));
    return rows.map((r) => ({ path: `public/images/${r.name}`, data: r.data }));
  }
  async add(ownerId: string, projectId: string, a: { name: string; mime: string; width: number; height: number; data: Buffer }) {
    const [row] = await this.db.insert(projectAssets).values({ ...a, ownerId, projectId, size: a.data.length }).returning(listCols);
    return row!;
  }
  async totalBytes(ownerId: string) {
    const [row] = await this.db.select({ n: sql<number>`coalesce(sum(${projectAssets.size}), 0)::bigint` }).from(projectAssets).where(eq(projectAssets.ownerId, ownerId));
    return Number(row?.n ?? 0);
  }
  async remove(ownerId: string, projectId: string, name: string) {
    await this.db.delete(projectAssets).where(and(this.where(ownerId, projectId), eq(projectAssets.name, name)));
  }
}
