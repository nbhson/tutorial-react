// example.tsx — use() hook (React 19)
import { Suspense, createContext, use } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function fetchUser(): Promise<{ name: string }> {
  return new Promise((res) =>
    setTimeout(() => res({ name: 'Ada Lovelace' }), 800),
  );
}
// Tạo promise MỘT LẦN ở module scope — nếu tạo trong render sẽ suspend vô hạn.
const userPromise = fetchUser();

function ThemedGreeting({ showTheme }: { showTheme: boolean }) {
  // use() cho phép gọi CÓ ĐIỀU KIỆN — useContext không cho.
  const theme = showTheme ? use(ThemeContext) : '(ẩn theme)';
  const user = use(userPromise);   // suspend tới khi resolve
  return (
    <p>
      Xin chào {user.name} — theme: {theme}
    </p>
  );
}

export default function UseHookDemo() {
  return (
    // Context-as-provider: <Context value> thay <Context.Provider> (mới v19)
    <ThemeContext value="dark">
      <h2>use() hook (React 19)</h2>
      <Suspense fallback={<p>Đang tải user...</p>}>
        <ThemedGreeting showTheme={true} />  {/* đọc theme qua use() */}
        <ThemedGreeting showTheme={false} /> {/* bỏ qua theme, vẫn ổn */}
      </Suspense>
    </ThemeContext>
  );
}
