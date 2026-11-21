// ✅ ĐÚNG: mặc định 30s cho mọi query, data tĩnh override Infinity
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
useQuery({ queryKey: ['tinh'], queryFn: fetchTinh, staleTime: Infinity }); // hiếm đổi
