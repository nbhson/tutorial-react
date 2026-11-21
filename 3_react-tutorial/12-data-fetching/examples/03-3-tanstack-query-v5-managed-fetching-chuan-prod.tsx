// TanStack Query v5 (prod) — npm i @tanstack/react-query
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, isPending, error, refetch } = useQuery({
  queryKey: ["users"], // identity cache + dedupe: 2 component cùng key chỉ 1 request
  queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`); // queryFn reject thì Query coi là lỗi để retry/isError
    return r.json();
  }),
  staleTime: 30_000, // 30s "tươi": remount trong 30s không fetch lại, hiện cache ngay
  retry: 2, // lỗi mạng retry 2 lần (không retry AbortError/hủy)
});
// Có sẵn: cache tới gcTime (5' mặc định), background refetch khi focus, placeholderData cho page...
