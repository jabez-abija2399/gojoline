import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { MAX_ASSETS_PER_PROJECT } from "@/lib/cloud/assets";
import { assetName, MAX_UPLOAD_BYTES, processImage } from "@/lib/cloud/images";
import { services } from "@/lib/server/services";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/assets">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const assets = services().builder?.assets;
  return json(200, { assets: assets ? await assets.list(r.user.id, id) : [] });
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/assets">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "upload", perHour: 60 } });
  if (!r.ok) return r.response;
  const assets = services().builder?.assets;
  if (!assets) return json(503, { error: "unavailable" });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 100_000) return json(413, { error: "too_large" });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json(400, { error: "not_image" });
  if (file.size > MAX_UPLOAD_BYTES) return json(413, { error: "too_large" });
  const existing = await assets.list(r.user.id, id);
  if (existing.length >= MAX_ASSETS_PER_PROJECT) return json(409, { error: "too_many_photos" });
  const img = await processImage(Buffer.from(await file.arrayBuffer()));
  if (!img.ok) return json(img.error === "too_large" ? 413 : 415, { error: img.error });
  const names = new Set(existing.map((a) => a.name));
  const asset = await assets.add(r.user.id, id, { name: assetName(file.name, (n) => names.has(n)), mime: img.mime, width: img.width, height: img.height, data: img.data });
  return json(201, { asset });
}
