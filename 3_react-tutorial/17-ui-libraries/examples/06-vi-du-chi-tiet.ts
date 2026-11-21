// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // ghép điều kiện (clsx) + giải xung đột (twMerge)
}
// Thử: cn("px-4", "px-8") -> "px-8" (user thắng); không cn là "px-4 px-8" (may rủi theo CSS)
