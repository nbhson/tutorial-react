// Không Context: App -> Page -> Card -> Button phải drilling theme qua 3 tầng
<App theme={t}><Page theme={t}><Card theme={t}><Button theme={t} /></Card></Page></App>

// Có Context: Provider ở App, Button đọc trực tiếp — Page/Card không biết theme tồn tại
<ThemeProvider><Page><Card><ThemedButton /></Card></Page></ThemeProvider>
function ThemedButton() { const { theme } = useTheme(); return <button>{theme}</button>; }
