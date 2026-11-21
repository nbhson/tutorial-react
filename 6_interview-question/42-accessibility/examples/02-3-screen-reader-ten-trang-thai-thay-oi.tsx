// Form có label + lỗi đọc được
<label htmlFor="email">Email</label>
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-err" : undefined}
/>
{error && <p id="email-err" role="alert">{error}</p>}

// Vùng kết quả search tự đọc khi đổi
<div aria-live="polite">Tìm thấy {items.length} kết quả cho "{query}"</div>
