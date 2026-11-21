function renderState(s: State) {
  switch (s.status) {
    case "idle":    return <p>Ready</p>;
    case "loading": return <Spinner />;
    case "success": return <List data={s.data} />;   // s.data đảm bảo defined, không cần "!"
    case "error":   return <Alert msg={s.error} />;
    default: {
      const _exhaustive: never = s; // thêm state mới mà chưa xử lý → compile error ngay đây
      return _exhaustive;
    }
  }
}
