// LEGACY context API (childContextTypes/contextTypes) — đối chiếu AngularJS service.
// Hiện nay: dùng React.createContext + useContext.
class ThemeButton extends React.Component {
  render() {
    const theme = this.context.theme; // ↔ service được inject: đọc trực tiếp, không qua props
    const style = theme === "dark"
      ? { background: "#333", color: "#fff", padding: "8px 16px" }
      : { background: "#eee", color: "#000", padding: "8px 16px" };
    return <button style={style}>Nút theme: {theme}</button>;
  }
}
// Component con khai báo KIỂU context nó muốn nhận — bắt buộc với legacy API
ThemeButton.contextTypes = { theme: PropTypes.string };

class ContextDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { theme: "dark" };
    this.toggle = this.toggle.bind(this);
  }
  getChildContext() {
    return { theme: this.state.theme }; // phát giá trị cho cả cây con
  }
  toggle() {
    this.setState(function (prev) {
      return { theme: prev.theme === "dark" ? "light" : "dark" };
    });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Legacy Context (≈ service)</h2>
        <p><button onClick={this.toggle}>Đổi theme</button></p>
        {/* Không truyền props mà ThemeButton vẫn đọc được theme */}
        <ThemeButton />
      </div>
    );
  }
}
// Component "phát" phải khai báo childContextTypes — nếu thiếu sẽ cảnh báo
ContextDemo.childContextTypes = { theme: PropTypes.string };
