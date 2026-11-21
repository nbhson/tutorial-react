// src/__tests__/Counter.test.jsx — class legacy vẫn test bình thường
import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter, formatVND } from "../Counter";

describe("Counter (class legacy)", () => {
  test("hiển thị giá trị khởi tạo", () => {
    // Render component (giống compile template AngularJS rồi đưa vào DOM)
    render(<Counter initial={5} />);
    // Tìm phần tử có data-testid="count" và kiểm tra text hiển thị
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  test("bấm nút tăng count (↔ ng-click)", () => {
    render(<Counter />);
    // Mô phỏng người dùng bấm nút "Tăng" (getByRole + name regex)
    fireEvent.click(screen.getByRole("button", { name: /tăng/i }));
    // Sau setState + re-render, UI phải hiển thị 1
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});

describe("formatVND (↔ currency filter)", () => {
  test("định dạng tiền VND", () => {
    expect(formatVND(1250000)).toContain("₫");
  });

  test("so sánh số thực dùng toBeCloseTo (↔ Jasmine)", () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3); // 0.30000000000000004 ≈ 0.3
  });
});
