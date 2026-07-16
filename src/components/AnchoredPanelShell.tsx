import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { ANCHORED_PANEL } from './anchoredPanelChrome';
import {
  tourGlassPanelShellVariants,
  tourGlassPanelBodyClassName,
} from './tourGlassPanelVariants';

interface AnchoredPanelShellProps {
  titleId: string;
  className?: string;
  shellClassName?: string;
  style?: CSSProperties;
  role?: string;
  'aria-modal'?: boolean | 'true' | 'false';
  dataAttrs?: Record<string, string | undefined>;
  hero?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Shared React shell for media panels: optional hero + main(body + footer).
 * Matches {@link buildAnchoredMediaPanelHtml}.
 */
export function AnchoredPanelShell({
  titleId,
  className,
  shellClassName,
  style,
  role = 'dialog',
  'aria-modal': ariaModal,
  dataAttrs,
  hero,
  footer,
  bodyClassName,
  children,
  onClick,
}: AnchoredPanelShellProps) {
  const dataProps: Record<string, string> = {};
  if (dataAttrs) {
    for (const [key, value] of Object.entries(dataAttrs)) {
      if (value != null) dataProps[key] = value;
    }
  }

  return (
    <article
      className={className}
      style={style}
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={titleId}
      onClick={onClick}
      {...dataProps}
    >
      <div
        className={cn(
          tourGlassPanelShellVariants({ animation: 'none' }),
          shellClassName,
        )}
      >
        {hero}
        <div className={ANCHORED_PANEL.main}>
          <div
            className={cn(
              tourGlassPanelBodyClassName,
              ANCHORED_PANEL.body,
              bodyClassName,
            )}
          >
            {children}
          </div>
          {footer}
        </div>
      </div>
    </article>
  );
}

export function AnchoredPanelHeroActions({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={ANCHORED_PANEL.heroActions}>{children}</div>;
}

export function AnchoredPanelBodyToolbar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={ANCHORED_PANEL.bodyToolbar}>
      <div className={ANCHORED_PANEL.toolbarActions}>{children}</div>
    </div>
  );
}
