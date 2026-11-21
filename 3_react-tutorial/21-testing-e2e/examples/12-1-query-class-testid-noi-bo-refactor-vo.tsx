// ✅ ĐÚNG: role/label/text (a11y) — đổi style không vỡ (như example)
expect(screen.getByRole("button", { name: "+1" })).toBeInTheDocument();
// Testid chỉ khi không role/text: getByTestId("chart-canvas")
