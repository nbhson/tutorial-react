// ✅ (Q15) — External store (Zustand/Jotai (Q15), "useSyncExternalStore (Q15)
import { useSyncExternalStore } from "react";
// (Q15) "Store (Zustand/Jotai (Q15) — "WebSocket (update (store) (Q15)
function subscribeStore(callback) {
  const ws = new WebSocket("wss://...");
  ws.onmessage = (e) => { store.update(JSON.parse(e.data)); callback(); };
  return () => ws.close();
}
// (Q15) "Hook (Zustand/Jotai (Q15) — "useSyncExternalStore (Q15)
function useRealtimeTick() {
  return useSyncExternalStore(
    subscribeStore,                    // (Q15, Q27) "Subscribe (Q15)
    () => store.get().tick,            // (Q15) "Giá trị hiện tại (Q15)
    () => store.get().tick,            // (Q15) "Server snapshot (Q15) (SSR (Q2)
  );
}
// (Q15) "Chỉ (component dùng (tick) re-render (Q15, Q30) (không cascade (Q30)
// (Q15, Q30) "Chuẩn (nhiều component (khác tầng (Q13, Q15) (Q13, Q15)
