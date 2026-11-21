// Bạn viết thế này:
const el = <h3>Your name: {name}</h3>;

// Vite biên dịch gần tương đương thế này (giản lược):
const el = jsx("h3", { children: ["Your name: ", name] });
// el là object thuần { type: "h3", props: {...} } — React đọc object để dựng DOM.
