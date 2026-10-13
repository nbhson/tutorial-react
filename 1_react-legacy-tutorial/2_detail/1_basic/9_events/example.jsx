// LEGACY class events — đối chiếu ng-click/ng-change/ng-blur.
class EventsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0, text: "", blurred: false };
    // Legacy: bắt buộc bind từng handler
    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  increment() { this.setState(function (p) { return { count: p.count + 1 }; }); }
  decrement() { this.setState(function (p) { return { count: p.count - 1 }; }); }
  handleChange(e) { this.setState({ text: e.target.value }); } // ↔ ng-change
  handleBlur() { this.setState({ blurred: true }); }            // ↔ ng-blur
  handleSubmit(e) {
    e.preventDefault();
    alert("Submit: " + this.state.text);
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Events (≈ ng-click/ng-change)</h2>
        <p>Count: {this.state.count}{" "}
          <button onClick={this.increment}>+ (ng-click)</button>{" "}
          <button onClick={this.decrement}>−</button>
        </p>
        <form onSubmit={this.handleSubmit}>
          <input value={this.state.text} onChange={this.handleChange} onBlur={this.handleBlur} placeholder="Nhập rồi blur/submit" />
          <button type="submit">Submit</button>
        </form>
        {this.state.blurred && <p>(Đã blur khỏi input — ↔ ng-blur)</p>}
      </div>
    );
  }
}
