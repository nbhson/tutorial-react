// utils/state.ts — tự khai báo cách "thay" module khi HMR
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // module mới về: áp dụng thủ công, không để escalate full reload
    store.replaceReducer(newModule.reducer);
  });
  import.meta.hot.dispose(() => {
    clearInterval(timer); // dọn side-effect của phiên bản cũ — không để "state ma"
  });
}
