// shadcn Button thật (xem README cũ giữ lại dưới) — cùng ý Button mini trong example:
import { cva } from "class-variance-authority";
const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: { variant: { default: "bg-primary ...", outline: "border ...", ghost: "hover:bg-accent" }, size: { default: "h-9 px-4", sm: "h-8 px-3" } },
  defaultVariants: { variant: "default", size: "default" },
});
// Dùng: <button className={cn(buttonVariants({ variant, size }), className)}> — user className thắng khi xung đột
