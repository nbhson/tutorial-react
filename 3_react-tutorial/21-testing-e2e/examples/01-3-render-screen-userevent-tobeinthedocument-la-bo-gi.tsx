render(<App />);
await userEvent.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument();
