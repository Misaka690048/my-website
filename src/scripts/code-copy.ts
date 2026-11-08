import { icons } from '../assets/icons/lucide';

function copyIcon(name: 'copy' | 'check') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const attributes = { width: '19', height: '19', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
  Object.entries(attributes).forEach(([key, value]) => svg.setAttribute(key, value));
  icons[name].forEach(([tag, attrs]) => {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => child.setAttribute(key, value));
    svg.append(child);
  });
  return svg;
}

export function setupCodeCopy(signal: AbortSignal) {
  document.querySelectorAll<HTMLElement>('.prose .code-block').forEach(block => {
    const code = block.querySelector('pre > code');
    if (!code) return;
    let toolbar = block.querySelector('.code-toolbar');
    if (!toolbar) {
      // Older cached Markdown has a standalone language label, without a toolbar.
      toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      const label = block.querySelector(':scope > .code-language');
      if (label) toolbar.append(label);
      block.prepend(toolbar);
    }
    // Restored DOM snapshots can already contain controls from a previous visit.
    toolbar.querySelectorAll('[data-copy-control]').forEach(control => control.remove());
    const status = document.createElement('span');
    status.dataset.copyControl = '';
    status.className = 'code-copy-feedback sr-only';
    status.setAttribute('role', 'status');
    const button = document.createElement('button');
    button.dataset.copyControl = '';
    button.type = 'button';
    button.className = 'code-copy';
    let timer = 0;
    const reset = () => {
      button.replaceChildren(copyIcon('copy'));
      button.classList.remove('is-copied');
      button.setAttribute('aria-label', 'Copy code');
      button.title = 'Copy code';
      status.textContent = '';
      status.classList.add('sr-only');
    };
    reset();
    toolbar.append(status, button);
    button.addEventListener('click', async () => {
      clearTimeout(timer);
      reset();
      button.disabled = true;
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        if (signal.aborted) return;
        button.replaceChildren(copyIcon('check'));
        button.classList.add('is-copied');
        button.setAttribute('aria-label', 'Copied');
        button.title = 'Copied';
        status.textContent = 'Copied';
      } catch {
        if (signal.aborted) return;
        status.textContent = 'Copy failed';
        status.classList.remove('sr-only');
      } finally {
        button.disabled = false;
        if (!signal.aborted) timer = window.setTimeout(reset, 2000);
      }
    }, { signal });
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  });
}
