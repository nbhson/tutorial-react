import { useId } from 'react';

// Form field accessible: label liên kết, lỗi báo qua role="alert"
export function EmailField({ error }: { error?: string }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      {error && (
        <p id={errId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </div>
  );
}
