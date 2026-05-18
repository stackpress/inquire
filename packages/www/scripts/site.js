const storageKey = 'inquire-docs-theme';
const root = document.documentElement;
applyTheme(localStorage.getItem(storageKey) || 'auto');

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-theme-toggle]');

  toggle?.addEventListener('click', () => {
    const current = root.dataset.theme || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(storageKey, next);
  });

  for (const button of document.querySelectorAll('.copy-button')) {
    button.addEventListener('click', (event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }
      const shell = target.closest('.code-shell');
      const code = shell?.querySelector('.code-block code');
      const text = code?.textContent || '';

      copyText(text)
        .then(() => setCopyState(target, 'Copied'))
        .catch(() => setCopyState(target, 'Copy failed'));
    });
  }
});

function applyTheme(theme) {
  const resolved = theme === 'auto'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : theme;
  root.dataset.theme = resolved;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  fallbackCopyText(value);
}

function fallbackCopyText(value) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.left = '-9999px';
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Copy command was rejected');
  }
}

function setCopyState(button, label) {
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = 'Copy example';
  }, 1500);
}
