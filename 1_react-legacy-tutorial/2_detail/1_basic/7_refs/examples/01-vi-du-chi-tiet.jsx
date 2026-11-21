// LEGACY createRef — đối chiếu thao tác DOM của AngularJS.
class RefsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef(); // tạo "container" ref, ban đầu current=null
    this.focus = this.focus.bind(this);
    this.clear = this.clear.bind(this);
  }
  focus() {
    // current trỏ đến input DOM thật (React gán sau khi mount)
    this.inputRef.current.focus(); // ↔ angular.element(...)[0].focus()
  }
  clear() {
    // Thao tác DOM trực tiếp — đây là GHI DOM, tránh lạm dụng
    this.inputRef.current.value = "";
    this.inputRef.current.focus();
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Refs (focus input)</h2>
        {/* Gắn ref vào element; defaultValue: chỉ khởi tạo lần đầu */}
        <p><input ref={this.inputRef} placeholder="Nhập tên..." defaultValue="Geeks" /></p>
        <p>
          <button onClick={this.focus}>Focus</button>{" "}
          <button onClick={this.clear}>Xóa + focus</button>
        </p>
      </div>
    );
  }
}
