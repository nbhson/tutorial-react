import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"; // cn = twMerge(clsx(...)): ghép + khử xung đột

// Từ điển variant: base luôn có + variant/size + mặc định (thay style object thủ công)
const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90", // primary
      outline: "border border-input bg-background hover:bg-accent", // outline
      ghost: "hover:bg-accent", // thêm ghost như bài tập README
    },
    size: { default: "h-9 px-4", sm: "h-8 px-3" },
  },
  defaultVariants: { variant: "default", size: "default" }, // khớp variant = "primary" mặc định
});

function Button({ variant, size, className, ...props }: {
  variant?: "default" | "outline" | "ghost"; size?: "default" | "sm"; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // cn: class người dùng truyền thắng khi xung đột (px-8 thắng px-4)
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
