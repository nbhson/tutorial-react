// ✅ ĐÚNG: pure render + effect/event cho ngoài
function App({ userId }) {
  useEffect(() => { document.title = userId; }, [userId]);
  const onClick = () => fetch(url).then(setData); // event, không phải effect
  return <p>Hi</p>;
}
