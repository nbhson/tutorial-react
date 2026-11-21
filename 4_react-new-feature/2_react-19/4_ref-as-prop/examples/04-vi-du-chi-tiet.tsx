// example.tsx — ref as prop (React 19)
import { useRef } from 'react';

type FancyInputProps = {
  ref?: React.Ref<HTMLInputElement>; // ref thành prop — bỏ forwardRef
  placeholder?: string;
};

// Không cần forwardRef: nhận ref trực tiếp như prop thường.
function FancyInput({ ref, placeholder }: FancyInputProps) {
  return (
    <input
      ref={(node) => {
        // Reconcile ref object + callback: nếu user truyền object thì gán .current
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        // Thêm style khi mount — minh họa effect gắn với node
        if (node) node.style.border = '2px solid royalblue';
        return () => console.log('FancyInput detached'); // cleanup khi detach
      }}
      placeholder={placeholder}
      style={{ padding: 8 }}
    />
  );
}

export default function RefAsPropDemo() {
  const inputRef = useRef<HTMLInputElement>(null); // ref cha

  return (
    <div>
      <h2>ref as prop (React 19)</h2>
      {/* Truyền ref như prop — focus từ parent */}
      <FancyInput ref={inputRef} placeholder="Nhập rồi bấm Focus" />
      <button onClick={() => inputRef.current?.focus()}>Focus từ parent</button>
    </div>
  );
}
