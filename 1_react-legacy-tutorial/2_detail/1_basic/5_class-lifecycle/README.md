# 5. Class Lifecycle

> ⚠️ LEGACY: lifecycle của class. Hiện nay nên dùng `useEffect`.
> Đối chiếu AngularJS `$onInit` / `$onDestroy` (và `$onChanges`, `$doCheck`).

## Mục tiêu bài học
- Biết các mốc lifecycle quan trọng của class component React 16 và thứ tự thực thi.
- Biết đặt việc gì ở đâu: gọi API/timer ở `componentDidMount`, dọn dẹp ở `componentWillUnmount`.
- Tránh lỗi lặp vô hạn khi dùng `componentDidUpdate`.

## Khái niệm cốt lõi (Core)
- Class component có **vòng đời** được React gọi tự động theo các mốc: mount (gắn vào DOM) → update (re-render) → unmount (gỡ khỏi DOM). Bạn không gọi các mốc này, bạn *định nghĩa* chúng, React sẽ gọi.
- Đối chiếu AngularJS: controller có `$onInit` (khởi tạo), `$onChanges`/$doCheck (phát hiện thay đổi binding), `$onDestroy` (dọn dẹp). React legacy tương ứng: `constructor`, `componentDidUpdate`, `componentWillUnmount`.
- Bảng mốc chính (React 16):

| Lifecycle | Chạy khi | Tương đương AngularJS |
|---|---|---|
| `constructor` | khởi tạo state, bind | khởi tạo controller |
| `componentDidMount` | đã gắn vào DOM — gọi API ở đây | `$onInit` |
| `componentDidUpdate(prevProps, prevState)` | sau mỗi re-render | `$onChanges` + `$doCheck` |
| `componentWillUnmount` | trước khi gỡ — dọn timer/subscription | `$onDestroy` |
| `shouldComponentUpdate` | quyết định có render lại không (tối ưu) | — (giống one-time binding) |

- **Luôn so sánh `prevState`/`prevProps`**: `componentDidUpdate` chạy sau MỌI re-render. Muốn "làm gì đó khi X đổi", phải tự kiểm tra `prevProps.X !== this.props.X`. Không có cơ chế "watch" tự động như `$watch` của AngularJS.
- **Muốn chỉ chạy một lần** → chỉ đặt trong `componentDidMount`; đừng nhồi vào `componentDidUpdate` kèm điều kiện phức tạp.
- **Dọn dẹp là bắt buộc**: mọi thứ mở ra trong `componentDidMount` (timer, subscription, listener) nên đóng lại trong `componentWillUnmount`. AngularJS `$onDestroy` cũng vì lý do này.

### Keyword chính
`constructor` · `render` · `componentDidMount` · `componentDidUpdate` · `componentWillUnmount` · `clearInterval`.

## Luồng hoạt động (Flow)
1. Mount: `constructor → render → componentDidMount`. Sau khi React thật sự chèn DOM, `componentDidMount` chạy — nơi đặt `setInterval` cập nhật giờ mỗi giây.
2. Update: mỗi lần state đổi → `render → componentDidUpdate(prevProps, prevState)`. Trong ví dụ, mỗi giây `setState({now})` → render → `componentDidUpdate` log.
3. Bấm "Ẩn đồng hồ" → `setState({show:false})` → React gỡ `<Clock>` → `componentWillUnmount` chạy → `clearInterval(this.timer)` dừng timer.
4. Bấm "Hiện" → `<Clock>` được mount lại từ đầu (constructor → didMount...).

**Chạy:** mở `index.html`, xem log trong console + đồng hồ chạy/dừng.

## Ví dụ chi tiết
```jsx
// LEGACY class lifecycle — đối chiếu $onInit/$onDestroy.
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { now: new Date() };
    console.log("Clock: constructor");// chạy 1 lần lúc mount
  }
  componentDidMount() {
    // ↔ $onInit — gọi API / đặt timer ở đây (DOM đã sẵn sàng)
    console.log("Clock: componentDidMount");
    this.timer = setInterval(() => {
      this.setState({ now: new Date() }); // mỗi giây cập nhật giờ
    }, 1000);
  }
  componentDidUpdate(prevProps, prevState) {
    // ↔ $onChanges/$doCheck — chạy sau mỗi re-render
    // Luôn so sánh với prevState/prevProps trước khi làm gì đó
    if (prevState.now !== this.state.now) {
      console.log("Clock: componentDidUpdate");
    }
  }
  componentWillUnmount() {
    // ↔ $onDestroy — bắt buộc dọn timer/subscription, nếu không sẽ rò rỉ
    console.log("Clock: componentWillUnmount — clear timer");
    clearInterval(this.timer);
  }
  render() {
    return <p>Giờ hiện tại: {this.state.now.toLocaleTimeString("vi-VN")}</p>;
  }
}

class LifecycleDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: true };
    this.toggle = this.toggle.bind(this);
  }
  toggle() {
    // Đảo cờ show: true → false sẽ unmount Clock
    this.setState(function (prev) { return { show: !prev.show }; });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Class Lifecycle</h2>
        <button onClick={this.toggle}>{this.state.show ? "Ẩn" : "Hiện"} đồng hồ (test unmount)</button>
        {this.state.show ? <Clock /> : <p>Đã gỡ Clock (xem console: componentWillUnmount).</p>}
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`constructor`**: mount lần đầu; khởi tạo state và bind. Chưa có DOM thật ở đây.
- **`componentDidMount`**: DOM đã trong trang → thích hợp đặt `setInterval`, fetch API, đăng ký event listener. Ở đây timer mỗi giây cập nhật `now`.
- **`componentDidUpdate(prevProps, prevState)`**: chạy sau mỗi lần render do state/props đổi. Vì chạy THƯỜNG XUYÊN nên phải so sánh `prevState.now !== this.state.now` trước khi log — nếu không mọi update đều log.
- **`componentWillUnmount`**: gỡ Clock khỏi cây → chạy lần cuối. Nếu không `clearInterval`, timer vẫn chạy ngầm mỗi giây, gọi `setState` trên component đã gỡ → **rò rỉ bộ nhớ / lỗi virtual DOM**. Đây là lỗi kinh điển khi dịch từ AngularJS quên `$onDestroy`.
- **`{this.state.show ? <Clock /> : ...}`**: ternary điều khiển mount/unmount — chính là cách "ng-if" ảnh hưởng đến lifecycle.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `$onInit` | `componentDidMount` | Gọi API, khởi động timer |
| `$onChanges(changesObj)` / `$doCheck` | `componentDidUpdate(prevProps, prevState)` | Nhận "trước/sau" để xử lý khác biệt |
| `$onDestroy` | `componentWillUnmount` | Dọn timer/listener, tránh rò rỉ |
| — | `shouldComponentUpdate` | Trả `false` → bỏ qua render (tối ưu) |
| — | `constructor` | Khởi tạo state + bind handler |

## Lỗi thường gặp (Common pitfalls)
- **`setState` vô điều kiện trong `componentDidUpdate`** → render → update → setState → render... lặp vô hạn. → Chỉ setState khi `prevProps/prevState` khác giá trị hiện tại.
- **Quên `clearInterval`/`removeEventListener` trong `componentWillUnmount`** → timer/services chạy trên component đã gỡ → rò rỉ + lỗi. → Luôn dọn những gì đã mở.
- **Gọi API trong `render()`** → render chạy rất nhiều lần → dồn request thừa. → Đặt trong `componentDidMount` hoặc `componentDidUpdate` (có điều kiện).
- **Ngỡ `componentDidMount` chạy lại mỗi khi state đổi** → logic bị lặp. → Mount chỉ 1 lần; update dùng `componentDidUpdate`.
- **Set state ngay trong `constructor` sau khi gọi `setState`** — constructor chỉ khởi tạo, không gọi `setState` ở đó. → Gán trực tiếp `this.state = {...}`.

## Best practices / Mẹo
- Bảng tra cứu: "cần chạy 1 lần khi mount" → `componentDidMount`; "cần chạy khi giá trị đổi" → `componentDidUpdate` (kèm so sánh); "cần dọn dẹp" → `componentWillUnmount`.
- Giữ lifecycle method ngắn: logic phức tạp tách ra method riêng.
- Dùng `shouldComponentUpdate` (hoặc `React.PureComponent`) khi component render nhiều tốn kém — nhưng đừng lạm dụng.

## Bài tập nhỏ
1. Thêm `componentWillUnmount` log thời điểm unmount và đếm số lần Clock được mount lại (dùng biến ngoài class).
2. Trong `componentDidMount` của Clock thêm `fetch` lấy 1 dữ liệu giả rồi log — so sánh thứ tự log với `render`.

## Reference
- https://legacy.reactjs.org/docs/react-component.html
- https://legacy.reactjs.org/docs/state-and-lifecycle.html
- https://legacy.reactjs.org/docs/hooks-effect.html (thay thế hiện đại: useEffect)