// App trong example.tsx giữ 3 state chung cho 6 con:
const [count, setCount] = useState(0); // chia sẻ cho <p>, <Badge>, 2x <CounterButton>
const [isOn, setIsOn] = useState(false); // chia sẻ cho <ToggleLabel>, <Switch>
const [name, setName] = useState("Son"); // chia sẻ cho <Greeting>, <TextInput>

// Vì sao state phải ở cha? Nếu Plus và Minus mỗi bên giữ state riêng,
// chúng không đồng bộ, không ai đọc được tổng. Đưa lên cha thì cả hai đọc chung.
