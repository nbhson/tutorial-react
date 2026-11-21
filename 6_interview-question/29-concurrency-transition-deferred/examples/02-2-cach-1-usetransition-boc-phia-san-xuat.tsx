import { useTransition } from "react";

function Search() {
  const [q, setQ] = useState("");            // q "gốc" (urgent, input đọc cái này)
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");    // query "bản chạy" (non-urgent, list đọc)

  const onChange = (e) => {
    setQ(e.target.value);                    // URGENT: input hiện ngay (không hoãn)
    startTransition(() => setQuery(e.target.value)); // NON-URGENT: list lọc hoãn
  };

  return (
    <div>
      <input value={q} onChange={onChange} />
      {isPending && <p>Đang lọc…</p>}         // indicator (giữ UX, không chặn input)
      <Results query={query} />               // list đọc "bản chạy" (trễ)
    </div>
  );
}
