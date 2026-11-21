<ThemeProvider>                     {/* value = A */}
  <ThemedButton />                   {/* consumer: đọc A */}
  <ThemeProvider>                    {/* value = B (lồng trong) */}
    <ThemedButton />                 {/* consumer: đọc B (Provider gần nhất) */}
  </ThemeProvider>
</ThemeProvider>
