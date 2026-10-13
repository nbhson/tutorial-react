import { describe, expect, it } from "vitest";
import { filterPosts } from "./filter";
import type { Post } from "../types";

const POSTS: Post[] = [
  { id: 1, userId: 1, title: "Học React Query", body: "Cache và dedupe" },
  { id: 2, userId: 1, title: "Học Zustand", body: "Client state nhẹ" },
  { id: 3, userId: 2, title: "Router v7", body: "Chi tiết bài viết" },
];

describe("filterPosts", () => {
  it("trả nguyên danh sách khi query rỗng", () => {
    expect(filterPosts(POSTS, "")).toHaveLength(3);
    expect(filterPosts(POSTS, "   ")).toHaveLength(3);
  });

  it("lọc không phân biệt hoa thường theo title", () => {
    expect(filterPosts(POSTS, "react")).toHaveLength(1);
    expect(filterPosts(POSTS, "HỌC")).toHaveLength(2);
  });

  it("lọc theo body", () => {
    expect(filterPosts(POSTS, "dedupe")).toHaveLength(1);
  });

  it("trả rỗng khi không khớp", () => {
    expect(filterPosts(POSTS, "không-tồn-tại")).toHaveLength(0);
  });
});
