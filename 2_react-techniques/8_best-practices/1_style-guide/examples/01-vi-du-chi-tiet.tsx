// Badge.tsx — chuẩn: PascalCase file, props typed, default qua destructuring
export type BadgeProps = {
  text: string;
  tone?: 'info' | 'success' | 'danger';
};

export function Badge({ text, tone = 'info' }: BadgeProps) {
  // Bảng tone tách riêng, as const để suy ra literal type
  const tones = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
  } as const;
  return <span className={`rounded px-2 py-0.5 text-xs ${tones[tone]}`}>{text}</span>;
}
