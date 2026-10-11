// LEGACY class — đối chiếu ng-class/ng-style.
class StylingDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isActive: false, isError: false, color: "green" };
    this.toggleActive = this.toggleActive.bind(this);
    this.toggleError = this.toggleError.bind(this);
    this.setColor = this.setColor.bind(this);
  }
  toggleActive() { this.setState(function (p) { return { isActive: !p.isActive }; }); }
  toggleError() { this.setState(function (p) { return { isError: !p.isError }; }); }
  setColor(e) { this.setState({ color: e.target.value }); }
  render() {
    const s = this.state;
    // ↔ ng-class="{active: isActive, error: isError}"
    const cls = ["box", s.isActive && "active", s.isError && "error"].filter(Boolean).join(" ");
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Styling (≈ ng-class/ng-style)</h2>
        <style>{".box{border:1px solid #ddd;padding:12px;max-width:320px;margin:0 auto}.active{background:#e8f5e9}.error{border-color:red}"}</style>
        <p>
          <button onClick={this.toggleActive}>toggle active</button>{" "}
          <button onClick={this.toggleError}>toggle error</button>{" "}
          <input value={s.color} onChange={this.setColor} placeholder="màu (ng-style)" />
        </p>
        {/* ↔ ng-class + ng-style */}
        <div className={cls} style={{ color: s.color }}>
          className="{cls}" — style color {s.color}
        </div>
      </div>
    );
  }
}
