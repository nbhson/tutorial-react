// ✅ ĐÚNG: theo locale hiện tại (như example money/today)
new Intl.NumberFormat(i18n.language, { style: "currency", currency: "VND" }).format(n)
