// React 19: ref là prop thường
import { useRef } from 'react';
import type { Ref, InputHTMLAttributes } from 'react';

type MyInputProps = { ref?: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>;

function MyInput({ ref, ...props }: MyInputProps) {
  return <input ref={ref} {...props} />; // truyền ref xuống host element
}

// Dùng ở parent:
const inputRef = useRef<HTMLInputElement>(null);
<MyInput ref={inputRef} placeholder="Focus me" />;

// Ref callback + cleanup:
<input
  ref={(node) => {
    node?.focus();
    return () => console.log('detach'); // chạy khi node gỡ khỏi DOM
  }}
/>;
