/** Shared class strings for global badge variants (React + HTML popups). */

const B = 'ishare-badge';

export const BADGE_CLASS = {
  base: B,
  outline: `${B} ${B}--outline`,
  fillSm: `${B} ${B}--fill ${B}--fill-sm`,
  fillLg: `${B} ${B}--fill ${B}--fill-lg`,
  fillLgIcon: `${B} ${B}--fill ${B}--fill-lg ${B}--has-icon`,
  fillLgAccent: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-accent`,
  fillLgAccentIcon: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-accent ${B}--has-icon`,
  fillLgPrimaryIcon: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-primary ${B}--has-icon`,
  fillLgPrimary: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-primary ${B}--price`,
  fillLgPrimaryClosed: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-primary ${B}--price ${B}--price-closed`,
  fillLgSponsor: `${B} ${B}--fill ${B}--fill-lg ${B}--tone-accent ${B}--sponsor`,
  fillLgStatus: (modifier: string) =>
    `${B} ${B}--fill ${B}--fill-lg ${B}--status-${modifier}`,
  fillLgStatusIcon: (modifier: string) =>
    `${B} ${B}--fill ${B}--fill-lg ${B}--has-icon ${B}--status-${modifier}`,
  icon: `${B}__icon`,
  label: `${B}__label`,
  dot: `${B}__dot`,
} as const;
