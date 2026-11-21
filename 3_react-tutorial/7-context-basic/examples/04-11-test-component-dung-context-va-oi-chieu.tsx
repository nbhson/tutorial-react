// Minh họa ý tưởng test (Vitest + RTL, xem chi tiết DAY 21)
import { render, screen } from "@testing-library/react";

// ĐÚNG: bọc Provider như prod thì button hiện theme
// render(<ThemeProvider><ThemedButton /></ThemeProvider>);
// expect(screen.getByRole("button")).toHaveTextContent("light");

// KHÓA CONTRACT: thiếu Provider phải throw message rõ, không được "câm"
// expect(() => render(<ThemedButton />)).toThrow("useTheme cần <ThemeProvider>");
