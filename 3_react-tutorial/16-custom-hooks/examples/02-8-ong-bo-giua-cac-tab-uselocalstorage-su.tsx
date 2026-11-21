import { useEffect, useState } from "react";

function useSyncedLocalStorage(key: string, initial = "") {
  // Lazy init: chỉ đọc storage lần đầu, tránh đọc mỗi render
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  const save = (v: string) => { setValue(v); localStorage.setItem(key, v); }; // ghi cả 2 nơi
  useEffect(() => {
    // Tab khác đổi storage -> tab này cập nhật theo (đồng bộ liên tab)
    const onStorage = (e: StorageEvent) => { if (e.key === key) setValue(e.newValue ?? initial); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage); // cleanup bắt buộc
  }, [key, initial]);
  return [value, save] as const;
}
