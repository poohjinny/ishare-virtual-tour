import type { NamingStatusModifier } from './ui/Badge';
import { BADGE_CLASS } from './ui/badgeClasses';
import { materialSymbolHtml } from './glassPanelCtaIcons';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  materialSymbolBadgeClassName,
  MATERIAL_SYMBOL_SIZE_18,
} from './ui/materialSymbolClasses';
import { cn } from '../lib/cn';
const NAMING_STATUS_MATERIAL_ICONS: Record<NamingStatusModifier, string> = {
  'on-sale': 'sell',
  reserved: 'lock',
  'coming-soon': 'schedule',
  sold: 'check_circle',
};

export function NamingStatusBadgeIcon({
  modifier,
}: {
  modifier: NamingStatusModifier;
}) {
  return (
    <MaterialSymbol
      name={NAMING_STATUS_MATERIAL_ICONS[modifier]}
      className={cn(BADGE_CLASS.icon, materialSymbolBadgeClassName)}
      sizePx={MATERIAL_SYMBOL_SIZE_18}
    />
  );
}

/** HTML popups (anchored glass panel). */
export function namingStatusBadgeIconHtml(
  modifier: NamingStatusModifier,
  iconClass: string,
): string {
  return materialSymbolHtml(NAMING_STATUS_MATERIAL_ICONS[modifier], {
    className: `${BADGE_CLASS.icon} ${iconClass}`.trim(),
    sizePx: MATERIAL_SYMBOL_SIZE_18,
  });
}

export function isNamingStatusIconModifier(
  modifier: string,
): modifier is NamingStatusModifier {
  return (
    modifier === 'on-sale' ||
    modifier === 'sold' ||
    modifier === 'reserved' ||
    modifier === 'coming-soon'
  );
}
