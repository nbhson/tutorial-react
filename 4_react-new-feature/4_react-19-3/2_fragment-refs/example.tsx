import { Fragment, useRef } from 'react';

export default function FragmentRefDemo() {
  const ref = useRef<Iterable<Element> | null>(null);

  function measure() {
    const nodes = [...(ref.current ?? [])];
    if (nodes.length === 0) return alert('Fragment không có DOM con!');
    const totalH = nodes.reduce(
      (sum, el) => sum + el.getBoundingClientRect().height,
      0,
    );
    alert(`Fragment có ${nodes.length} nodes, tổng cao ≈ ${Math.round(totalH)}px`);
    (nodes[0] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div>
      <h2>Fragment refs (React 19.3)</h2>
      {/* Không có div bọc — DOM phẳng, ref gom 3 article */}
      <Fragment ref={ref}>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 1</article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 2</article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 3</article>
      </Fragment>
      <button onClick={measure} style={{ marginTop: 8 }}>
        Đo + cuộn tới card đầu
      </button>
    </div>
  );
}
