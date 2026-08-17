export const SHARE_DESCRIPTION_MAX_CHARS: number;
export const EMPTY_PLACE_LEAD: string;

export function defaultSceneDescription(
  tourTitle?: string | null,
  sceneTitle?: string | null,
): string;

export function isDefaultSceneDescription(
  description?: string | null,
  tourTitle?: string | null,
  sceneTitle?: string | null,
): boolean;

export function defaultNamingDescription(
  opportunityTitle?: string | null,
  tourTitle?: string | null,
): string;

export function isDefaultNamingDescription(
  description?: string | null,
  opportunityTitle?: string | null,
  tourTitle?: string | null,
): boolean;

export function formatShareDescriptionPlain(
  text: string,
  maxChars?: number,
): string;

export function formatOgPriceAbbrev(amount: number): string;

export function formatOgNamingPrice(input?: {
  priceLabel?: string | null;
  price?: number | null;
}): string;

export function pickAuthoredShareDescription(input?: {
  namingBody?: string | null;
  namingName?: string | null;
  tourTitle?: string | null;
  sceneTitle?: string | null;
  placeLead?: string | null;
  catalogSummary?: string | null;
}): string;

export function buildOgShareCopy(input?: {
  tourTitle?: string | null;
  sceneTitle?: string | null;
  namingName?: string | null;
  authored?: string | null;
  priceLabel?: string | null;
}): { title: string; description: string };
