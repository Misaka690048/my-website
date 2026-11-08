/** Keep the current section open, including when its h3 is current.
 * A keyboard-focused child stays reachable until focus leaves that section.
 */
export function syncTocGroups(groups: HTMLElement[], activeLink?: HTMLElement, focused: Element | null = null) {
  for (const group of groups) {
    const panel = group.querySelector<HTMLElement>('[data-toc-children]');
    if (!panel) continue;
    const open = (!!activeLink && group.contains(activeLink)) || (!!focused && panel.contains(focused));
    group.classList.toggle('is-current-section', open);
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
  }
}

/** Project a target into the settled layout, rather than chasing each resize frame. */
export function settledTocTop(top: number, precedingPanels: { current: number; expanded: number; open: boolean }[]) {
  return top + precedingPanels.reduce((shift, panel) =>
    shift + (panel.open ? panel.expanded : 0) - panel.current, 0);
}
