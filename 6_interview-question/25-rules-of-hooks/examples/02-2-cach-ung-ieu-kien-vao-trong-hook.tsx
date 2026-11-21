// ❌ SAI: hook trong điều kiện — số hook đổi giữa render
if (user) {
  const [x, setX] = useState(0);
}

// ✅ ĐÚNG (giao diện): hook top-level, điều kiện là RETURN
const [x, setX] = useState(0);
if (!user) return null;
return <button onClick={() => setX(x + 1)}>{x}</button>;

// ✅ ĐÚNG (logic): điều kiện nằm TRONG deps của effect
useEffect(() => {
  if (!user) return;                 // early-return, hook vẫn top-level
  fetchUser(user.id);
}, [user]);
