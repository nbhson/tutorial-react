// example.tsx — đo + cuộn tới card đầu, focus con đầu tiên, không có div bọc
import { Fragment, useRef } from 'react';

export default function FragmentRefDemo() {
  // ref trỏ tới một FragmentInstance (không phải mảng DOM node!)
  const ref = useRef<React.ComponentRef<typeof Fragment>>(null);

  function measureAndScroll() {
    const instance = ref.current;
    if (!instance) return;
    const rects = instance.getClientRects();          // DOMRect[] của con cấp 1
    if (rects.length === 0) return alert('Fragment không có DOM con!');
    const totalH = rects.reduce((sum, r) => sum + r.height, 0);
    instance.scrollIntoView();                        // boolean, KHÔNG truyền options
    alert(`Fragment có ${rects.length} nodes, tổng cao ≈ ${Math.round(totalH)}px`);
  }

  function focusFirst() {
    ref.current?.focus();   // tìm element focusable đầu tiên theo depth-first
  }

  return (
    <div>
      <h2>Fragment refs (React 19.3)</h2>
      {/* Không có div bọc — DOM phẳng, ref gom 3 article */}
      <Fragment ref={ref}>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>
          Card 1 <button>Chọn</button>
        </article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 2</article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 3</article>
      </Fragment>
      <button onClick={measureAndScroll} style={{ marginTop: 8 }}>
        Đo + cuộn tới card đầu
      </button>
      <button onClick={focusFirst} style={{ marginTop: 8, marginLeft: 8 }}>
        Focus con đầu tiên
      </button>
    </div>
  );
}
