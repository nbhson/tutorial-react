const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

export const fmtVND = (n: number) => vnd.format(n); // test: expect(fmtVND(120000)).toBe("120.000 ₫")
export const fmtDate = (d: Date) => date.format(d);
