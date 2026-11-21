// ❌ SAI: index.html thiếu neo nhưng main.tsx vẫn ép non-null
// index.html: <body><script src="/src/main.tsx"></script></body> (không có div#root)
createRoot(document.getElementById("root")!).render(<App />); // crash: Target container is not a DOM element
