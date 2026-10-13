import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, deletePost, getPost, getPosts, updatePost } from "../api/posts";
import { postsKeys } from "../lib/queryClient";
import { env } from "../lib/env";
import { useUiStore } from "../store/ui";
import type { Post, PostInput } from "../types";

// READ list — queryKey có limit để phân trang sau này không sai cache (DAY 12).
export function usePosts(limit = env.postsLimit) {
  return useQuery({
    queryKey: postsKeys.list(limit),
    queryFn: ({ signal }) => getPosts(signal, limit),
  });
}

// READ detail — dùng cho route /posts/:id (DAY 14).
export function usePost(id: number) {
  return useQuery({
    queryKey: postsKeys.detail(id),
    queryFn: ({ signal }) => getPost(id, signal),
    enabled: Number.isFinite(id),
  });
}

// CREATE — API fake luôn trả id 101 nên sinh id local, prepend vào mọi list cache.
export function useCreatePost(limit = env.postsLimit) {
  const qc = useQueryClient();
  const flash = useUiStore((s) => s.flash);
  return useMutation({
    mutationFn: (input: PostInput) => createPost(input),
    onSuccess: (created, input) => {
      const withLocalId: Post = {
        ...created,
        ...input,
        id: created.id === 101 ? Date.now() : created.id,
      };
      qc.setQueryData<Post[]>(postsKeys.list(limit), (old) =>
        old ? [withLocalId, ...old] : [withLocalId],
      );
      flash(`Đã tạo post #${withLocalId.id} (API fake — lưu vào cache local).`);
    },
    onError: (e) => flash(`Tạo thất bại: ${e instanceof Error ? e.message : String(e)}`),
  });
}

// UPDATE — PUT rồi replace trong cache, giữ id cũ.
export function useUpdatePost(limit = env.postsLimit) {
  const qc = useQueryClient();
  const flash = useUiStore((s) => s.flash);
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PostInput }) => updatePost(id, input),
    onSuccess: (updated, { id, input }) => {
      qc.setQueryData<Post[]>(postsKeys.list(limit), (old) =>
        old ? old.map((p) => (p.id === id ? { ...updated, ...input, id } : p)) : old,
      );
      qc.setQueryData<Post>(postsKeys.detail(id), (old) =>
        old ? { ...updated, ...input, id } : old,
      );
      flash(`Đã cập nhật post #${id}.`);
    },
    onError: (e) => flash(`Sửa thất bại: ${e instanceof Error ? e.message : String(e)}`),
  });
}

// DELETE — confirm ở component, mutation chỉ lo API + filter cache.
export function useDeletePost(limit = env.postsLimit) {
  const qc = useQueryClient();
  const flash = useUiStore((s) => s.flash);
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Post[]>(postsKeys.list(limit), (old) =>
        old ? old.filter((p) => p.id !== id) : old,
      );
      qc.removeQueries({ queryKey: postsKeys.detail(id) });
      flash(`Đã xóa post #${id}.`);
    },
    onError: (e) => flash(`Xóa thất bại: ${e instanceof Error ? e.message : String(e)}`),
  });
}
