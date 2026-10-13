// example.tsx — DAY 18: dict mini + react-i18next + Intl theo locale + <html lang>
// Mục đích: key JSON + runtime switch (không reload) + số/ngày theo locale + a11y lang.
import { useEffect, useMemo, useState } from "react"; // (1) lang state + memo bảng dịch + effect cập nhật <html lang>

// (2) Bảng dịch tối giản: key -> giá trị (hàm khi interpolation). Bản thật là JSON resources i18next.
const dict = {
  vi: {
    hello: (name: string) => `Xin chào ${name}`, // interpolation bản mini (hàm); i18next dùng "{{name}}"
    save: "Lưu",
    items_one: (n: number) => `${n} mục`, // plural giản lược; i18next có _one/_other + format
    total: "Tổng",
  },
  en: {
    hello: (name: string) => `Hello ${name}`,
    save: "Save",
    items_one: (n: number) => `${n} item${n === 1 ? "" : "s"}`, // số ít/nhiều tiếng Anh
    total: "Total",
  },
  ja: { hello: (name: string) => `こんにちは ${name}`, save: "保存", items_one: (n: number) => `${n} 件`, total: "合計" }, // (3) Thêm ja để demo fallback khi thiếu key
} as const;

type Lang = keyof typeof dict; // "vi" | "en" | "ja" — union chặn lang lạ

export default function App() {
  const [lang, setLang] = useState<Lang>("vi"); // (4) Runtime switch — đổi là re-render, không reload (khác Angular build-time)
  const [count, setCount] = useState(2); // số để demo plural + Intl
  // (5) "t" theo lang — tương đương i18n.getFixedT(lang). useMemo để bảng ổn định theo lang.
  const t = useMemo(() => dict[lang], [lang]);
  // (6) Fallback: thiếu key ở lang hiện tại thì rơi về vi (thay fallbackLng i18next).
  const hello = (t.hello ?? dict.vi.hello) as (n: string) => string;

  // (7) Intl theo locale hiện tại — KHÔNG hardcode "vi-VN". Đổi lang là số/tiền/ngày đổi theo.
  const money = useMemo(() => new Intl.NumberFormat(lang, { style: "currency", currency: lang === "ja" ? "JPY" : "VND" }).format(120000), [lang]);
  const today = useMemo(() => new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date()), [lang]);

  // (8) Cập nhật <html lang> cho screen reader/SEO — quên là đọc sai ngôn ngữ.
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  return (
    <>
      <p>{hello("Son")}</p> {/* interpolation: cả câu vào key, không nối "Xin chào " + name */}
      <p>{t.items_one(count)} — {t.total}: {money} — {today}</p>
      <div>
        <button onClick={() => setLang("vi")}>VI</button>
        <button onClick={() => setLang("en")}>EN</button>
        <button onClick={() => setLang("ja")}>JA</button>
        <button onClick={() => setCount((c) => c + 1)}>+1 mục (test plural)</button>
      </div>
      <button>{t.save}</button>
    </>
  );
}

// Ghi chú react-i18next thật (xem README copy đầy đủ):
// import i18n from "i18next"; LanguageDetector (navigator/localStorage) + initReactI18next +
// resources { vi: { translation: { hello: "Xin chào {{name}}" } } } + fallbackLng: "vi" +
// interpolation: { escapeValue: false } (React đã escape). Component: const { t, i18n } = useTranslation();
// <button onClick={() => i18n.changeLanguage("en")}>{t("save")}</button> +
// new Intl.NumberFormat(i18n.language, ...) + effect document.documentElement.lang = i18n.language.
