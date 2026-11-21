// example.tsx: đo chiều cao khi div xuất hiện
const [h, setH] = useState(0);
<div ref={(node) => { if (node) setH(node.getBoundingClientRect().height); }}>
  Cao {h}px
</div>
// Vì sao callback mà không useRef + effect? Vì callback chạy đúng lúc node gắn/gỡ,
// không cần effect theo dõi thêm. Với nhiều node, dùng Map + callback ref.
