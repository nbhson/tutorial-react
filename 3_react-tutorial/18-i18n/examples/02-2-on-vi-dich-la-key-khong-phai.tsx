// resources i18next thật (2 ngôn ngữ, interpolation {{name}}):
resources: {
  vi: { translation: { hello: "Xin chào {{name}}", save: "Lưu" } },
  en: { translation: { hello: "Hello {{name}}", save: "Save" } },
}
// Dùng: t("hello", { name: "Son" }) -> "Xin chào Son" (vi) / "Hello Son" (en)
