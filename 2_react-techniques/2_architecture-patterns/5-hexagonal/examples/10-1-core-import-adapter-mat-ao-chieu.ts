// ❌ SAI: core biết kênh cụ thể
import { httpRepo } from '../adapters/http';
export const dem = () => httpRepo.list();
// ✅ ĐÚNG: nhận qua tham số
export const dem = (repo: TodoRepository) => () => repo.list();
