// "Query (Q20, Q32) + Suspense (loading state)"
function usePosts(id) {
  const q = useQuery({ queryKey: ["posts", id], queryFn: () => fetchPost(id) });
  if (q.isPending) throw q.promise;       // "suspense: chưa có → fallback"
  if (q.isError) throw q.error;           // "error boundary (Q 'error handling')"
  return q.data;
}
// "data có → render, chưa có → Suspense fallback (skeleton)"
