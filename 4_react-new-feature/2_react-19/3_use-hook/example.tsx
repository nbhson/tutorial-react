import { Suspense, createContext, use } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function fetchUser(): Promise<{ name: string }> {
  return new Promise((res) =>
    setTimeout(() => res({ name: 'Ada Lovelace' }), 800),
  );
}
const userPromise = fetchUser(); // tạo 1 lần ngoài render!

function ThemedGreeting({ showTheme }: { showTheme: boolean }) {
  // use() được phép gọi có điều kiện — useContext thì không.
  const theme = showTheme ? use(ThemeContext) : '(ẩn theme)';
  const user = use(userPromise); // suspend tới khi resolve
  return (
    <p>
      Xin chào {user.name} — theme: {theme}
    </p>
  );
}

export default function UseHookDemo() {
  return (
    <ThemeContext value="dark">
      <h2>use() hook (React 19)</h2>
      <Suspense fallback={<p>Đang tải user...</p>}>
        <ThemedGreeting showTheme={true} />
        <ThemedGreeting showTheme={false} />
      </Suspense>
    </ThemeContext>
  );
}
