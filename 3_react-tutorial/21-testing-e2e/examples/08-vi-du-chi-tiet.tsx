// MSW mock network cho useFetch/useQuery — test 3 trạng thái sát thật:
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
const server = setupServer(http.get("/api/users", () => HttpResponse.json([{ id: 1, name: "Son" }])));
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close());
// Test: render -> getByText("Đang tải") -> findByText("Son") (thành công); server.use(http.get(..., () => new HttpResponse(null, { status: 500 }))) cho nhánh lỗi
