// src/main.tsx — mirror đầy đủ, khớp từng dòng với example.tsx
// Entry chuẩn Vite + React 19: createRoot + StrictMode (phát hiện effect 2 lần, mutate ở dev)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Env typed ở client (chi tiết xem nhóm 4_security-config/2-env-config)
// Vì sao as string: import.meta.env type lỏng — ép + validate ở biên để lỗi thiếu env hiện sớm
export const apiUrl = import.meta.env.VITE_API_URL as string;
