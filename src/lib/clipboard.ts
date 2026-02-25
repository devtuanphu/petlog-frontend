/**
 * Copy text to clipboard with fallback for non-HTTPS contexts.
 * navigator.clipboard.writeText() requires a secure context (HTTPS or localhost).
 * On HTTP (e.g., LAN IP), we fall back to document.execCommand('copy').
 */
export function copyToClipboard(text: string): Promise<void> {
  // Try modern API first (works on HTTPS & localhost)
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for HTTP / insecure contexts
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    } catch (err) {
      reject(err);
    }
  });
}
