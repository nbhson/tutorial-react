import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter, formatVND } from "../Counter";

describe("Counter (class legacy)", () => {
  test("hiển thị giá trị khởi tạo", () => {
    render(<Counter initial={5} />);
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  test("bấm nút tăng count (↔ ng-click)", () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole("button", { name: /tăng/i }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});

describe("formatVND (↔ currency filter)", () => {
  test("định dạng tiền VND", () => {
    expect(formatVND(1250000)).toContain("₫");
  });

  test("so sánh số thực dùng toBeCloseTo (↔ Jasmine)", () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });
});
