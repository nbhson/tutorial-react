import { useMutation, useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();
const addUser = useMutation({
  mutationFn: (name: string) =>
    fetch("/api/users", { method: "POST", body: JSON.stringify({ name }) }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
    }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }), // đánh dấu stale -> refetch
});
