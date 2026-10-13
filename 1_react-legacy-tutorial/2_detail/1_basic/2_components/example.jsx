// LEGACY class — đối chiếu AngularJS module/controller/directive.
class Hello extends React.Component {
  render() {
    return <p>Xin chào <b>{this.props.name}</b>!</p>;
  }
}

class UserCard extends React.Component {
  render() {
    const user = this.props.user;
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, maxWidth: 360, margin: "8px auto" }}>
        <h4>{user.name}</h4>
        <p>Tuổi: {user.age}</p>
      </div>
    );
  }
}

class ComponentsDemo extends React.Component {
  render() {
    const user = { name: "Geeks", age: 10 };
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
