import { ErrorBoundary } from 'react-error-boundary';

function BrokenWidget({ fail }: { fail: boolean }) {
  if (fail) throw new Error('Widget hỏng!');
  return <p>Widget OK</p>;
}

export function SafeSection({ fail }: { fail: boolean }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>Có lỗi: {error.message}</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
    >
      <BrokenWidget fail={fail} />
    </ErrorBoundary>
  );
}
