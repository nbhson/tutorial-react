// Angular: providers scoped — 2 nhánh có 2 instance khác nhau
// @Component({ providers: [ThemeService] })

// React: 2 Provider = 2 state độc lập — example.tsx NestedDemo minh họa
<ThemeProvider><ThemedButton /> {/* light ngoài */}
  <ThemeProvider><ThemedButton /> {/* state trong độc lập */}</ThemeProvider>
</ThemeProvider>
// Toggle nút trong không ảnh hưởng nút ngoài — scoped như providers
