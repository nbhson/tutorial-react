import { createContext, useContext, type ReactNode } from "react";

// Factory tạo context an toàn: dùng chung cho theme, auth, locale...
function createSafeContext<T>(hookName: string) {
  const Ctx = createContext<T | null>(null); // default null để ép kiểm tra scope
  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>; // nạp giá trị cho subtree
  }
  function useCtx(): T {
    const ctx = useContext(Ctx); // đọc từ Provider gần nhất
    if (!ctx) throw new Error(`${hookName} cần Provider tương ứng`); // lỗi rõ thay vì crash null
    return ctx;
  }
  return [Provider, useCtx] as const; // trả cặp để nơi dùng bung ra
}

// Cách dùng: mỗi domain một cặp riêng, không lẫn nhau
const [ThemeProvider, useTheme] = createSafeContext<{ theme: string }>("useTheme");
