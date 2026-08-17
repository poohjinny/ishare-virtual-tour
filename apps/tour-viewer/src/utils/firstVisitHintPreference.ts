import { TOUR_FIRST_VISIT_HINT_STORAGE_KEY } from '../constants/tourFirstVisitHint';

export function readFirstVisitHintSeen(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(TOUR_FIRST_VISIT_HINT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeFirstVisitHintSeen(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOUR_FIRST_VISIT_HINT_STORAGE_KEY, '1');
  } catch {
    /* private browsing / blocked storage */
  }
}

export function clearFirstVisitHintSeen(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOUR_FIRST_VISIT_HINT_STORAGE_KEY);
  } catch {
    /* private browsing / blocked storage */
  }
}
