// ❌ SAI: core import adapter — đảo ngược sai chiều, mất ý nghĩa tách
// core/usecase.ts
import { httpRepo } from '../adapters/http'; // core biết kênh cụ thể → đổi kênh phải sửa core
// ✅ ĐÚNG: nhận qua tham số — adapter import core, không ngược lại
export const countOpenTodos = (repo: TodoRepository) => async () => { /* ... */ };
