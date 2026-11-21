import { useTranslation } from "react-i18next";

function CheckoutTitle() {
  // Gắn namespace checkout: t("title") tra checkout.title, không lẫn common.title
  const { t } = useTranslation("checkout");
  return <h1>{t("title")}</h1>; // type-safe (nâng cao) thì gõ sai key đỏ lúc compile
}

function SaveButton() {
  const { t } = useTranslation("common"); // nút chung dùng namespace common nhỏ gọn
  return <button>{t("save")}</button>;
}
