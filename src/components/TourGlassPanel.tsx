import type { ReactNode } from 'react';
import { GENERAL_INFO_BADGE_LABEL } from '../data/generalInfoHotspot';
import { cn } from '../lib/cn';
import { BADGE_CLASS } from './ui/badgeClasses';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolBadgeClassName,
} from './ui/materialSymbolClasses';
import {
  tourGlassPanelBodyClassNameWith,
  tourGlassPanelCloseClassName,
  tourGlassPanelCloseIconClassName,
  tourGlassPanelHeaderClassName,
  tourGlassPanelHeaderLeadingClassName,
  tourGlassPanelRootClassName,
  tourGlassPanelShellClassName,
  tourGlassPanelTitleActionsClassName,
  tourGlassPanelTitleClassName,
  tourGlassPanelTitleRowClassName,
} from './tourGlassPanelVariants';

export type TourGlassPanelVariant = 'anchored' | 'dock';
export type TourGlassPanelAnimation = 'enter' | 'exit' | 'none';

export function GlassPanelCloseIcon({
  className,
  sizePx = MATERIAL_SYMBOL_SIZE_22,
}: {
  className?: string;
  sizePx?: number;
}) {
  return (
    <MaterialSymbol
      name='close'
      className={cn(tourGlassPanelCloseIconClassName, className)}
      sizePx={sizePx}
    />
  );
}

export function GlassPanelInfoBadge() {
  return (
    <span className={BADGE_CLASS.fillLgAccentIcon}>
      <MaterialSymbol
        name='info'
        className={cn(BADGE_CLASS.icon, materialSymbolBadgeClassName)}
        sizePx={MATERIAL_SYMBOL_SIZE_18}
      />
      <span className={BADGE_CLASS.label}>{GENERAL_INFO_BADGE_LABEL}</span>
    </span>
  );
}

interface TourGlassPanelProps {
  title?: string;
  titleId: string;
  onClose?: () => void;
  badge?: ReactNode;
  headerActions?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: TourGlassPanelVariant;
  animation?: TourGlassPanelAnimation;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  role?: 'dialog';
}

export function TourGlassPanel({
  title,
  titleId,
  onClose,
  badge,
  headerActions,
  header,
  footer,
  variant = 'dock',
  animation = 'none',
  className = '',
  bodyClassName = '',
  children,
  role = 'dialog',
}: TourGlassPanelProps) {
  return (
    <article
      className={tourGlassPanelRootClassName(variant, className)}
      role={role}
      aria-labelledby={titleId}
    >
      <div className={tourGlassPanelShellClassName(animation)}>
        <header className={tourGlassPanelHeaderClassName}>
          {header ?? (
            <>
              <div className={tourGlassPanelTitleRowClassName}>
                <div className={tourGlassPanelHeaderLeadingClassName}>
                  {title ?
                    <h2 id={titleId} className={tourGlassPanelTitleClassName}>
                      {title}
                    </h2>
                  : null}
                  {badge}
                </div>
                {(headerActions || onClose) && (
                  <div className={tourGlassPanelTitleActionsClassName}>
                    {headerActions}
                    {onClose && (
                      <button
                        type='button'
                        className={tourGlassPanelCloseClassName}
                        onClick={onClose}
                        aria-label='Close'
                      >
                        <GlassPanelCloseIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </header>
        <div className={tourGlassPanelBodyClassNameWith(bodyClassName)}>
          {children}
        </div>
        {footer}
      </div>
    </article>
  );
}
