// Minh họa trong example.tsx: 2 loại "bộ nhớ" khác nhau
const [tick, setTick] = useState(0); // đổi -> vẽ lại <p>Tick: ...</p>
const idRef = useRef<number | undefined>(undefined); // đổi -> KHÔNG vẽ lại
// Vì sao id interval là ref? Vì id chỉ để cleanup, không hiển thị. Dùng state sẽ
// re-render mỗi lần tạo timer — thừa và dễ loop (render -> tạo timer -> render...).
