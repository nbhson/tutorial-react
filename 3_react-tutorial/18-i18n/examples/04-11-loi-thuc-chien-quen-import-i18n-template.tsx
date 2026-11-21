import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function LocaleSync() {
  const { i18n } = useTranslation(); // nguồn locale chuẩn của app
  useEffect(() => {
    // Đồng bộ thẻ html với ngôn ngữ đang chọn: tốt cho a11y (giọng đọc) + SEO
    document.documentElement.lang = i18n.language;
  }, [i18n.language]); // chạy lại mỗi lần changeLanguage
  // Format tiền theo locale hiện tại, không hardcode "vi-VN"
  const money = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" }).format(100000);
  return <p>{money}</p>;
}
