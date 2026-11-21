// ✅ ĐÚNG: custom hook throw với thông điệp rõ (như useTabs trong ví dụ)
function useTabs() { const ctx = useContext(TabsCtx); if (!ctx) throw new Error("Tabs.* phải nằm trong <Tabs>"); return ctx; }
