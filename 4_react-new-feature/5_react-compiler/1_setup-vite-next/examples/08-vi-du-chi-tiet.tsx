// Setup tham khảo (không phải code chạy):
// Vite: react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } })
// Next: experimental: { reactCompiler: true }   (Next 16: reactCompiler: true)
// Opt-in: "use memo";  Opt-out: "use no memo"

'use memo'; // Bật compiler cho riêng file demo này

import { memo, useState } from 'react';

// Child "nặng" — KHÔNG cần memo() thủ công, Compiler tự memo.
function ExpensiveChild({ config }: { config: { theme: string } }) {
  // Log để quan sát: chỉ in khi theme thực sự đổi
  console.log('[render] ExpensiveChild', config.theme);
  return <p>Theme: {config.theme} (chỉ re-render khi theme đổi thật)</p>;
}

export default function CompilerSetupDemo() {
  const [theme, setTheme] = useState('sáng');
  const [tick, setTick] = useState(0); // state này KHÔNG liên quan tới child

  return (
    <div>
      <h2>React Compiler auto-memo (1.0)</h2>
      {/*
        `config={{ theme }}` tạo object MỚI mỗi lần render.
        Cách viết "ngây thơ" này thường khiến child re-render thừa.
        Nhưng Compiler biết object chỉ phụ thuộc `theme` ⇒ khi bấm Tick,
        child KHÔNG re-render.
      */}
      <ExpensiveChild config={{ theme }} />
      <button onClick={() => setTheme(theme === 'sáng' ? 'tối' : 'sáng')}>
        Đổi theme
      </button>
      <button onClick={() => setTick(tick + 1)}>
        Tick ({tick}) — child không re-render
      </button>
    </div>
  );
}

// Giữ memo thủ công cũng KHÔNG sao — Compiler tôn trọng và bỏ qua chỗ đó:
export const ManualMemoChild = memo(function ManualMemoChild() {
  return <p>Child memo thủ công vẫn chạy bình thường.</p>;
});
