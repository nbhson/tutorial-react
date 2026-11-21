// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { createContext, useContext, type ReactNode } from 'react';

// ---------- Context: theme dùng chung, ít đổi ----------
// Vì sao context: theme đọc ở nhiều nơi, hiếm khi đổi → re-render không đáng kể
type Theme = 'light' | 'dark';
const ThemeCtx = createContext<Theme>('light'); // default ngoài Provider — test lẻ không vỡ
export const useTheme = () => useContext(ThemeCtx); // hook tiện đọc — đặt cạnh context để dễ refactor

// ---------- Composition: tầng giữa không cần props ----------
// Card nhận children — không biết card có gì, không biết theme tồn tại
// Vì sao: Card là "ống vô tri" — tái dùng ở đâu cũng được, không mang prop cầu nối
function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}

// CardTitle đọc theme TRỰC TIẾP từ context — không qua trung gian Card
function CardTitle({ text }: { text: string }) {
  const theme = useTheme(); // không prop theme nào đi qua Card — drill biến mất
  return <h2 data-theme={theme}>{text}</h2>; // CSS [data-theme] styling theo theme
}

export function Page() {
  return (
    <ThemeCtx.Provider value="dark"> {/* cung cấp cho cả cây con — đặt đúng tầng cần, không quá cao */}
      <Card>
        {/* truyền "thành phẩm" xuống, không truyền data thô — composition */}
        <CardTitle text="Không cần truyền props qua Card" />
      </Card>
    </ThemeCtx.Provider>
  );
}
