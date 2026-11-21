// src/test/server.ts — MSW, test component có fetch
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/me', () => HttpResponse.json({ name: 'Son' })),
];
export const server = setupServer(...handlers);
// Trong setup.ts: beforeAll(server.listen) / afterEach(server.resetHandlers) / afterAll(server.close)
