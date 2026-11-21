// TanStack Query v5 (prod) — `npm i @tanstack/react-query`
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, isPending, error, refetch } = useQuery({
  queryKey: ["users"], // identity cache + dedupe
  queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`); // reject để retry/isError
    return r.json();
  }),
  staleTime: 30_000, // 30s tươi
  retry: 2, // retry mạng 2 lần
});
