// ❌ SAI: tạo client trong component — mỗi render reset cache
function App() { const qc = new QueryClient(); return <QueryClientProvider client={qc} />; }
// ✅ ĐÚNG: một client duy nhất ở module scope
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
export function App({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
