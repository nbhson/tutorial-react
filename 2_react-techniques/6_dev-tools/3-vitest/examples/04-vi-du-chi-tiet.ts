// src/test/setup.ts — chạy trước mọi test
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup()); // dọn DOM sau test, tránh rò rỉ
