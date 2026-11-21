// Bật khi CSP có require-trusted-types-for 'script' — trả TrustedHTML thay vì string
import DOMPurify from 'dompurify';
DOMPurify.setConfig({ RETURN_TRUSTED_TYPE: true });
export const cleanHtml = (raw: string) => DOMPurify.sanitize(raw);
