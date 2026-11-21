// ❌ SAI: copy server data vào Zustand — hai nguồn sự thật, dễ desync
const useStore = create<any>()((set) => ({ user: null, setUser: (u) => set({ user: u }) }));
function Sai({ id }: { id: number }) {
  const setUser = useStore((s) => s.setUser);
  useEffect(() => { fetch(`/api/users/${id}`).then((r) => r.json()).then(setUser); }, [id]);
  // phải tự lo loading, error, retry, cache, invalidate... rất dễ sót
  return null;
}

// ✅ ĐÚNG: server state để Query lo — tự có cache, retry, dedupe
function Dung({ id }: { id: number }) {
  const { data } = useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
  return <p>{data?.name}</p>;
}
