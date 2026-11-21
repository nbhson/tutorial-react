// (1) generic: hook nhận mọi kiểu data — type-safe cho mọi caller
function useFetch<T>(url: string): Promise<T> { /* ... */ }
const users = useFetch<User>("/api/users"); // mọi chỗ dùng đều đúng kiểu, không any chung

// (2) mô phỏng useState: trả tuple cố định, as const chống "mở rộng" mất type
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const save = (v: T) => { setValue(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [value, save] as const; // tuple cố định [T, setter], không phải Array<T | Function>
}
