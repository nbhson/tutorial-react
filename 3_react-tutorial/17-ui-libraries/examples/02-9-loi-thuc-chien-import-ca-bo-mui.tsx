// ĐÚNG: component mở đuôi className + ...props để tùy biến không cần sửa lib
import { cn } from "@/lib/utils";

function Card({ className, children, ...props }: {
  className?: string; children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  // cn hợp nhất class gốc với class người dùng, props lạ (onClick, id...) xuyên qua
  return <div className={cn("rounded-lg border bg-card p-4", className)} {...props}>{children}</div>;
}
