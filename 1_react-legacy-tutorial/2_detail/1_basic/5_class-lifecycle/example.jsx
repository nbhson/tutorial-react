// LEGACY class lifecycle — đối chiếu $onInit/$onDestroy.
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { now: new Date() };
    console.log("Clock: constructor");
  }
  componentDidMount() {
    // ↔ $onInit — gọi API / đặt timer ở đây
    console.log("Clock: componentDidMount");
    this.timer = setInterval(() => {
      this.setState({ now: new Date() });
    }, 1000);
  }
  componentDidUpdate(prevProps, prevState) {
    // ↔ $onChanges/$doCheck — chạy sau mỗi re-render
    if (prevState.now !== this.state.now) {
      console.log("Clock: componentDidUpdate");
    }
  }
  componentWillUnmount() {
    // ↔ $onDestroy — bắt buộc dọn timer/subscription
    console.log("Clock: componentWillUnmount — clear timer");
    clearInterval(this.timer);
  }
  render() {
    return <p>Giờ hiện tại: {this.state.now.toLocaleTimeString("vi-VN")}</p>;
  }
}

class LifecycleDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: true };
    this.toggle = this.toggle.bind(this);
  }
  toggle() {
    this.setState(function (prev) { return { show: !prev.show }; });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Class Lifecycle</h2>
        <button onClick={this.toggle}>{this.state.show ? "Ẩn" : "Hiện"} đồng hồ (test unmount)</button>
        {this.state.show ? <Clock /> : <p>Đã gỡ Clock (xem console: componentWillUnmount).</p>}
      </div>
    );
  }
}
