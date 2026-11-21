import { renderToPipeableStream } from 'react-dom/server';

renderToPipeableStream(<App />, {
  onShellReady() {
    pipe(response);
  },
  onBrowserBailout(error, errorInfo) {
    // error.cause = reason bạn truyền cho browser(...)
    logBrowserBailout(error, errorInfo);
  },
});
