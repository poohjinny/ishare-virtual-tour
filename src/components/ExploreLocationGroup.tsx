import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TOUR_DIRECTORY_GROUP_EXPAND_MS } from '../constants/tourDirectory';
import { cn } from '../lib/cn';
import { ExploreGroupMediaReadyProvider } from './ExploreGroupMediaReady';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_20 } from './ui/materialSymbolClasses';
import {
  tourNavLocationGroupChevronClassName,
  tourNavLocationGroupChevronOpenClassName,
  tourNavLocationGroupClassName,
  tourNavLocationGroupExpandedClassName,
  tourNavLocationGroupHeaderClassName,
  tourNavLocationGroupMetaClassName,
  tourNavLocationGroupPanelClassName,
  tourNavLocationGroupPanelContentClassName,
  tourNavLocationGroupPanelInnerClassName,
  tourNavLocationGroupTitleClassName,
} from './tourNavFloatVariants';

interface ExploreLocationGroupProps {
  title: string;
  metaLabel?: string;
  expanded: boolean;
  regionId: string;
  headingId: string;
  disabled?: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Collapsible department group header + region for the grouped locations list. */
export function ExploreLocationGroup({
  title,
  metaLabel,
  expanded,
  regionId,
  headingId,
  disabled = false,
  onToggle,
  children,
}: ExploreLocationGroupProps) {
  // Mount children on first expand and keep them — collapsed groups used to keep
  // every list/gallery row in the DOM, and grid 0fr→1fr then laid all of that out
  // every frame during the open animation.
  const [contentMounted, setContentMounted] = useState(expanded);
  // Defer thumbnail/preview network work until the expand transition settles.
  const [mediaReady, setMediaReady] = useState(expanded);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasExpandedRef = useRef(expanded);

  useEffect(() => {
    if (expanded) setContentMounted(true);

    const wasExpanded = wasExpandedRef.current;
    wasExpandedRef.current = expanded;

    if (!expanded) {
      // Leave mediaReady alone while collapsing so cached thumbs stay visible.
      return;
    }

    if (wasExpanded) {
      // Mount already open (or stayed open) — allow media immediately.
      setMediaReady(true);
      return;
    }

    // Collapsed → expanded: wait out the 0fr→1fr transition before loads.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setMediaReady(true);
      return;
    }

    setMediaReady(false);

    const panel = panelRef.current;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== panel) return;
      if (event.propertyName !== 'grid-template-rows') return;
      setMediaReady(true);
    };

    panel?.addEventListener('transitionend', onTransitionEnd);
    const fallbackId = window.setTimeout(
      () => setMediaReady(true),
      TOUR_DIRECTORY_GROUP_EXPAND_MS + 50,
    );

    return () => {
      panel?.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(fallbackId);
    };
  }, [expanded]);

  return (
    <section
      className={cn(
        tourNavLocationGroupClassName,
        expanded && tourNavLocationGroupExpandedClassName,
      )}
    >
      <button
        type='button'
        id={headingId}
        className={tourNavLocationGroupHeaderClassName}
        aria-expanded={expanded}
        aria-controls={regionId}
        disabled={disabled}
        onClick={onToggle}
      >
        <MaterialSymbol
          name='chevron_right'
          sizePx={MATERIAL_SYMBOL_SIZE_20}
          className={cn(
            tourNavLocationGroupChevronClassName,
            expanded && tourNavLocationGroupChevronOpenClassName,
          )}
        />
        <span className={tourNavLocationGroupTitleClassName}>{title}</span>
        {metaLabel ?
          <span className={tourNavLocationGroupMetaClassName}>{metaLabel}</span>
        : null}
      </button>
      <div ref={panelRef} className={tourNavLocationGroupPanelClassName}>
        <div className={tourNavLocationGroupPanelInnerClassName}>
          <div
            id={regionId}
            role='region'
            aria-labelledby={headingId}
            aria-hidden={!expanded}
            className={tourNavLocationGroupPanelContentClassName}
          >
            {contentMounted ?
              <ExploreGroupMediaReadyProvider ready={mediaReady}>
                {children}
              </ExploreGroupMediaReadyProvider>
            : null}
          </div>
        </div>
      </div>
    </section>
  );
}
