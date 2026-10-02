/**
 * Helper utilities for fetching files, rendering markdown, code highlighting, and toast alerts.
 */

// In-memory cache for fetched files to eliminate network lag
const fileCache = new Map();

/**
 * Fetches static file content (markdown, source code) with caching.
 */
export async function fetchFile(path) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const text = await res.text();
    fileCache.set(path, text);
    return text;
  } catch (err) {
    console.warn(`Failed to fetch file at "${path}":`, err);
    return null;
  }
}

/**
 * Escapes HTML characters
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses markdown into styled HTML with support for GitHub-style alerts.
 */
export function renderMarkdown(markdown) {
  if (!markdown) return '<p class="text-muted">No documentation available for this module.</p>';

  if (typeof marked === 'undefined') {
    return `<pre class="fallback-md">${escapeHtml(markdown)}</pre>`;
  }

  // 1. Extract and protect LaTeX math expressions before marked parsing
  // This prevents markdown from converting LaTeX subscripts _ into <em> or * into <i>
  const mathExpressions = [];

  // Match Display Math: $$ ... $$
  let processed = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    const idx = mathExpressions.length;
    mathExpressions.push({ tex: tex.trim(), display: true });
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // Match Inline Math: $ ... $
  processed = processed.replace(/\$([^\$\n\r]+?)\$/g, (match, tex) => {
    const idx = mathExpressions.length;
    mathExpressions.push({ tex: tex.trim(), display: false });
    return `@@MATH_INLINE_${idx}@@`;
  });

  // Pre-process markdown for GitHub Alerts like > [!NOTE], > [!IMPORTANT]
  processed = processed.replace(
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim,
    (match, alertType, content) => {
      const cleanContent = content.replace(/^>\s?/gm, '');
      const typeLower = alertType.toLowerCase();
      return `
<div class="gh-alert gh-alert-${typeLower}">
  <div class="gh-alert-title">${alertType.toUpperCase()}</div>
  <div class="gh-alert-content">${cleanContent}</div>
</div>\n`;
    }
  );

  // Configure marked renderer for clean anchors and code blocks
  marked.setOptions({
    gfm: true,
    breaks: true,
    smartypants: false
  });

  let html = marked.parse(processed);

  // 2. Re-insert and render KaTeX math expressions
  html = html.replace(/@@MATH_(BLOCK|INLINE)_(\d+)@@/g, (match, type, idxStr) => {
    const item = mathExpressions[parseInt(idxStr, 10)];
    if (!item) return match;

    if (typeof katex !== 'undefined') {
      try {
        return katex.renderToString(item.tex, {
          displayMode: item.display,
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX rendering error for:', item.tex, err);
        return `<span class="katex-error">${escapeHtml(item.tex)}</span>`;
      }
    }

    return item.display ? `$$${escapeHtml(item.tex)}$$` : `$${escapeHtml(item.tex)}$`;
  });

  return html;
}

/**
 * Fallback DOM-level KaTeX math renderer using auto-render extension
 */
export function renderMath(container) {
  if (!container) return;
  if (typeof renderMathInElement !== 'undefined') {
    try {
      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
      return;
    } catch (e) {
      console.warn('renderMathInElement error:', e);
    }
  }

  // Fallback: direct katex render on formula containers if auto-render extension is not loaded
  if (typeof katex !== 'undefined') {
    container.querySelectorAll('.math-formula-render').forEach((el) => {
      const tex = el.textContent.trim().replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
      try {
        katex.render(tex, el, { displayMode: true, throwOnError: false });
      } catch (err) {
        console.warn('KaTeX fallback render error:', err);
      }
    });
  }
}

/**
 * Triggers Prism.js syntax highlighting inside a given DOM node or on the node itself.
 */
export function highlightCode(container) {
  if (typeof Prism === 'undefined' || !container) return;

  if (container.tagName && (container.tagName.toLowerCase() === 'code' || container.tagName.toLowerCase() === 'pre')) {
    Prism.highlightElement(container);
    return;
  }

  const blocks = container.querySelectorAll('pre code, code[class*="language-"]');
  if (blocks.length > 0) {
    blocks.forEach((block) => Prism.highlightElement(block));
  } else if (typeof Prism.highlightAllUnder === 'function') {
    Prism.highlightAllUnder(container);
  }
}

/**
 * Copies text to clipboard and flashes a button state.
 */
export function copyToClipboard(text, btnElement = null) {
  if (!text) return;

  navigator.clipboard.writeText(text).then(
    () => {
      showToast('Copied to clipboard!', 'success');
      if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Copied!</span>
        `;
        btnElement.classList.add('copied');
        setTimeout(() => {
          btnElement.innerHTML = originalText;
          btnElement.classList.remove('copied');
        }, 2000);
      }
    },
    (err) => {
      console.error('Clipboard copy failed:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  );
}

/**
 * Displays a subtle floating toast message.
 */
export function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  toastContainer.appendChild(toast);

  if (typeof anime !== 'undefined') {
    anime({
      targets: toast,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 300,
      easing: 'easeOutQuad'
    });
  }

  setTimeout(() => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: toast,
        opacity: [1, 0],
        translateY: [0, -10],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => {
          toast.remove();
        }
      });
    } else {
      toast.remove();
    }
  }, 2400);
}

/**
 * Debounce helper
 */
export function debounce(fn, delay = 150) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

