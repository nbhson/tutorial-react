// LEGACY class — đối chiếu ng-repeat + track by.
class ListsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [
        { id: 1, name: "quick sort" },
        { id: 2, name: "merge sort" },
        { id: 3, name: "bubble sort" }
      ],
      next: ""
    };
    this.handleInput = this.handleInput.bind(this);
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
  }
  handleInput(e) { this.setState({ next: e.target.value }); }
  add() {
    if (!this.state.next.trim()) return;
    this.setState(function (prev) {
      const id = prev.items.length ? Math.max.apply(null, prev.items.map(function (x) { return x.id; })) + 1 : 1;
      return { items: prev.items.concat({ id: id, name: prev.next }), next: "" };
    });
  }
  remove(id) {
    this.setState(function (prev) {
      return { items: prev.items.filter(function (x) { return x.id !== id; }) };
    });
  }
  render() {
    const self = this;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Lists &amp; Keys (≈ ng-repeat)</h2>
        <p>
          <input value={this.state.next} onChange={this.handleInput} placeholder="Thuật toán mới" />
          <button onClick={this.add}>Thêm</button>
        </p>
        {/* key={x.id} ↔ track by x.id */}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {this.state.items.map(function (x) {
            return (
              <li key={x.id}>
                {x.name} <button onClick={function () { self.remove(x.id); }}>Xóa</button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
