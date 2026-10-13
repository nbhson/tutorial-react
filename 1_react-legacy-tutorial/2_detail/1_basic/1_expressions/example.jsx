// LEGACY class — đối chiếu AngularJS ng-init/{{ }}.
class ExpressionsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "Geeks for Geeks", // ↔ ng-init="name='Geeks for Geeks'"
      sort: { one: "quick sort", two: "merge sort", three: "bubble sort" }
    };
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>React Expressions (JSX)</h2>
        <div>
          <p>{this.state.name} is a portal for geeks.</p>
        </div>
        <div>
          <p>Sorting Algorithms:</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>{this.state.sort.one}</li>
            <li>{this.state.sort.two}</li>
            <li>{this.state.sort.three}</li>
          </ul>
        </div>
        {/* Biểu thức JS tùy ý trong {}: */}
        <p>{"Tổng: " + (40 + 2)}</p>
      </div>
    );
  }
}
