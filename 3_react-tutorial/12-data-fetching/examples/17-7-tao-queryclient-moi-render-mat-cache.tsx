// ❌ SAI: mỗi render client mới, cache xóa liên tục, loading mãi
function App() { const qc = new QueryClient(); return <QueryClientProvider client={qc}>...</QueryClientProvider>; }
