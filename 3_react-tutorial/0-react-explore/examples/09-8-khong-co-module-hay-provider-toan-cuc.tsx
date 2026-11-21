// App nhỏ không cần gì thêm — main.tsx mỏng nhất có thể:
createRoot(el).render(<StrictMode><App /></StrictMode>);

// App lớn — thêm Provider theo nhu cầu, thứ tự do bạn sắp:
createRoot(el).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
