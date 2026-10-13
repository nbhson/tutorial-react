// Setup tham khảo:
// Vite: react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } })
// Next: experimental: { reactCompiler: true }
// Opt-in: "use memo"; Opt-out: "use no memo"

'use memo';

import { memo, useState } from 'react';

// Child nặng — KHÔNG cần memo() thủ công, Compiler tự memo.
function ExpensiveChild({ config }: { config: { theme: string } }) {
  console.log('[render] ExpensiveChild', config.theme);
  return <p>Theme: {config.theme} (chỉ re-render khi theme đổi thật)</p>;
}

export default function CompilerSetupDemo() {
  const [theme, setTheme] = useState('sáng');
  const [tick, setTick] = useState(0);

  return (
    <div>
      <h2>React Compiler auto-memo (1.0)</h2>
      {/* object mới mỗi render, nhưng Compiler biết chỉ theme thay đổi mới re-render child */}
      <ExpensiveChild config={{ theme }} />
      <button onClick={() => setTheme(theme === 'sáng' ? 'tối' : 'sáng')}>
        Đổi theme
      </button>
      <button onClick={() => setTick(tick + 1)}>Tick ({tick}) — child không re-render</button>
    </div>
  );
}

// Giữ memo cũ cũng không sao — Compiler tôn trọng và bỏ qua:
export const ManualMemoChild = memo(function ManualMemoChild() {
  return <p>Child memo thủ công vẫn chạy bình thường.</p>;
});
