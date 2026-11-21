// ❌ SAI: fetch users về set vào Zustand — phải tự viết loading/error/retry/dedupe/stale
const users = useStore((s) => s.users); useEffect(() => { fetch(...).then(set) }, []);
