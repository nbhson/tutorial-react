// Angular: Observable + operators + interceptor
// this.http.get<User[]>("/api/users").pipe(retry(2), map(u => u.filter(...))).subscribe(...)

// React manual: Promise + .then + check tay (xem example.tsx)
fetch(url, { signal: ctrl.signal })
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((json: User[]) => setData(json));

// React prod: TanStack Query bọc Promise + cache/retry/dedupe (không viết tay)
const { data } = useQuery({ queryKey: ["users"], queryFn: () => fetch("/api/users").then((r) => { if (!r.ok) throw new Error("..."); return r.json(); }) });
