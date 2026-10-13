// src/main.tsx — entry chuẩn Vite + React 19
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Đọc env typed (xem thêm nhóm 4_security-config/2-env-config)
export const apiUrl = import.meta.env.VITE_API_URL as string;
