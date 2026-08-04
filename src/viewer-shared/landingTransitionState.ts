/** Per-tour guard — landing zoom runs once per tour session, not on scene changes. */
let landingPlayedTourId: string | null = null;

export function hasLandingTransitionPlayed(tourId: string): boolean {
  return landingPlayedTourId === tourId;
}

export function markLandingTransitionPlayed(tourId: string): void {
  landingPlayedTourId = tourId;
}

export function resetLandingTransitionState(): void {
  landingPlayedTourId = null;
}
