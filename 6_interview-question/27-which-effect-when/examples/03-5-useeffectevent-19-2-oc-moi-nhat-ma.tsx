// Trước (2 cách sai/khổ):
useEffect(() => { socket.on("msg", () => send(text)); }, [text, send]); // chạy lại mỗi phím (thừa)
// hoặc: useEffect(() => { socket.on("msg", () => send(text)); }, []); // eslint-disable (giấu stale)

// Sau (19.2): tách "logic không reactive" — handler LUÔN đọc mới nhất, deps SẠCH
import { useEffectEvent } from "react";
const onMsg = useEffectEvent(() => send(text)); // đọc text/send "hiện tại" (không nằm deps)
useEffect(() => {
  socket.on("msg", onMsg);
  return () => socket.off("msg", onMsg);
}, []); // deps [] sạch — không chạy lại, không stale
