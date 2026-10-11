// example.tsx — DAY 5: children + named slots + fallback (khớp README 1-1)
// Mục đích: cha quyết nội dung, con quyết layout — composition thay inheritance.
import type { ReactNode } from "react"; // (1) Type cho mọi nội dung chèn được: element, string, số, mảng, null

// (2) Card: layout do Card quyết (viền + padding), nội dung do cha đưa qua children.
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      {children} {/* (3) Chèn nội dung cha đưa — Card không cần biết cụ thể là gì */}
    </div>
  );
}

// (4) Layout: 3 "khe" tường minh — header, sidebar (named slots), children (main).
// Thay cho <ng-content select="..."> của Angular: mỗi slot là một prop ReactNode có tên.
function Layout({ header, sidebar, children }: { header: ReactNode; sidebar: ReactNode; children: ReactNode }) {
  return (
    <div>
      <header>{header}</header> {/* (5) Slot header vào <header> */}
      <div style={{ display: "flex", gap: 12 }}>
        <aside>{sidebar}</aside> {/* (6) Slot sidebar vào <aside> */}
        <main>{children}</main> {/* (7) Slot chính vào <main> */}
      </div>
    </div>
  );
}

// (8) Panel: slot phụ tùy chọn (footer?) + fallback khi cha không truyền.
function Panel({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
      {/* (9) ?? fallback: không có footer thì hiện mặc định — thay projector fallback của Angular */}
      {footer ?? <small>Nội dung mặc định</small>}
    </section>
  );
}

export default function App() {
  return (
    <Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
      {/* (10) Mọi JSX ở đây thành children của Layout — lồng Card trong Layout (composition chồng) */}
      <Card>
        <p>Nội dung qua children.</p>
        <p>Nội dung 2 qua children.</p>
      </Card>
      {/* (11) Panel có footer + Panel dùng fallback — minh họa slot optional */}
      <Panel title="Có footer" footer={<button>Lưu</button>}>
        <p>Body panel 1</p>
      </Panel>
      <Panel title="Không footer">
        <p>Body panel 2 — footer rơi về mặc định</p>
      </Panel>
    </Layout>
  );
}
