// example.tsx có 3 effect mẫu 3 loại deps:
useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []); // [] = 1 lần sau mount (ngOnInit)
useEffect(() => { document.title = `User ${userId} — ...`; }, [userId, now]); // [x] = lại khi x đổi (ngOnChanges cho x)
useEffect(() => { onConnected(); }, []); // với EffectEvent bên trong — deps sạch
// Không deps (useEffect(fn)) = sau MỌI render — hầu như luôn sai (loop/thừa)
