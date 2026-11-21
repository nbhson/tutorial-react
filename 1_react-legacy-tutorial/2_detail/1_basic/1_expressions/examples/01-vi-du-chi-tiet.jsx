// LEGACY class — đối chiếu AngularJS ng-init/{{ }}.
class ExpressionsDemo extends React.Component {
  constructor(props) {
    super(props);
    // this.state ↔ ng-init="name='Geeks for Geeks'"
    // Dữ liệu được khai báo MỘT LẦN ở đây, sau đó render ra UI
    this.state = {
      name: "Geeks for Geeks", // ↔ ng-init="name='Geeks for Geeks'"
      sort: { one: "quick sort", two: "merge sort", three: "bubble sort" }
    };
  }
  render() {
    // Mỗi cặp { } là một expression được JS tính rồi chèn vào JSX
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>React Expressions (JSX)</h2>
        <div>
          {/* {name} ↔ {{ name }} của AngularJS */}
          <p>{this.state.name} is a portal for geeks.</p>
        </div>
        <div>
          <p>Sorting Algorithms:</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {/* Truy cập thuộc tính lồng nhau như JS bình thường */}
            <li>{this.state.sort.one}</li>
            <li>{this.state.sort.two}</li>
            <li>{this.state.sort.three}</li>
          </ul>
        </div>
        {/* Biểu thức JS tùy ý trong {}: */}
        <p>{"Tổng: " + (40 + 2)}</p>
      </div>
    );
  }
}
