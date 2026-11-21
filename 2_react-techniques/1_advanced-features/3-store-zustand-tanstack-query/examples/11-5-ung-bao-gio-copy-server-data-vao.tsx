// ❌ SAI: copy data Query vào Zustand — desync khi invalidate
const d = useQuery({ queryKey: ['u', id], queryFn: fetchUser });
useEffect(() => { if (d.data) useUi.setState({ userCopy: d.data }); }, [d.data]);

// ✅ ĐÚNG: đọc trực tiếp từ Query mọi nơi — một nguồn sự thật
const { data } = useQuery({ queryKey: ['u', id], queryFn: fetchUser });
