export const LEGACY_TOUR_PATH_ALIASES: Readonly<Record<string, string>>;

export function canonicalizeTourPathId(segment: string): string;

export function isLegacyTourPathAlias(segment: string): boolean;
