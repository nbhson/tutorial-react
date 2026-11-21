// Bấm 1 lần:
function Inc() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const onBtn = () => {
    setCount(1);          // update #1 — KHÔNG render ngay
    setCount((c) => c + 1); // update #2 (xếp hàng)
    setName("a");          // update #3 (component khác? cùng tree)
  };
  // → React GỘP: re-render 1 lần với count = 2, name = "a"
}
