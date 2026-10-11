// LEGACY class — đối chiếu $scope / ng-model.
class Greeting extends React.Component {
  render() {
    // props chỉ đọc, không được gán lại
    return <p>Xin chào <b>{this.props.name}</b>!</p>;
  }
}

class PropsStateDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "Geeks", age: 10 }; // ↔ $scope.name
    this.handleName = this.handleName.bind(this);
    this.birthday = this.birthday.bind(this);
  }
  handleName(e) {
    this.setState({ name: e.target.value }); // ↔ ng-model (nhưng viết tay)
  }
  birthday() {
    // setState dạng hàm khi phụ thuộc state cũ
    this.setState(function (prev) { return { age: prev.age + 1 }; });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Props &amp; State</h2>
        <Greeting name={this.state.name} />
        <p><input value={this.state.name} onChange={this.handleName} /></p>
        <p>Tuổi: {this.state.age} <button onClick={this.birthday}>+1 tuổi</button></p>
      </div>
    );
  }
}
