// example.tsx: open false->true là style đổi, transition nội suy — không requestAnimationFrame tay
const [open, setOpen] = useState(false);
<div style={{
  opacity: open ? 1 : 0, // 0->1 giữa 2 render
  transform: open ? "translateY(0)" : "translateY(8px)",
  transition: "opacity 200ms, transform 200ms", // khai cố định: nội suy gì, bao lâu
  pointerEvents: open ? "auto" : "none",
}}>Nội dung fade/slide</div>
