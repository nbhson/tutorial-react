// Khởi tạo detector + tắt escape kép (trích README, giải thích lại từng dòng)
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector"; // tự chọn locale đầu thông minh
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector) // đọc localStorage -> cookie -> navigator, khỏi chọn tay lần đầu
  .use(initReactI18next) // cắm vào React để useTranslation subscribe được
  .init({
    resources: { vi: { translation: { save: "Lưu" } }, en: { translation: { save: "Save" } } },
    fallbackLng: "vi", // thiếu key en thì rơi về vi, không hiện key thô
    interpolation: { escapeValue: false }, // React đã escape XSS, tránh escape 2 lần
  });
