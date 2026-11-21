// ✅ ĐÚNG: toArray + filter(Boolean) trước rồi map (như Breadcrumb)
const parts = Children.toArray(children).filter(Boolean);
parts.map((p, i) => ...)
