import {
  buildGiftabulatorGiveNowCalcFromNaming,
  encodeGiftabulatorCalcParam,
} from '../constants/giftabulatorGiveNow';
import type { NamingOpportunity, Tour } from '../types/tour';
import { getTourClientId } from './tourClientId';

/** Query string for `https://{clientId}.giftabulatornow.com/give-now`. @see docs/GIFTABULATOR_GIVE_NOW.md */
export function buildGiftabulatorGiveNowSearchParams(
  naming?: NamingOpportunity,
): URLSearchParams {
  const calc = buildGiftabulatorGiveNowCalcFromNaming(naming);

  return new URLSearchParams({
    locale: 'en-CA',
    view: 'result',
    zoom: '100',
    calc: encodeGiftabulatorCalcParam(calc),
  });
}

export function buildGiftabulatorGiveNowUrl(
  tour: Pick<Tour, 'id' | 'clientId'>,
  naming?: NamingOpportunity,
): string {
  const clientId = getTourClientId(tour);
  const query = buildGiftabulatorGiveNowSearchParams(naming).toString();

  return `https://${clientId}.giftabulatornow.com/give-now?${query}`;
}
