// SAI: 1 component làm 3 việc (fetch + state + render)
function UserList() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [sel, setSel] = useState<string | null>(null);
  if (data) return <ul>{data.map((u) => <li key={u.id} onClick={() => setSel(u.id)}>{u.name}</li>)}</ul>;
  return <p>Loading…</p>;
}

// ĐÚNG: tách 2 (container lấy data, view render thuần)
function UserCardView({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return <button aria-pressed={selected} onClick={onSelect}>{name}</button>; // pure: props -> UI
}
function UserListContainer() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [sel, setSel] = useState<string | null>(null);
  return data
    ? <ul>{data.map((u) => <UserCardView key={u.id} name={u.name} selected={sel === u.id} onSelect={() => setSel(u.id)} />)}</ul>
    : <p>Loading…</p>;
}
