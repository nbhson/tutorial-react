import { useMemo, useState, useDeferredValue } from "react";
import { useCreatePost, useDeletePost, usePosts, useUpdatePost } from "../hooks/usePosts";
import { useUiStore } from "../store/ui";
import { filterPosts } from "../lib/filter";
import { env } from "../lib/env";
import PostCard from "../components/PostCard";
import PostForm from "../components/PostForm";
import type { Post, PostInput } from "../types";

const EMPTY_INPUT: PostInput = { title: "", body: "", userId: 1 };

// Trang danh sách + tạo/sửa/xóa (ghép DAY 3 props, DAY 10 memo, DAY 11 form,
// DAY 12 query, nhóm 1 server/client state, nhóm 3 useDeferredValue cho search).
export default function PostsPage() {
  const { data: posts = [], isPending, isError, error, refetch } = usePosts(env.postsLimit);
  const createMut = useCreatePost(env.postsLimit);
  const updateMut = useUpdatePost(env.postsLimit);
  const deleteMut = useDeletePost(env.postsLimit);

  const search = useUiStore((s) => s.search);
  const setSearch = useUiStore((s) => s.setSearch);

  const [editing, setEditing] = useState<Post | null>(null);

  // useDeferredValue (React 18, nhóm 3): gõ search không block render list.
  const deferredQuery = useDeferredValue(search);
  const filtered = useMemo(() => filterPosts(posts, deferredQuery), [posts, deferredQuery]);

  const submitting = createMut.isPending || updateMut.isPending;

  function handleCreate(input: PostInput) {
    createMut.mutate(input);
  }

  function handleUpdate(input: PostInput) {
    if (!editing) return;
    updateMut.mutate(
      { id: editing.id, input },
      { onSuccess: () => setEditing(null) },
    );
  }

  function handleDelete(post: Post) {
    if (!window.confirm(`Xóa post #${post.id} "${post.title}"?`)) return;
    deleteMut.mutate(post.id);
  }

  return (
    <>
      {editing ? (
        <PostForm
          key={editing.id}
          heading={`Sửa post #${editing.id}`}
          initial={{ title: editing.title, body: editing.body, userId: editing.userId }}
          submitting={updateMut.isPending}
          submitLabel="Lưu thay đổi"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <PostForm
          key="create"
          heading="Tạo post mới"
          initial={EMPTY_INPUT}
          submitting={createMut.isPending}
          submitLabel="Thêm post"
          onSubmit={handleCreate}
        />
      )}

      <section className="toolbar">
        <input
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề / nội dung..."
          aria-label="Tìm kiếm bài viết"
        />
        <span className="muted">
          {filtered.length}/{posts.length} bài
        </span>
        <button className="ghost" onClick={() => refetch()}>
          Tải lại
        </button>
      </section>

      {isPending && <p>Đang tải posts...</p>}
      {isError && (
        <p className="error-box" role="alert">
          Lỗi tải dữ liệu: {error instanceof Error ? error.message : String(error)}
        </p>
      )}

      {!isPending && !isError && filtered.length === 0 && <p>Không có bài nào khớp.</p>}

      <section className="grid">
        {filtered.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            deleting={deleteMut.isPending && deleteMut.variables === post.id}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </section>

      {submitting && <span className="muted">Đang đồng bộ mutation...</span>}
    </>
  );
}
