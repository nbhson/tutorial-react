// LEGACY react-router-dom v5 (class + withRouter) — đối chiếu ngRoute.
// Chạy với npm: react@16 + react-router-dom@5. Bản CDN xem index.html.
var Router = window.ReactRouterDOM || {};
var Route = Router.Route, Switch = Router.Switch, Link = Router.Link, withRouter = Router.withRouter;

class Home extends React.Component {
  render() { return <div><h3>Trang chủ (≈ template home.html)</h3></div>; }
}

class About extends React.Component {
  render() { return <div><h3>Giới thiệu</h3><p>Đối chiếu route "/about" của ngRoute.</p></div>; }
}

class User extends React.Component {
  render() {
    // ↔ $routeParams.id
    const id = this.props.match ? this.props.match.params.id : "?";
    return <div><h3>User #{id}</h3><p>Đọc param qua this.props.match.params.</p></div>;
  }
}
var UserWithRouter = withRouter ? withRouter(User) : User;

class RouterDemo extends React.Component {
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Router v5 (≈ ngRoute)</h2>
        <nav>
          <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/user/42">User 42</Link>
        </nav>
        {/* ↔ <div ng-view></div> */}
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/user/:id" component={UserWithRouter} />
        </Switch>
      </div>
    );
  }
}
