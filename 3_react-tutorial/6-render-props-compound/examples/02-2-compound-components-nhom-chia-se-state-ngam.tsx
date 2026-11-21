// example.tsx: Tabs root giữ state, Trigger/Panel tự đọc qua useTabs()
function Tabs({ children, defaultValue = "a" }: { children: ReactNode; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs(); // không nhận active/setValue qua props — đọc ngầm
  const active = ctx.value === value;
  return <button role="tab" aria-selected={active ? "true" : "false"} onClick={() => ctx.setValue(value)}>{children}</button>;
}
