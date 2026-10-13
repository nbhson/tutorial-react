import { memo } from "react";
import { Link } from "react-router-dom";
import type { Post } from "../types";

interface PostCardProps {
  post: Post;
  deleting: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

// memo (DAY 10 + nhóm 3_performance): card chỉ re-render khi props đổi.
// Kết hợp với list đã useDeferredValue ở page nên gõ search không giật.
function PostCard({ post, deleting, onEdit, onDelete }: PostCardProps) {
  return (
    <article className="card post">
      <div className="post-meta">
        <span className="badge">#{post.id}</span>
        <span className="muted">user {post.userId}</span>
        <Link to={`/posts/${post.id}`}>Chi tiết →</Link>
      </div>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <div className="row">
        <button onClick={() => onEdit(post)} disabled={deleting}>
          Sửa
        </button>
        <button className="danger" onClick={() => onDelete(post)} disabled={deleting}>
          {deleting ? "Đang xóa..." : "Xóa"}
        </button>
      </div>
    </article>
  );
}

export default memo(PostCard);
