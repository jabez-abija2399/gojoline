import { describe, expect, it } from "vitest";
import { R2StorageProvider } from "./r2";

const ACCOUNT = "0123456789abcdef0123456789abcdef";

function fake(responses: Response[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return responses.shift() ?? new Response("", { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, r2: new R2StorageProvider({ accountId: ACCOUNT, accessKeyId: "k", secretAccessKey: "s", bucket: "gojoline", fetchImpl }) };
}

describe("R2StorageProvider", () => {
  it("puts with a signed path-style request and encodes the key", async () => {
    const { calls, r2 } = fake([new Response("")]);
    await r2.put("sites/abeni/d/x/about us.html", "hi", { contentType: "text/html", cacheControl: "no-cache" });
    expect(calls[0]!.url).toBe(`https://${ACCOUNT}.r2.cloudflarestorage.com/gojoline/sites/abeni/d/x/about%20us.html`);
    const h = calls[0]!.init.headers as Record<string, string>;
    expect(h.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=k\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=cache-control;content-type;host;x-amz-content-sha256;x-amz-date,/);
    expect(calls[0]!.init.method).toBe("PUT");
  });

  it("retries server errors, then gives up", async () => {
    const { calls, r2 } = fake([new Response("", { status: 503 }), new Response("")]);
    await r2.put("a", "b");
    expect(calls).toHaveLength(2);
    const failing = fake([new Response("", { status: 403 })]);
    await expect(failing.r2.put("a", "b")).rejects.toThrow("R2 put failed (403)");
    expect(failing.calls).toHaveLength(1);
  });

  it("returns null for a missing object and treats a missing delete as done", async () => {
    const { r2 } = fake([new Response("", { status: 404 }), new Response("", { status: 404 })]);
    expect(await r2.get("nope")).toBeNull();
    await expect(r2.delete("nope")).resolves.toBeUndefined();
  });

  it("lists keys and prefixes across pages", async () => {
    const page1 = `<ListBucketResult><IsTruncated>true</IsTruncated><NextContinuationToken>t+1</NextContinuationToken><Contents><Key>sites/a/current.json</Key></Contents><CommonPrefixes><Prefix>sites/a/d/1/</Prefix></CommonPrefixes></ListBucketResult>`;
    const page2 = `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>sites/a/x&amp;y.txt</Key></Contents></ListBucketResult>`;
    const { calls, r2 } = fake([new Response(page1), new Response(page2)]);
    expect(await r2.list("sites/a/", { delimiter: "/" })).toEqual({ keys: ["sites/a/current.json", "sites/a/x&y.txt"], prefixes: ["sites/a/d/1/"] });
    expect(calls[1]!.url).toContain("continuation-token=t%2B1");
    expect(calls[0]!.url).toContain("list-type=2");
  });

  it("deletes many keys with DeleteObjects, 1000 per request", async () => {
    const { calls, r2 } = fake([new Response("<DeleteResult/>"), new Response("<DeleteResult/>")]);
    await r2.deleteMany(Array.from({ length: 1001 }, (_, i) => `sites/a/d/1/f${i}&.js`));
    expect(calls).toHaveLength(2);
    expect(calls[0]!.url).toBe(`https://${ACCOUNT}.r2.cloudflarestorage.com/gojoline?delete=`);
    const h = calls[0]!.init.headers as Record<string, string>;
    expect(h["content-md5"]).toMatch(/==$/);
    expect(Buffer.from(calls[0]!.init.body as Uint8Array).toString()).toContain("<Key>sites/a/d/1/f0&amp;.js</Key>");
    const failing = fake([new Response("<DeleteResult><Error><Key>x</Key></Error></DeleteResult>")]);
    await expect(failing.r2.deleteMany(["x"])).rejects.toThrow();
  });

  it("refuses an account ID that isn't one", () => {
    expect(() => new R2StorageProvider({ accountId: "abc", accessKeyId: "k", secretAccessKey: "s", bucket: "b" })).toThrow();
  });
});
