function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      {/* Ba thẻ này được hoist vào <head> tự động */}
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <link rel="canonical" href={`https://site.com/${post.slug}`} />

      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
    </article>
  );
}
