// SAI: 3 flag rời (isLoading/data/error) — các trạng thái mâu thuẫn có thể tồn tại (loading mà có error?)
type State = { isLoading: boolean; data: User[] | null; error: string | null };
// render phải đoán tổ hợp nào hợp lệ — không có type nào "bảo" bạn

// ĐÚNG: discriminated union — mỗi state chỉ có đúng field của nó
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }   // data chỉ có ở success, không phải null
  | { status: "error"; error: string };    // error chỉ có ở error
// TS narrow type theo status — mỗi case "biết" chính xác field nào hiện diện
