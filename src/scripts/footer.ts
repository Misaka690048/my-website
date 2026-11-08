import { siteAge } from '../lib/site-age';

export function updateFooter(doc: Document = document) {
  const age = siteAge();
  const years = doc.querySelector('[data-site-years]');
  const days = doc.querySelector('[data-site-days]');
  if (years) years.textContent = age.years;
  if (days) days.textContent = `Online for ${age.days} ${age.days === 1 ? 'day' : 'days'}`;
  return age.nextUpdate;
}

export function setupFooter(signal: AbortSignal) {
  let timer = 0;
  const refresh = () => {
    clearTimeout(timer);
    const delay = updateFooter();
    timer = window.setTimeout(refresh, delay + 50);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  }, { signal });
  window.addEventListener('pageshow', refresh, { signal });
  signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  refresh();
}
