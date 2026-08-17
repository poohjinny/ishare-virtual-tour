/**
 * Share + Open Graph copy used by the SPA, tour-og Worker, and
 * `scripts/lib/devContentPlaceholders.mjs` (re-exports placeholders from here).
 */

export const SHARE_DESCRIPTION_MAX_CHARS = 220;

/** Soft lead when a place has no real scene description and no naming copy. */
export const EMPTY_PLACE_LEAD = 'Step inside and look around this space.';

export function defaultSceneDescription(tourTitle, sceneTitle) {
  const tour = String(tourTitle || '').trim() || 'this facility';
  const scene = String(sceneTitle || '').trim() || 'this area';
  return `Explore ${scene} as part of the ${tour} virtual tour.`;
}

export function isDefaultSceneDescription(description, tourTitle, sceneTitle) {
  const trimmed = String(description || '').trim();
  if (!trimmed) return false;
  return trimmed === defaultSceneDescription(tourTitle, sceneTitle);
}

export function defaultNamingDescription(opportunityTitle, tourTitle) {
  const title = String(opportunityTitle || '').trim() || 'This space';
  const tour = String(tourTitle || '').trim() || 'this place';
  return `${title} is available to name. Contribute to support the people who rely on ${tour}.`;
}

export function isDefaultNamingDescription(
  description,
  opportunityTitle,
  tourTitle,
) {
  const trimmed = String(description || '').trim();
  if (!trimmed) return false;
  return trimmed === defaultNamingDescription(opportunityTitle, tourTitle);
}

function lastCompleteSentenceEnd(text) {
  const pattern = /[.!?…]["'”’)]*(?=\s|$)/gu;
  let last = -1;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    last = match.index + match[0].length;
  }
  return last;
}

function stripInlineMarkdownLite(text) {
  return String(text || '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain, length-capped copy for share cards and OG description. */
export function formatShareDescriptionPlain(
  text,
  maxChars = SHARE_DESCRIPTION_MAX_CHARS,
) {
  const plain = stripInlineMarkdownLite(text);
  if (!plain) return '';
  if (plain.length <= maxChars) return plain;

  const withinBudget = plain.slice(0, maxChars);
  const lastSentenceEnd = lastCompleteSentenceEnd(withinBudget);
  if (lastSentenceEnd > Math.floor(maxChars * 0.4)) {
    return withinBudget.slice(0, lastSentenceEnd).trimEnd();
  }

  const lastSpace = withinBudget.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ?
      withinBudget.slice(0, lastSpace)
    : withinBudget;
  return clipped.replace(/[,;:–—-]+$/u, '').trimEnd();
}

function trimTrailingZeroDecimal(value) {
  return String(value).replace(/\.0$/, '');
}

/** Abbreviated currency — keep in sync with gallery / OG titles ($10.5M, $525K). */
export function formatOgPriceAbbrev(amount) {
  if (!Number.isFinite(Number(amount))) return '';
  const rounded = Math.round(Number(amount));
  if (rounded >= 1_000_000) {
    const millions = rounded / 1_000_000;
    const formatted =
      millions % 1 === 0 ?
        String(millions)
      : trimTrailingZeroDecimal(millions.toFixed(1));
    return `$${formatted}M`;
  }
  if (rounded >= 1_000) {
    const thousands = rounded / 1_000;
    const formatted =
      thousands % 1 === 0 ?
        String(thousands)
      : trimTrailingZeroDecimal(thousands.toFixed(1));
    return `$${formatted}K`;
  }
  return `$${rounded.toLocaleString('en-US')}`;
}

/** Gallery / OG price: custom label, else abbreviated amount. */
export function formatOgNamingPrice({ priceLabel, price } = {}) {
  const label = String(priceLabel || '').trim();
  if (label) return label;
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return formatOgPriceAbbrev(amount);
}

/**
 * Authored blurb only (no intro). Priority matches Explore / Share:
 * naming body → place lead → catalog summary. Skips placeholders.
 */
export function pickAuthoredShareDescription({
  namingBody,
  namingName,
  tourTitle,
  sceneTitle,
  placeLead,
  catalogSummary,
} = {}) {
  const naming = String(namingBody || '').trim();
  if (naming && !isDefaultNamingDescription(naming, namingName, tourTitle)) {
    return formatShareDescriptionPlain(naming);
  }

  const lead = String(placeLead || '').trim();
  if (
    lead &&
    lead !== EMPTY_PLACE_LEAD &&
    !isDefaultSceneDescription(lead, tourTitle, sceneTitle)
  ) {
    return formatShareDescriptionPlain(lead);
  }

  const summary = String(catalogSummary || '').trim();
  if (summary && summary !== EMPTY_PLACE_LEAD) {
    return formatShareDescriptionPlain(summary);
  }

  return '';
}

/**
 * Title + description for OG / in-app share. `authored` is already picked
 * visitor copy (no intro).
 */
export function buildOgShareCopy({
  tourTitle,
  sceneTitle,
  namingName,
  authored,
  priceLabel,
} = {}) {
  const tour = String(tourTitle || '').trim();
  const scene = String(sceneTitle || '').trim();
  const naming = String(namingName || '').trim();
  const body = String(authored || '').trim();
  const price = String(priceLabel || '').trim();

  if (naming) {
    const intro = `${naming} is a naming opportunity at ${scene} in ${tour}.`;
    return {
      title: price ? `${naming} · ${price} | ${tour}` : `${naming} | ${tour}`,
      description:
        body ?
          formatShareDescriptionPlain(`${intro} ${body}`)
        : `${intro} Open the link to learn more and look around.`,
    };
  }

  const intro = `Explore ${scene} in the ${tour} virtual tour.`;
  return {
    title: `${scene} | ${tour}`,
    description:
      body ?
        formatShareDescriptionPlain(`${intro} ${body}`)
      : `${intro} Open the link to look around in 360°.`,
  };
}
