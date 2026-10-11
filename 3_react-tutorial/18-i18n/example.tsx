// example.tsx — DAY 18: i18n tối giản không cần lib (mô phỏng t())
import { useMemo, useState } from "react";

const dict = {
  vi: { hello: (name: string) => `Xin chào ${name}`, save: "Lưu" },
  en: { hello: (name: string) => `Hello ${name}`, save: "Save" },
} as const;

type Lang = keyof typeof dict;

export default function App() {
  const [lang, setLang] = useState<Lang>("vi");
  const t = useMemo(() => dict[lang], [lang]);
  return (
    <>
      <p>{t.hello("Son")}</p>
      <button onClick={() => setLang("vi")}>VI</button>
      <button onClick={() => setLang("en")}>EN</button>
      <button>{t.save}</button>
    </>
  );
}
