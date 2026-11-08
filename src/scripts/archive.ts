export function syncYears(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll<HTMLElement>('[data-year-group]').forEach(group => {
    const count = [...group.querySelectorAll<HTMLElement>('[data-post-row]')].filter(row => !row.hidden).length;
    group.hidden = count === 0;
    const label = group.querySelector<HTMLElement>('[data-year-count]');
    if (label) label.textContent = `${count} ${count === 1 ? 'post' : 'posts'}`;
  });
}

