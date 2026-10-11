// LEGACY class + fetch — đối chiếu $http.get.
class HttpDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, error: null, users: [] };
    this.loadLocal = this.loadLocal.bind(this);
    this.loadRemote = this.loadRemote.bind(this);
  }
  componentDidMount() {
    this.loadLocal();
  }
  loadLocal() {
    this.setState({ loading: true, error: null });
    fetch("data.json")
      .then(function (res) { return res.json(); })
      .then(function (data) { this.setState({ users: data, loading: false }); }.bind(this))
      .catch(function (err) { this.setState({ error: String(err), loading: false }); }.bind(this));
  }
  loadRemote() {
    this.setState({ loading: true, error: null });
    fetch("https://jsonplaceholder.typicode.com/users?_limit=5")
      .then(function (res) { return res.json(); })
      .then(function (data) { this.setState({ users: data, loading: false }); }.bind(this))
      .catch(function (err) { this.setState({ error: String(err), loading: false }); }.bind(this));
  }
  render() {
    const s = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>HTTP fetch (≈ $http)</h2>
        <p>
          <button onClick={this.loadLocal}>Tải data.json (local)</button>{" "}
          <button onClick={this.loadRemote}>Tải API remote</button>
        </p>
        {s.loading && <p>Đang tải...</p>}
        {s.error && <p style={{ color: "red" }}>Lỗi: {s.error}</p>}
        {!s.loading && !s.error && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {s.users.map(function (u) {
              return <li key={u.id}>{u.name} — {u.email}</li>;
            })}
          </ul>
        )}
      </div>
    );
  }
}
