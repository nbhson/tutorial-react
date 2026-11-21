// Bạn viết:
const el = <h3>Your name: {name}</h3>;

// Vite (esbuild/Babel) biên dịch gần tương đương:
const el = jsx("h3", { children: ["Your name: ", name] });
// el là object thuần { type, props } — React đọc object để Dựng DOM thật.
