// LEGACY class — đối chiếu $scope / ng-model.

// Greeting: component con chỉ nhận props (chỉ đọc)
class Greeting extends React.Component {
  render() {
    // props chỉ đọc, không được gán lại
    // Cha đổi state → render lại → Greeting nhận props mới
    return <p>Xin chào <b>{this.props.name}</b>!</p>;
  }
}

class PropsStateDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "Geeks", age: 10 }; // ↔ $scope.name, $scope.age
    // Legacy: phải bind handler trước khi dùng làm callback
    this.handleName = this.handleName.bind(this);
    this.birthday = this.birthday.bind(this);
  }
  handleName(e) {
    // ↔ ng-model (nhưng viết tay): mỗi lần gõ → setState → re-render
    this.setState({ name: e.target.value });
  }
  birthday() {
    // setState dạng hàm khi phụ thuộc state cũ:
    // an toàn với batch/async (không bị mất bước cộng)
    this.setState(function (prev) { return { age: prev.age + 1 }; });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Props &amp; State</h2>
        {/* State ở cha chảy xuống con qua prop name */}
        <Greeting name={this.state.name} />
        {/* Controlled input: value lấy từ state, onChange đẩy ngược lên */}
        <p><input value={this.state.name} onChange={this.handleName} /></p>
        <p>Tuổi: {this.state.age} <button onClick={this.birthday}>+1 tuổi</button></p>
      </div>
    );
  }
}
