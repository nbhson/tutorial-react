// LEGACY class — đối chiếu ng-repeat chi tiết ($index/$first/$last).
class ListsMapDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [
        { id: 1, name: "An" },
        { id: 2, name: "Bình" },
        { id: 3, name: "Chi" }
      ]
    };
  }
  render() {
    const users = this.state.users; // lấy mảng dữ liệu
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Lists map (≈ ng-repeat)</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map(function (u, i) {
            // i ↔ $index; $first ↔ i===0; $last ↔ i===length-1
            const tag = i === 0 ? " ($first)" : (i === users.length - 1 ? " ($last)" : "");
            return <li key={u.id}>#{$index = i} — {u.name}{tag}</li>;
          })}
        </ul>
        {/* Empty state ↔ ng-repeat không có phần tử */}
        {users.length === 0 && <p>Danh sách trống.</p>}
      </div>
    );
  }
}
