/** Slide offset (px) for segmented tab panel enter — sign follows tab index delta. */
export function resolveSegmentedTabEnterOffsetPx(
  tabOrder: readonly string[],
  previousKey: string,
  nextKey: string,
  magnitudePx = 16,
): number {
  const previousIndex = tabOrder.indexOf(previousKey);
  const nextIndex = tabOrder.indexOf(nextKey);

  if (previousIndex === -1 || nextIndex === -1 || previousIndex === nextIndex) {
    return magnitudePx;
  }

  return nextIndex > previousIndex ? magnitudePx : -magnitudePx;
}
