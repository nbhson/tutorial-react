// LEGACY class — đối chiếu AngularJS orderBy.
class SortDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: "name",
      sortDir: "asc",
      items: [
        { id: 1, name: "Merge sort", price: 300 },
        { id: 2, name: "Quick sort", price: 100 },
        { id: 3, name: "Bubble sort", price: 200 }
      ]
    };
    this.sortBy = this.sortBy.bind(this);
  }
  sortBy(key) {
    this.setState(function (prev) {
      // bấm lại cùng cột → đảo chiều (↔ orderBy toggle)
      const dir = prev.sortKey === key && prev.sortDir === "asc" ? "desc" : "asc";
      return { sortKey: key, sortDir: dir };
    });
  }
  render() {
    const key = this.state.sortKey, dir = this.state.sortDir;
    const sorted = this.state.items.slice().sort(function (a, b) {
      let r;
      if (typeof a[key] === "string") r = a[key].localeCompare(b[key], "vi");
      else r = a[key] > b[key] ? 1 : -1;
      return dir === "asc" ? r : -r;
    });
    const arrow = function (k) { return key === k ? (dir === "asc" ? " ▲" : " ▼") : ""; };
    const self = this;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Sort (≈ orderBy)</h2>
        <table border="1" cellPadding="8" style={{ margin: "0 auto" }}>
          <thead>
            <tr>
              <th><button onClick={function () { self.sortBy("name"); }}>Tên{arrow("name")}</button></th>
              <th><button onClick={function () { self.sortBy("price"); }}>Giá{arrow("price")}</button></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(function (x) {
              return <tr key={x.id}><td>{x.name}</td><td>{x.price}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
