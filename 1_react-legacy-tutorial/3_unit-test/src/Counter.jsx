import React from "react";

// LEGACY class — dùng để minh họa test (hiện nay nên dùng function + hooks).
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: props.initial || 0 };
    this.increment = this.increment.bind(this);
  }
  increment() {
    this.setState(function (prev) {
      return { count: prev.count + 1 };
    });
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

export function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(n);
}
