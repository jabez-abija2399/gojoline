import { describe, expect, it } from "vitest";
import { signV4, uriEncode } from "./sigv4";

describe("signV4", () => {
  it("matches the AWS documentation example (GET object with a Range header)", () => {
    const headers = signV4(
      { accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", region: "us-east-1", service: "s3" },
      { method: "GET", host: "examplebucket.s3.amazonaws.com", path: "/test.txt", headers: { range: "bytes=0-9" } },
      new Date("2013-05-24T00:00:00Z"),
    );
    expect(headers.Authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
    );
  });

  it("matches the AWS documentation example (list objects with a query string)", () => {
    const headers = signV4(
      { accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", region: "us-east-1", service: "s3" },
      { method: "GET", host: "examplebucket.s3.amazonaws.com", path: "/", query: { "max-keys": "2", prefix: "J" } },
      new Date("2013-05-24T00:00:00Z"),
    );
    expect(headers.Authorization).toContain("Signature=34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7");
  });

  it("encodes keys the way S3 expects", () => {
    expect(uriEncode("a b/c(1)*.html", true)).toBe("a%20b/c%281%29%2A.html");
    expect(uriEncode("a/b")).toBe("a%2Fb");
  });
});
