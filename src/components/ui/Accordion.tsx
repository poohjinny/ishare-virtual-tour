import { useEffect, useId, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  ACCORDION_CLASS,
  accordionItemClass,
  accordionTriggerClass,
  type AccordionIconPosition,
} from './accordionClasses';
import {
  AccordionProvider,
  useAccordionItemState,
  type AccordionExpandMode,
} from './accordionContext';
import { AccordionChevron } from './AccordionChevron';

export type AccordionGap = 'sm' | 'md' | 'default';
export type { AccordionExpandMode };

const PANEL_TRANSITION_MS = 240;

/** Keep panel content mounted through the close animation; skip mount when initially closed. */
function useDeferredPanelMount(open: boolean): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timeoutMs =
      (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) ?
        0
      : PANEL_TRANSITION_MS;

    const timer = window.setTimeout(() => setMounted(false), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [open]);

  return open || mounted;
}

function accordionRootClass(
  gap: AccordionGap,
  expandMode: AccordionExpandMode,
  className?: string,
): string {
  const gapClass =
    gap === 'sm' ? ACCORDION_CLASS.rootGapSm
    : gap === 'md' ? ACCORDION_CLASS.rootGapMd
    : '';
  const modeClass = expandMode === 'single' ? ACCORDION_CLASS.rootSingle : '';
  return cn(ACCORDION_CLASS.root, gapClass, modeClass, className);
}

export function Accordion({
  children,
  className,
  gap = 'default',
  expandMode = 'multiple',
}: {
  children: ReactNode;
  className?: string;
  gap?: AccordionGap;
  expandMode?: AccordionExpandMode;
}) {
  return (
    <AccordionProvider expandMode={expandMode}>
      <div className={accordionRootClass(gap, expandMode, className)}>
        {children}
      </div>
    </AccordionProvider>
  );
}

export interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  nested?: boolean;
  iconPosition?: AccordionIconPosition;
  extra?: ReactNode;
  className?: string;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  nested = false,
  iconPosition = 'left',
  extra,
  className,
}: AccordionItemProps) {
  const itemId = useId();
  const panelId = useId();
  const { open, toggle } = useAccordionItemState(itemId, defaultOpen);
  const panelMounted = useDeferredPanelMount(open);

  const icon = <AccordionChevron className={ACCORDION_CLASS.icon} />;
  const label = <span className={ACCORDION_CLASS.label}>{title}</span>;

  const itemClass = cn(
    accordionItemClass({ nested, iconPosition, animated: true }),
    open && ACCORDION_CLASS.itemOpen,
    panelMounted && ACCORDION_CLASS.itemPanelMounted,
    className,
  );

  return (
    <div className={itemClass}>
      <button
        type='button'
        className={accordionTriggerClass(iconPosition)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className={ACCORDION_CLASS.triggerMain}>
          {iconPosition === 'left' ?
            <>
              {icon}
              {label}
            </>
          : <>
              {label}
              {icon}
            </>
          }
        </span>
        {extra ?
          <span className={ACCORDION_CLASS.triggerExtra}>{extra}</span>
        : null}
      </button>
      <div
        className={ACCORDION_CLASS.panelWrap}
        aria-hidden={open ? 'false' : 'true'}
      >
        <div id={panelId} className={ACCORDION_CLASS.panel}>
          <div className={ACCORDION_CLASS.panelInner}>
            {panelMounted ? children : null}
          </div>
        </div>
      </div>
    </div>
  );
}
