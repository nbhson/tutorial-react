// ❌ SAI: hai nguồn sự thật
const { data } = useQuery({ queryKey: ['u', 1], queryFn: fetchUser });
useEffect(() => { useStore.setState({ user: data }); }, [data]); // invalidate không chạm bản copy

// ✅ ĐÚNG: một nguồn — đọc thẳng từ Query; sửa qua mutation + optimistic
