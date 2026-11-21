import { createRoot } from 'react-dom/client';

// Thay cho: ReactDOM.render(<App />, container)
const root = createRoot(container, options?); // options: { onUncaughtError?, onRecoverableError?, identifierPrefix?... }
root.render(<App />);   // render (có thể bị ngắt nếu có update khẩn cấp hơn)
root.unmount();         // gỡ cây, dọn listener (thay cho ReactDOM.unmountComponentAtNode)
