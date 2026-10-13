import { describe, expect, it } from "vitest";
import { postSchema } from "./postSchema";

describe("postSchema (Zod validate biên form)", () => {
  it("pass với input hợp lệ", () => {
    const r = postSchema.safeParse({ title: "Học React CRUD", body: "Nội dung đủ dài..." });
    expect(r.success).toBe(true);
  });

  it("fail khi title quá ngắn", () => {
    const r = postSchema.safeParse({ title: "ab", body: "Nội dung đủ dài..." });
    expect(r.success).toBe(false);
  });

  it("fail khi body quá ngắn", () => {
    const r = postSchema.safeParse({ title: "Tiêu đề ok", body: "ngắn" });
    expect(r.success).toBe(false);
  });

  it("trim trước khi check (chống space-only)", () => {
    const r = postSchema.safeParse({ title: "   ", body: "          " });
    expect(r.success).toBe(false);
  });
});
