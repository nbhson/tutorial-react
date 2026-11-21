// src/Counter.jsx
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: props.initial || 0 };
    this.increment = this.increment.bind(this);
  }
  increment() {
    this.setState(function (prev) { return { count: prev.count + 1 }; });
  }
  render() {
    return (
      <div>
        <p data-testid="count">{this.state.count}</p>
        <button onClick={this.increment}>Tăng</button>
      </div>
    );
  }
}
