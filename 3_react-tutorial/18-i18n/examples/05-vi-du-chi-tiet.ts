// src/i18n.ts — npm i i18next react-i18next i18next-browser-languagedetector
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)   // đoán locale từ trình duyệt/localStorage
  .use(initReactI18next)   // cắm vào React (useTranslation subscribe)
  .init({
    resources: {
      vi: { translation: { hello: "Xin chào {{name}}", save: "Lưu" } },
      en: { translation: { hello: "Hello {{name}}", save: "Save" } },
    },
    fallbackLng: "vi",                       // thiếu key rơi về vi, không hiện key thô
    interpolation: { escapeValue: false },   // React đã escape XSS, tránh escape kép &amp;
  });
export default i18n;
// main.tsx: import "./i18n"; — TRƯỚC createRoot().render()
