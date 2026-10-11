import { useState } from 'react';

const POSTS = [
  { id: 1, title: 'Học React 19', excerpt: 'Actions, useOptimistic và ref as prop.' },
  { id: 2, title: 'React Compiler 1.0', excerpt: 'Auto-memoization, bỏ useMemo thủ công.' },
];

export default function MetadataDemo() {
  const [activeId, setActiveId] = useState(1);
  const post = POSTS.find((p) => p.id === activeId)!;

  return (
    <div>
      {/* React 19 hoist title/meta lên <head>, dedupe tự động */}
      <title>{post.title} — Blog React</title>
      <meta name="description" content={post.excerpt} />

      <h2>Document Metadata (React 19)</h2>
      <nav>
        {POSTS.map((p) => (
          <button key={p.id} onClick={() => setActiveId(p.id)}>
            {p.title}
          </button>
        ))}
      </nav>
      <article>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <p>
          <small>Mở DevTools → Elements → head để thấy title/meta đổi theo.</small>
        </p>
      </article>
    </div>
  );
}
