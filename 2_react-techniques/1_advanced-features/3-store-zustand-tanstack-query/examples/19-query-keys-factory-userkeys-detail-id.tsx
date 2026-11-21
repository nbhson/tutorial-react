// ✅ ĐÚNG: một nơi định nghĩa key — invalidate không bao giờ lệch chuỗi
export const userKeys = { all: ['users'] as const, detail: (id: number) => ['users', id] as const };
