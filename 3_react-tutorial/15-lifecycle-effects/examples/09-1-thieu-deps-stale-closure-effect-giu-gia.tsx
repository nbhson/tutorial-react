// ✅ ĐÚNG: đủ deps; vướng "không muốn chạy lại" thì EffectEvent (không disable lint)
useEffect(() => { document.title = `User ${userId}`; }, [userId]);
// Muốn [] mà đọc mới: const onTitle = useEffectEvent(() => { document.title = `User ${userId}`; });
