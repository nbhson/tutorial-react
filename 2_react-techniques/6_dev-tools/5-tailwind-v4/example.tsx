import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...xs: ClassValue[]) => twMerge(clsx(xs));

type Props = {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'primary', children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        variant === 'primary'
          ? 'bg-brand text-white hover:opacity-90'
          : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        className,
      )}
    >
      {children}
    </button>
  );
}
