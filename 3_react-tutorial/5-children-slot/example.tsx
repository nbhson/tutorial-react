// example.tsx — DAY 5: children + named slots
import type { ReactNode } from "react";

function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      {children}
    </div>
  );
}

function Layout({ header, sidebar, children }: { header: ReactNode; sidebar: ReactNode; children: ReactNode }) {
  return (
    <div>
      <header>{header}</header>
      <div style={{ display: "flex", gap: 12 }}>
        <aside>{sidebar}</aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
      <Card>
        <p>Nội dung qua children.</p>
        <p>Nội dung 2 qua children.</p>
      </Card>
    </Layout>
  );
}
