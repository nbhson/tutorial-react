// useLocalStorage trong example.tsx: useState + logic storage gói trong hàm use*
function useLocalStorage(key: string, initial = "") {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  const save = (v: string) => { setValue(v); localStorage.setItem(key, v); };
  return [value, save] as const;
}
// Dùng như useState, thêm lưu trữ: const [name, setName] = useLocalStorage("name");
