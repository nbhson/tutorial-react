# App mới với Vite + TS
npm create vite@latest my-app -- --template react-ts
cd my-app && npm i && npm run dev

# (Khuyến nghị) Bật React Compiler cho app mới:
npm i -D babel-plugin-react-compiler
npm i -D eslint-plugin-react-hooks@latest
npx react-compiler-healthcheck
