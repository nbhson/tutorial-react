// Không Context: App → Page → Card → Button phải truyền theme qua 3 tầng
<App theme={t}>
  <Page theme={t}>
    <Card theme={t}>
      <Button theme={t} />
    </Card>
  </Page>
</App>
// Page, Card "đỡ" theme (mặc dù không dùng) — mỗi tầng "đục lỗ" 1 prop

// Có Context: Provider ở App, Button đọc trực tiếp — Page/Card không "biết" theme tồn tại
<ThemeProvider>
  <Page>
    <Card>
      <ThemedButton />
    </Card>
  </Page>
</ThemeProvider>

function ThemedButton() {
  const { theme, toggle } = useTheme(); // "đọc" ở "sâu" cũng "được"
  return <button onClick={toggle}>{theme}</button>;
}
