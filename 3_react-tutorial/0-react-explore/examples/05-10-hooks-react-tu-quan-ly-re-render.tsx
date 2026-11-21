const [count, setCount] = useState(0);
// ĐÚNG: đổi state → React tự re-render
<button onClick={() => setCount(c => c + 1)}>+1</button>
