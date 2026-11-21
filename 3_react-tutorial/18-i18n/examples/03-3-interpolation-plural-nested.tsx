// Plural đúng (không if tay "1 items"):
i18next: { item_one: "{{count}} item", item_other: "{{count}} items" }
t("item", { count }) // count=1 -> "1 item", =2 -> "2 items" (tự theo quy tắc locale)
// Example mini: t.items_one(count) + count state để bấm +1 xem số ít/nhiều đổi
