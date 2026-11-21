// ✅ ĐÚNG: transform/opacity (compositor, không layout)
<div style={{ transform: open ? "scaleX(1)" : "scaleX(0)", opacity: open ? 1 : 0, transition: "transform 200ms, opacity 200ms" }} />
