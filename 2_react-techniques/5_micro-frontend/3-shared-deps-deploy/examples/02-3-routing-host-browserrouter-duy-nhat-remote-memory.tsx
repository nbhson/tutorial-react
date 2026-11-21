// ❌ SAI (remote): BrowserRouter riêng — đè URL host, refresh mất route
<BrowserRouter><Routes>...</Routes></BrowserRouter>
// ✅ ĐÚNG (remote): memory + basePath từ host — URL thật do host giữ
const router = createMemoryRouter(routes, { initialEntries: [basePath] });
<RouterProvider router={router} />
