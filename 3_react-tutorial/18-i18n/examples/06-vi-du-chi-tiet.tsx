import { useTranslation } from "react-i18next";

function Toolbar() {
  const { t, i18n } = useTranslation(); // t theo namespace hiện tại; i18n cho language/changeLanguage
  return (
    <button onClick={() => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi")}>
      {t("save")}
    </button>
  );
}
// Số/ngày: new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" })
