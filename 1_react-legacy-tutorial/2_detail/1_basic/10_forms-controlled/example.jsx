// LEGACY controlled form — đối chiếu ng-model.
class FormsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "", email: "", city: "hanoi", agree: false };
    this.handleField = this.handleField.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleField(e) {
    const t = e.target;
    // checkbox dùng checked, input khác dùng value
    const value = t.type === "checkbox" ? t.checked : t.value;
    this.setState({ [t.name]: value });
  }
  handleSubmit(e) {
    e.preventDefault();
    alert("Đã submit: " + JSON.stringify(this.state));
  }
  render() {
    const s = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Controlled Form (≈ ng-model)</h2>
        <form onSubmit={this.handleSubmit}>
          <p><input name="name" value={s.name} onChange={this.handleField} placeholder="Tên" /></p>
          <p><input name="email" value={s.email} onChange={this.handleField} placeholder="Email" /></p>
          <p>
            <select name="city" value={s.city} onChange={this.handleField}>
              <option value="hanoi">Hà Nội</option>
              <option value="hcm">TP.HCM</option>
              <option value="danang">Đà Nẵng</option>
            </select>
          </p>
          <p><label><input type="checkbox" name="agree" checked={s.agree} onChange={this.handleField} /> Đồng ý (≈ ng-checked)</label></p>
          <button type="submit">Gửi</button>
        </form>
        <pre style={{ textAlign: "left", maxWidth: 420, margin: "12px auto", background: "#f5f5f5", padding: 12 }}>
          {JSON.stringify(s, null, 2)}
        </pre>
      </div>
    );
  }
}
