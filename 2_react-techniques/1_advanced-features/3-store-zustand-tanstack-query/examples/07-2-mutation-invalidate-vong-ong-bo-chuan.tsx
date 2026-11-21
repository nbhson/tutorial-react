import { useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ ĐÚNG: mutation xong invalidate — list tự refetch, không setState tay
function NutThem() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (ten: string) => fetch('/api/todos', { method: 'POST', body: JSON.stringify({ ten }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }), // đánh dấu cũ → tự tải lại
  });
  return <button onClick={() => m.mutate('Mua sữa')} disabled={m.isPending}>Thêm</button>;
}
