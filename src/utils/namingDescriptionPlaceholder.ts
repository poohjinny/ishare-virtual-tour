/**
 * Visitor-facing empty-state copy when a naming opportunity has no description.
 * Keep in sync with scripts/lib/devContentPlaceholders.mjs `defaultNamingBody`.
 */

export function defaultNamingDescription(
  opportunityTitle?: string | null,
  tourTitle?: string | null,
): string {
  const title = opportunityTitle?.trim() || 'This space';
  const tour = tourTitle?.trim() || 'this place';
  return `${title} is available to name. Contribute to support the people who rely on ${tour}.`;
}

/** True when copy is the empty-state naming placeholder, not client-authored body. */
export function isDefaultNamingDescription(
  description: string | null | undefined,
  opportunityTitle?: string | null,
  tourTitle?: string | null,
): boolean {
  const trimmed = description?.trim() ?? '';
  if (!trimmed) return false;
  return trimmed === defaultNamingDescription(opportunityTitle, tourTitle);
}
