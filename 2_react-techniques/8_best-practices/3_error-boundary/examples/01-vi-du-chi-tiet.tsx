import { ErrorBoundary } from 'react-error-boundary';

// Widget có thể throw — nằm sau boundary
function BrokenWidget({ fail }: { fail: boolean }) {
  if (fail) throw new Error('Widget hỏng!');
  return <p>Widget OK</p>;
}

// Vùng an toàn: lỗi chỉ rơi vào fallback, phần trang còn lại sống
export function SafeSection({ fail }: { fail: boolean }) {
  return (
    <ErrorBoundary
      // fallbackRender nhận error + hàm reset
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>Có lỗi: {error.message}</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
      onError={(error, info) => {
        // Gửi lên Sentry kèm stack component — không chỉ console.log
        void captureException(error, { extra: { componentStack: info.componentStack } });
      }}
      // resetKeys: khi prop thay đổi thì tự reset boundary (không cần bấm)
      resetKeys={[fail]}
    >
      <BrokenWidget fail={fail} />
    </ErrorBoundary>
  );
}
