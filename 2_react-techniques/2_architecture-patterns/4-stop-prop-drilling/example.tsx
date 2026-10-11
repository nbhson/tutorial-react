import { createContext, useContext, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeCtx = createContext<Theme>('light');
export const useTheme = () => useContext(ThemeCtx);

// ✅ Composition + Context: tầng giữa không cần biết theme/user
function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}

function CardTitle({ text }: { text: string }) {
  const theme = useTheme(); // đọc trực tiếp từ context
  return <h2 data-theme={theme}>{text}</h2>;
}

export function Page() {
  return (
    <ThemeCtx.Provider value="dark">
      <Card>
        <CardTitle text="Không cần truyền props qua Card" />
      </Card>
    </ThemeCtx.Provider>
  );
}
