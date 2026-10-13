import { useRef } from 'react';

type FancyInputProps = {
  ref?: React.Ref<HTMLInputElement>;
  placeholder?: string;
};

// React 19: không cần forwardRef — ref là prop thường.
function FancyInput({ ref, placeholder }: FancyInputProps) {
  return (
    <input
      ref={(node) => {
        // Gán ref + cleanup khi detach
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        if (node) node.style.border = '2px solid royalblue';
        return () => console.log('FancyInput detached');
      }}
      placeholder={placeholder}
      style={{ padding: 8 }}
    />
  );
}

export default function RefAsPropDemo() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <h2>ref as prop (React 19)</h2>
      <FancyInput ref={inputRef} placeholder="Nhập rồi bấm Focus" />
      <button onClick={() => inputRef.current?.focus()}>Focus từ parent</button>
    </div>
  );
}
