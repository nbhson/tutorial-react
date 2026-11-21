// LEGACY class — đối chiếu AngularJS filter:search.
class FilterSearchDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "", // chuỗi người dùng gõ — "nguồn" của bộ lọc
      items: [
        { id: 1, name: "quick sort" },
        { id: 2, name: "merge sort" },
        { id: 3, name: "bubble sort" },
        { id: 4, name: "insertion sort" }
      ]
    };
    this.handleQuery = this.handleQuery.bind(this);
  }
  handleQuery(e) { this.setState({ query: e.target.value }); } // ↔ ng-model trên ô tìm kiếm
  render() {
    const q = this.state.query.toLowerCase(); // chuẩn hóa KHÔNG phân biệt hoa thường
    // ↔ | filter:query — lọc JS thuần, kết quả là mảng MỚI (không mutate items)
    const visible = this.state.items.filter(function (x) {
      return x.name.toLowerCase().indexOf(q) !== -1; // name CHỨA chuỗi q
    });
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Filter / Search (≈ filter:q)</h2>
        <p><input value={this.state.query} onChange={this.handleQuery} placeholder="Tìm kiếm... (↔ ng-model + filter)" /></p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {visible.map(function (x) { return <li key={x.id}>{x.name}</li>; })}
        </ul>
        {visible.length === 0 && <p>Không tìm thấy.</p>} {/* empty state ↔ filter không có kết quả */}
      </div>
    );
  }
}
