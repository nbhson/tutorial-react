// App.jsx — LEGACY: class components (React 16 era).
// Hiện nay nên dùng function components + hooks (xem 3_react-tutorial).
class Hello extends React.Component {
  render() {
    // {this.props.name} ↔ AngularJS {{ name }}
    return <p><b>{this.props.name}</b> là cổng thông tin cho geeks.</p>;
  }
}

class SortList extends React.Component {
  constructor(props) {
    super(props);
    // this.state ↔ AngularJS $scope / ng-init
    this.state = {
      sort: { one: "quick sort", two: "merge sort", three: "bubble sort" }
    };
  }
  render() {
    const { one, two, three } = this.state.sort;
    return (
      <div className="card">
        <p>Sorting Algorithms:</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>{one}</li>
          <li>{two}</li>
          <li>{three}</li>
        </ul>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.increment = this.increment.bind(this); // legacy: phải bind this
  }
  increment() {
    // setState → re-render + diff Virtual DOM (↔ AngularJS digest cycle)
    this.setState(function (prev) { return { count: prev.count + 1 }; });
  }
  render() {
    return (
      <div>
        <h2 className="title">React Legacy Overview</h2>
        <Hello name="Geeks for Geeks" />
        <SortList />
        <div className="card">
          <p>Count: {this.state.count}</p>
          <button onClick={this.increment}>Tăng (setState → Virtual DOM diff)</button>
        </div>
      </div>
    );
  }
}
