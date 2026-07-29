import { useState } from 'react';
import type { ChatGuideLink } from '../../types/tour';
import { namingOpportunityStatusShowsBadge } from '../../data/namingOpportunityStatus';
import { GUIDE_LINK_PREVIEW_COUNT } from '../../utils/guideSceneLinks';
import { cn } from '../../lib/cn';
import { ExploreCurrentHereLabel } from '../ExploreCurrentHereLabel';
import { NamingStatusBadge } from '../ui/NamingStatusBadge';
import {
  tourNavCurrentHeroChipClassName,
  tourNavLocationGalleryHeroBadgeGroupClassName,
  tourNavLocationGalleryStatusBadgeVariants,
} from '../tourNavFloatVariants';
import { GuideCtaRow } from './GuideCtaRow';
import {
  aiGuideCardWidthClassName,
  aiSceneLinkCardBodyClassName,
  aiSceneLinkCardDescClassName,
  aiSceneLinkCardKindClassName,
  aiSceneLinkCardKindNamingClassName,
  aiSceneLinkCardMediaClassName,
  aiSceneLinkCardMediaWrapClassName,
  aiSceneLinkCardPriceClassName,
  aiSceneLinkCardTitleClassName,
  aiSceneLinkCardTitleRowClassName,
  aiSceneLinkCardVariants,
  aiSceneLinkLeadClassName,
  aiSceneLinkListVariants,
  aiSceneLinkShowMoreClassName,
} from './aiAssistantVariants';

interface GuideSceneLinkCardsProps {
  links: ChatGuideLink[];
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  disabled?: boolean;
  className?: string;
}

function linkKey(link: ChatGuideLink): string {
  return link.kind === 'naming' ?
      `naming:${link.namingId ?? link.hotspotId}`
    : `scene:${link.sceneId}`;
}

function cardLabel(link: ChatGuideLink, currentSceneId?: string): string {
  if (link.kind === 'naming') {
    return `View naming opportunity: ${link.title}`;
  }
  if (currentSceneId && link.sceneId === currentSceneId) {
    return `Recenter on ${link.title}`;
  }
  return `Go to ${link.title}`;
}

/** Friendly lead-in above cards — why these are shown. */
function cardsLeadIn(links: ChatGuideLink[], currentSceneId?: string): string {
  const places = links.filter((link) => link.kind === 'scene');
  const namings = links.filter((link) => link.kind === 'naming');
  const placeCount = places.length;
  const namingCount = namings.length;
  const onlyCurrentPlace =
    placeCount === 1 &&
    namingCount === 0 &&
    Boolean(currentSceneId) &&
    places[0]?.sceneId === currentSceneId;

  if (placeCount > 0 && namingCount > 0) {
    return 'Based on what we just talked about, here are a few related places and naming opportunities you can open:';
  }
  if (namingCount > 0 && placeCount === 0) {
    return namingCount === 1 ?
        "Based on your question, here's a naming opportunity you can open:"
      : 'Based on your question, here are naming opportunities you can open:';
  }
  if (onlyCurrentPlace) {
    return "Here's where you are right now — you can open the card to look around again:";
  }
  if (placeCount === 1) {
    return "Here's a place you can open to continue exploring:";
  }
  return 'Based on what we just talked about, here are a few places you can visit:';
}

function GuideLinkCard({
  link,
  layout,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  disabled,
}: {
  link: ChatGuideLink;
  layout: 'single' | 'multi';
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  disabled: boolean;
}) {
  const isNaming = link.kind === 'naming';
  const isCurrent =
    !isNaming && Boolean(currentSceneId) && link.sceneId === currentSceneId;
  const canOpenNaming = isNaming && Boolean(link.hotspotId) && onSelectNaming;
  const canOpenScene = Boolean(onSelectScene);
  const canActivate = canOpenNaming || canOpenScene;
  const showStatus =
    isNaming && link.status && namingOpportunityStatusShowsBadge(link.status);
  const price = isNaming ? link.priceLabel?.trim() : undefined;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5',
        layout === 'single' && aiGuideCardWidthClassName,
        layout === 'multi' && 'w-full',
      )}
    >
      <button
        type='button'
        className={aiSceneLinkCardVariants({
          // Column wrapper owns width — card fills it so CTAs match.
          layout: 'multi',
          kind: isNaming ? 'naming' : 'scene',
          current: isCurrent,
        })}
        disabled={disabled || !canActivate}
        aria-label={cardLabel(link, currentSceneId)}
        onClick={() => {
          if (canOpenNaming && link.hotspotId) {
            onSelectNaming?.(link.sceneId, link.hotspotId);
            return;
          }
          onSelectScene?.(link.sceneId);
        }}
      >
        <span className={aiSceneLinkCardMediaWrapClassName}>
          {link.thumbnail ?
            <img
              src={link.thumbnail}
              alt=''
              className={aiSceneLinkCardMediaClassName}
              loading='lazy'
              decoding='async'
            />
          : <span
              className={aiSceneLinkCardMediaClassName}
              aria-hidden='true'
            />
          }
          {isCurrent ?
            <ExploreCurrentHereLabel
              className={tourNavCurrentHeroChipClassName}
            />
          : null}
          {showStatus && link.status ?
            <span className={tourNavLocationGalleryHeroBadgeGroupClassName}>
              <NamingStatusBadge
                status={link.status}
                compact
                ariaLabel={link.statusLabel}
                className={tourNavLocationGalleryStatusBadgeVariants({
                  status: link.status,
                })}
              />
            </span>
          : null}
        </span>
        <div className={aiSceneLinkCardBodyClassName}>
          <span
            className={
              isNaming ?
                aiSceneLinkCardKindNamingClassName
              : aiSceneLinkCardKindClassName
            }
          >
            {isNaming ? 'Naming opportunity' : 'Place'}
          </span>
          {isNaming ?
            <div className={aiSceneLinkCardTitleRowClassName}>
              <span className={aiSceneLinkCardTitleClassName}>
                {link.title}
              </span>
              {price ?
                <span className={aiSceneLinkCardPriceClassName}>{price}</span>
              : null}
            </div>
          : <span className={aiSceneLinkCardTitleClassName}>{link.title}</span>}
          {link.description ?
            <p className={aiSceneLinkCardDescClassName}>{link.description}</p>
          : null}
        </div>
      </button>
      {isNaming && link.ctas && link.ctas.length > 0 ?
        <GuideCtaRow
          ctas={link.ctas}
          align='stretch'
          stack
          showContactInfo={false}
          className='mt-0 min-w-0 w-full'
        />
      : null}
    </div>
  );
}

function GuideLinkRow({
  links,
  compact,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  disabled,
}: {
  links: ChatGuideLink[];
  /** Match half-column width even for a single card (mixed place/NO rows). */
  compact: boolean;
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  disabled: boolean;
}) {
  if (links.length === 0) return null;
  const layout = links.length > 1 || compact ? 'multi' : 'single';
  return (
    <div className={aiSceneLinkListVariants({ layout })}>
      {links.map((link) => (
        <GuideLinkCard
          key={linkKey(link)}
          link={link}
          layout={layout}
          currentSceneId={currentSceneId}
          onSelectScene={onSelectScene}
          onSelectNaming={onSelectNaming}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export function GuideSceneLinkCards({
  links,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  disabled = false,
  className,
}: GuideSceneLinkCardsProps) {
  const [expanded, setExpanded] = useState(false);

  if (links.length === 0) return null;

  const places = links.filter((link) => link.kind === 'scene');
  const namings = links.filter((link) => link.kind === 'naming');
  const total = places.length + namings.length;
  const needsCollapse = total > GUIDE_LINK_PREVIEW_COUNT;
  // 2 places + 1 NO → keep the lonely NO at grid-column width, not full single.
  const compactRows = total > 1;

  let visiblePlaces = places;
  let visibleNamings = namings;
  if (needsCollapse && !expanded) {
    if (places.length >= GUIDE_LINK_PREVIEW_COUNT) {
      visiblePlaces = places.slice(0, GUIDE_LINK_PREVIEW_COUNT);
      visibleNamings = [];
    } else {
      visiblePlaces = places;
      visibleNamings = namings.slice(
        0,
        GUIDE_LINK_PREVIEW_COUNT - places.length,
      );
    }
  }

  const hiddenCount = total - visiblePlaces.length - visibleNamings.length;
  const lead = cardsLeadIn(links, currentSceneId);

  return (
    <div
      className={cn('flex max-w-full flex-col items-stretch gap-2', className)}
    >
      <p className={aiSceneLinkLeadClassName}>{lead}</p>
      <div className='flex max-w-full flex-col items-stretch gap-2.5'>
        <GuideLinkRow
          links={visiblePlaces}
          compact={compactRows}
          currentSceneId={currentSceneId}
          onSelectScene={onSelectScene}
          onSelectNaming={onSelectNaming}
          disabled={disabled}
        />
        <GuideLinkRow
          links={visibleNamings}
          compact={compactRows}
          currentSceneId={currentSceneId}
          onSelectScene={onSelectScene}
          onSelectNaming={onSelectNaming}
          disabled={disabled}
        />
      </div>
      {needsCollapse ?
        <button
          type='button'
          className={aiSceneLinkShowMoreClassName}
          disabled={disabled}
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Show less' : `Show more (${hiddenCount})`}
        </button>
      : null}
    </div>
  );
}
