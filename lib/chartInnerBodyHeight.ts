// lib/chartInnerBodyHeight.ts
// WHAT: Exact box-model inner height calculator for 3-zone chart containers (`CellWrapper` / `TextChart`).
// WHY: Subtracting only `titleZone.offsetHeight` from `container.offsetHeight` ignores the container's
//      own vertical padding + borders and header margins, causing `ResizeObserver` to self-inflate
//      `--chart-body-height` every animation frame when container height is content-driven (`100%`/`auto`).

export function computeInnerBodyHeight(
  container: HTMLElement,
  titleZone?: HTMLElement | null,
  subtitleZone?: HTMLElement | null
): number {
  const cs = window.getComputedStyle(container);
  const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
  const innerBoxHeight =
    container.clientHeight > 0
      ? container.clientHeight - padY
      : container.offsetHeight - padY - borderY;

  let headerHeight = 0;
  if (titleZone) {
    const tcs = window.getComputedStyle(titleZone);
    headerHeight +=
      titleZone.offsetHeight + (parseFloat(tcs.marginTop) || 0) + (parseFloat(tcs.marginBottom) || 0);
  }
  if (subtitleZone) {
    const scs = window.getComputedStyle(subtitleZone);
    headerHeight +=
      subtitleZone.offsetHeight + (parseFloat(scs.marginTop) || 0) + (parseFloat(scs.marginBottom) || 0);
  }

  return Math.max(0, Math.floor(innerBoxHeight - headerHeight));
}

export function readExplicitBlockHeightToken(el: HTMLElement): string {
  const cs = window.getComputedStyle(el);
  return (
    cs.getPropertyValue('--block-height').trim() ||
    cs.getPropertyValue('--row-height').trim() ||
    ''
  );
}
