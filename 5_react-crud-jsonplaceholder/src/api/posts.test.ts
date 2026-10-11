import { describe, expect, it, vi, afterEach } from "vitest";
import { checkOk, getPosts } from "./posts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkOk", () => {
  it("throw khi HTTP lỗi (fetch vẫn resolve)", async () => {
    const res = new Response("not found", { status: 404, statusText: "Not Found" });
    await expect(checkOk(res)).rejects.toThrow("HTTP 404");
  });

  it("pass khi ok", async () => {
    const res = new Response("ok", { status: 200 });
    await expect(checkOk(res)).resolves.toBe(res);
  });
});

describe("getPosts", () => {
  it("gọi đúng URL có _limit và parse json", async () => {
    const fake = [{ id: 1, userId: 1, title: "a", body: "b" }];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fake), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await getPosts(undefined, 5);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("_limit=5");
    expect(data).toEqual(fake);
  });
});
