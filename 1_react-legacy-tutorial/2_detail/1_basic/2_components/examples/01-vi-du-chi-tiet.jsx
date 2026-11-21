// LEGACY class — đối chiếu AngularJS module/controller/directive.

// Component "Hello" — giống một directive nhỏ chỉ nhận 1 binding
class Hello extends React.Component {
  render() {
    // this.props.name ↔ scope.name truyền vào directive
    // props là dữ liệu từ cha đổ xuống, KHÔNG được gán lại
    return <p>Xin chào <b>{this.props.name}</b>!</p>;
  }
}

// Component "UserCard" — giống directive nhận cả object qua binding
class UserCard extends React.Component {
  render() {
    const user = this.props.user; // nhận nguyên object user
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, maxWidth: 360, margin: "8px auto" }}>
        <h4>{user.name}</h4>
        <p>Tuổi: {user.age}</p>
      </div>
    );
  }
}

// Component gốc — đóng vai "controller" + template chính
class ComponentsDemo extends React.Component {
  render() {
    const user = { name: "Geeks", age: 10 }; // dữ liệu như trong $scope
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>React Components (class)</h2>
        {/* Ghép component như thẻ HTML, truyền props xuống */}
        <Hello name="Geeks for Geeks" />
        <UserCard user={user} />
      </div>
    );
  }
}
