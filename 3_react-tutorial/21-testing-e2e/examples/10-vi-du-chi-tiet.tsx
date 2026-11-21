// TanStack Query trong test: client mới mỗi test + retry false (không chờ retry khi lỗi):
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(<QueryClientProvider client={qc}><Users /></QueryClientProvider>);
