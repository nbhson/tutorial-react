// Tailwind cùng hiệu ứng fade/slide:
<div className={open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"} style={{ transition: "opacity 200ms, transform 200ms" }}>
  Nội dung fade/slide
</div>
