// Hover tooltips for the TV-ownership charts. Any element inside a .fcc-chart
// with a data-tip attribute shows that text (newlines allowed) on hover.
// Listeners sit on the document, so they survive page transitions.

const tipFor = (fig: HTMLElement) => {
  let tip = fig.querySelector<HTMLElement>(':scope > .fcc-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'fcc-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    fig.append(tip);
  }
  return tip;
};

let current: HTMLElement | null = null;

document.addEventListener('pointermove', (event) => {
  const target = event.target as Element | null;
  const fig = target?.closest<HTMLElement>('.fcc-chart') ?? null;
  const mark = target?.closest('[data-tip]');
  if (current && current !== fig) current.querySelector<HTMLElement>(':scope > .fcc-tip')?.setAttribute('hidden', '');
  current = fig;
  if (!fig) return;
  const tip = tipFor(fig);
  if (!mark || !fig.contains(mark)) {
    tip.hidden = true;
    return;
  }
  tip.textContent = mark.getAttribute('data-tip');
  tip.hidden = false;
  const box = fig.getBoundingClientRect();
  const x = Math.min(event.clientX - box.left + 14, box.width - tip.offsetWidth);
  const y = event.clientY - box.top + 14;
  tip.style.left = `${Math.max(0, x)}px`;
  tip.style.top = `${y}px`;
});
