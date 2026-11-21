// Resource minh họa (bản thật nằm trong i18n.init({ resources }))
const resources = {
  en: { translation: {
    hello: "Hello {{name}}", // template 2 ngoặc, khớp t("hello", { name })
    item_one: "{{count}} item", // số ít Anh
    item_other: "{{count}} items", // số nhiều Anh
  } },
  vi: { translation: {
    hello: "Xin chào {{name}}", // cùng key, câu Việt
    item_other: "{{count}} mục", // Việt không chia, dùng other cho mọi số
  } },
};
// Gọi: t("hello", { name: "Son" }) -> "Xin chào Son" (vi) / "Hello Son" (en)
// Gọi: t("item", { count: 1 }) -> "1 item" (en) / "1 mục" (vi)
