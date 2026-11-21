// Minh họa bọc Query đúng cho mỗi test (không dùng chung client giữa các test)
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
// render(
//   <QueryClientProvider client={makeClient()}> {/* client mới mỗi test, fail nhanh không retry */}
//     <UserList />
//   </QueryClientProvider>
// );
