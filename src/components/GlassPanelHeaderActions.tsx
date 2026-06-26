import type { PopupCta } from '../types/tour';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import { isMailtoCtaUrl } from '../utils/popupCtaPlacement';
import { ShareTourHeaderButton } from './ShareTourHeaderButton';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_16 } from './ui/materialSymbolClasses';

const HEADER_BTN_ICON_CLASS = 'tour-glass-panel__header-btn-icon';

export function PopupCtaHeaderLink({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);

  return (
    <a
      className='tour-glass-panel__header-btn'
      href={resolved.url}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={resolved.ariaLabel}
    >
      <MaterialSymbol
        name={isMailtoCtaUrl(resolved.url) ? 'mail' : 'open_in_new'}
        className={HEADER_BTN_ICON_CLASS}
        sizePx={MATERIAL_SYMBOL_SIZE_16}
      />
    </a>
  );
}

interface GlassPanelHeaderActionsProps {
  headerCtas?: PopupCta[];
  share?: {
    shareUrl: string;
    message: Parameters<typeof ShareTourHeaderButton>[0]['message'];
    ariaLabel: string;
  };
}

export function GlassPanelHeaderActions({
  headerCtas = [],
  share,
}: GlassPanelHeaderActionsProps) {
  if (headerCtas.length === 0 && !share) return null;

  return (
    <div className='tour-glass-panel__header-actions'>
      {share && (
        <ShareTourHeaderButton
          shareUrl={share.shareUrl}
          message={share.message}
          ariaLabel={share.ariaLabel}
        />
      )}
      {headerCtas.map((cta, index) => (
        <PopupCtaHeaderLink key={`${cta.url}-${index}`} cta={cta} />
      ))}
    </div>
  );
}
