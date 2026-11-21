// Layout trong example.tsx: 3 khe tường minh
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
// Dùng: slot phụ qua attribute, slot chính qua children
<Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
  <Card><p>Nội dung qua children.</p></Card>
</Layout>
