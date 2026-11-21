// ✅ MỖI LOẠI STATE MỘT NƠI — KHÔNG copy server data vào Zustand
const sidebarOpen = useUiStore((s) => s.sidebarOpen);   // client (Zustand)
const { data: user } = useQuery({
  queryKey: ["users", id],
  queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()), // server (Query)
});

// ❌ SAI: fetch rồi "thả" user vào Zustand = 2 nguồn sự thật, tự viết lại cache/retry/dedupe
