// LEGACY createRef — đối chiếu thao tác DOM của AngularJS.
class RefsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.focus = this.focus.bind(this);
    this.clear = this.clear.bind(this);
  }
  focus() {
    this.inputRef.current.focus();
  }
  clear() {
    this.inputRef.current.value = "";
    this.inputRef.current.focus();
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Refs (focus input)</h2>
        <p><input ref={this.inputRef} placeholder="Nhập tên..." defaultValue="Geeks" /></p>
        <p>
          <button onClick={this.focus}>Focus</button>{" "}
          <button onClick={this.clear}>Xóa + focus</button>
        </p>
      </div>
    );
  }
}
