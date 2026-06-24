import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { BADGE_CLASS } from './ui/badgeClasses';
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

export function GlassPanelCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn(tourGlassPanelCloseIconClassName, className)}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5 5L15 15M15 5L5 15'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
    </svg>
  );
}

export function GlassPanelInfoBadge() {
  return (
    <span className={BADGE_CLASS.fillLgAccentIcon}>
      <svg
        className={BADGE_CLASS.icon}
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
      >
        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 11v5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle cx='12' cy='8' r='1.25' fill='currentColor' />
      </svg>
      <span className={BADGE_CLASS.label}>Info</span>
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
