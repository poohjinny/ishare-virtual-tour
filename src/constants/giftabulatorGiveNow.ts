import type { NamingOpportunity } from '../types/tour';
import { parseNamingPrice } from '../utils/namingPrice';

/** Giftabulator give-now `calc` defaults — province, asset, pledgePeriod stay fixed. */
export const GIFTABULATOR_GIVE_NOW_PRESET = {
  province: 'AB',
  asset: 'stock',
  pledgePeriod: '5',
  income: 100_000,
  assetValue: 75_000,
  assetCost: 25_000,
  donation: 5_000,
} as const;

/**
 * Bounds applied after preset-ratio scaling — avoids unrealistic values on large NO prices.
 * `maxFromDonation` caps relative to the gift amount; `absoluteMax` is a hard ceiling.
 *
 * @see docs/GIFTABULATOR_GIVE_NOW.md
 */
export const GIFTABULATOR_GIVE_NOW_LIMITS = {
  income: {
    absoluteMax: 250_000,
    /** At large gift sizes, income tops out at donation (not 20× donation). */
    maxFromDonation: 1,
  },
  assetValue: {
    absoluteMax: 100_000,
    /** FMV of donated stock — up to 2/3 of the gift on large naming amounts. */
    maxFromDonation: 2 / 3,
  },
  assetCost: { absoluteMax: 50_000 },
} as const;

export interface GiftabulatorGiveNowCalc {
  province: string;
  income: string;
  asset: string;
  assetValue: string;
  assetCost: string;
  donation: string;
  pledgePeriod: string;
}

function formatGiftabulatorCalcAmount(amount: number): string {
  return String(Math.round(amount));
}

function clampAmount(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scaledPresetAmount(
  presetAmount: number,
  donation: number,
  presetDonation: number,
): number {
  return presetAmount * (donation / presetDonation);
}

function resolveBoundedAmount(
  presetAmount: number,
  donation: number,
  presetDonation: number,
  options: { absoluteMax: number; maxFromDonation?: number },
): number {
  const scaled = scaledPresetAmount(presetAmount, donation, presetDonation);
  const floor = donation >= presetDonation ? presetAmount : scaled;

  const donationCap =
    options.maxFromDonation == null ?
      Number.POSITIVE_INFINITY
    : Math.max(presetAmount, donation * options.maxFromDonation);

  const ceiling = Math.min(scaled, options.absoluteMax, donationCap);

  return clampAmount(scaled, floor, ceiling);
}

/** Scale income / asset fields from the preset, with per-field caps for large gifts. */
export function resolveGiftabulatorGiveNowCalc(
  donationAmount: number,
): GiftabulatorGiveNowCalc {
  const preset = GIFTABULATOR_GIVE_NOW_PRESET;
  const limits = GIFTABULATOR_GIVE_NOW_LIMITS;
  const safeDonation =
    Number.isFinite(donationAmount) && donationAmount > 0 ?
      donationAmount
    : preset.donation;

  const income = resolveBoundedAmount(
    preset.income,
    safeDonation,
    preset.donation,
    limits.income,
  );
  const assetValue = resolveBoundedAmount(
    preset.assetValue,
    safeDonation,
    preset.donation,
    limits.assetValue,
  );
  const basisRatio = preset.assetCost / preset.assetValue;
  const scaledAssetCost = scaledPresetAmount(
    preset.assetCost,
    safeDonation,
    preset.donation,
  );
  const assetCost = clampAmount(
    scaledAssetCost,
    safeDonation >= preset.donation ? preset.assetCost : scaledAssetCost,
    Math.min(limits.assetCost.absoluteMax, assetValue * basisRatio),
  );

  return {
    province: preset.province,
    asset: preset.asset,
    pledgePeriod: preset.pledgePeriod,
    income: formatGiftabulatorCalcAmount(income),
    assetValue: formatGiftabulatorCalcAmount(assetValue),
    assetCost: formatGiftabulatorCalcAmount(assetCost),
    donation: formatGiftabulatorCalcAmount(safeDonation),
  };
}

export function buildGiftabulatorGiveNowCalcFromNaming(
  naming?: NamingOpportunity,
): GiftabulatorGiveNowCalc {
  const donationAmount = naming?.price ? parseNamingPrice(naming.price) : null;

  return resolveGiftabulatorGiveNowCalc(
    donationAmount ?? GIFTABULATOR_GIVE_NOW_PRESET.donation,
  );
}

export function encodeGiftabulatorCalcParam(
  calc: GiftabulatorGiveNowCalc,
): string {
  return btoa(JSON.stringify(calc));
}
