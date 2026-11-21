// Uncontrolled thuần (hiếm dùng tay, nhưng là nguyên lý RHF):
import { useRef } from "react";
function Quick() {
  const ref = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert(ref.current?.value); };
  return <form onSubmit={submit}><input ref={ref} defaultValue="" /></form>;
}
// Gõ 100 phím -> 0 lần re-render (không setState). Submit mới đọc 1 lần.
