// Greeting trong example.tsx: props string + default value
type GreetingProps = { name: string; greeting?: string };

function Greeting({ name, greeting = "Xin chào" }: GreetingProps) {
  // greeting có default khi cha không truyền — thay defaultProps đã bỏ
  // Vì sao default ở destructuring? Vì defaultProps không còn cho function component.
  return <p>{greeting}, {name}!</p>;
}

// Dùng: <Greeting name="Linh" greeting="Chào buổi sáng" /> hoặc <Greeting name={name} />
