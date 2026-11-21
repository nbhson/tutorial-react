// Angular: phải học directive + microsyntax
// <div *ngIf="isLogin">Hi</div>  hoặc  @if (isLogin) { <div>Hi</div> }

// React: JS thuần — không học gì mới ngoài JS bạn đã biết
function App({ isLogin }: { isLogin: boolean }) {
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>; // early return = "if" thường
  return <div>Hi</div>;
}
