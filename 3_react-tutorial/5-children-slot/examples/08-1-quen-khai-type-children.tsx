// ✅ ĐÚNG: ReactNode rộng đúng ý slot
import type { ReactNode } from "react";
function Card({ children }: { children: ReactNode }) { return <div>{children}</div>; }
