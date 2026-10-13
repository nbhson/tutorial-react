import { Link, useParams } from "react-router-dom";
import { usePost } from "../hooks/usePosts";

// Route chi tiết (DAY 14): /posts/:id — dùng usePost (queryKey detail),
// có các nhánh pending/error/empty rõ ràng cho a11y (nhóm 8).
export default function PostDetailPage() {
  const { id } = useParams();
  const numericId = Number(id);
  const { data: post, isPending, isError, error } = usePost(numericId);

  if (!Number.isFinite(numericId)) {
    return (
      <p className="error-box" role="alert">
        ID không hợp lệ: {id}
      </p>
    );
  }

  if (isPending) return <p>Đang tải post #{numericId}...</p>;
  if (isError) {
    return (
      <p className="error-box" role="alert">
        Lỗi tải post: {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }
  if (!post) return <p>Không tìm thấy post #{numericId}.</p>;

  return (
    <article className="card">
      <p>
        <Link to="/">← Về danh sách</Link>
      </p>
      <div className="post-meta">
        <span className="badge">#{post.id}</span>
        <span className="muted">user {post.userId}</span>
      </div>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </article>
  );
}
