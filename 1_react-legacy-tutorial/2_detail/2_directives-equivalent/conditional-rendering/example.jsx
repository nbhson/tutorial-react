// LEGACY class — đối chiếu ng-if/ng-show.
class ConditionalDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, role: "guest", showBox: true };
    this.toggleLogin = this.toggleLogin.bind(this);
    this.toggleBox = this.toggleBox.bind(this);
    this.setRole = this.setRole.bind(this);
  }
  toggleLogin() { this.setState(function (p) { return { loggedIn: !p.loggedIn }; }); }
  toggleBox() { this.setState(function (p) { return { showBox: !p.showBox }; }); }
  setRole(e) { this.setState({ role: e.target.value }); }
  render() {
    const s = this.state;
    let roleMsg; // ↔ ng-switch
    switch (s.role) {
      case "admin": roleMsg = "Bạn là admin."; break;
      case "user": roleMsg = "Bạn là user."; break;
      default: roleMsg = "Bạn là khách.";
    }
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Conditional (≈ ng-if/ng-show)</h2>
        <p><button onClick={this.toggleLogin}>{s.loggedIn ? "Đăng xuất" : "Đăng nhập"}</button></p>
        {/* ↔ ng-if: gỡ hẳn khỏi DOM */}
        {s.loggedIn ? <p>Chào mừng! (ng-if=true)</p> : <p>Vui lòng đăng nhập. (ng-if=false)</p>}
        {s.loggedIn && <p>Panel chỉ hiện khi login (dạng {"cond && <X/>"}).</p>}
        <p><button onClick={this.toggleBox}>{s.showBox ? "Ẩn" : "Hiện"} hộp (ng-show)</button></p>
        {/* ↔ ng-show: vẫn trong DOM, chỉ ẩn CSS */}
        <div style={{ display: s.showBox ? "block" : "none", border: "1px solid #ddd", maxWidth: 300, margin: "0 auto" }}>
          Hộp ng-show: display={s.showBox ? "block" : "none"}
        </div>
        <p>
          <select value={s.role} onChange={this.setRole}>
            <option value="guest">guest</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </p>
        <p>{roleMsg} (≈ ng-switch)</p>
      </div>
    );
  }
}
