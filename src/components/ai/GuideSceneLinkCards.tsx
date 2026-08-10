import { useState } from 'react';
import type { ChatGuideLink } from '../../types/tour';
import { TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD } from '../../constants/tourDirectory';
import { namingOpportunityStatusShowsBadge } from '../../data/namingOpportunityStatus';
import { GUIDE_LINK_PREVIEW_COUNT } from '../../utils/guideSceneLinks';
import { cn } from '../../lib/cn';
import { ExploreCurrentHereLabel } from '../ExploreCurrentHereLabel';
import { NamingStatusBadge } from '../ui/NamingStatusBadge';
import { MATERIAL_SYMBOL_SIZE_12 } from '../ui/materialSymbolClasses';
import { tourNavLocationGalleryStatusBadgeVariants } from '../tourNavFloatVariants';
import { GuideCtaRow } from './GuideCtaRow';
import {
  aiGuideCardWidthClassName,
  aiSceneLinkCardBadgeGroupClassName,
  aiSceneLinkCardBodyClassName,
  aiSceneLinkCardDescClassName,
  aiSceneLinkCardDescPlaceholderClassName,
  aiSceneLinkCardDescTallClassName,
  AI_GUIDE_CARD_NAMING_DESC_PLACEHOLDER,
  aiSceneLinkCardHereChipClassName,
  aiSceneLinkCardKindClassName,
  aiSceneLinkCardMediaClassName,
  aiSceneLinkCardMediaZoomableClassName,
  aiSceneLinkCardMediaWrapClassName,
  aiSceneLinkCardPriceClassName,
  aiSceneLinkCardStatusBadgeClassName,
  aiSceneLinkCardTitleClassName,
  aiSceneLinkCardTitleRowClassName,
  aiSceneLinkCardTitleTallClassName,
  aiSceneLinkCardVariants,
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
    return `You are here: ${link.title}`;
  }
  return `Go to ${link.title}`;
}

function GuideLinkCard({
  link,
  layout,
  showKindEyebrow,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  disabled,
}: {
  link: ChatGuideLink;
  layout: 'single' | 'multi';
  /** Place + naming in the same reply — disambiguate with an eyebrow. */
  showKindEyebrow: boolean;
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  disabled: boolean;
}) {
  const isNaming = link.kind === 'naming';
  const isCurrent =
    !isNaming && Boolean(currentSceneId) && link.sceneId === currentSceneId;
  const canOpenNaming = isNaming && Boolean(link.hotspotId) && onSelectNaming;
  const canOpenScene = !isCurrent && Boolean(onSelectScene);
  const canActivate = canOpenNaming || canOpenScene;
  const showStatus =
    isNaming && link.status && namingOpportunityStatusShowsBadge(link.status);
  const price = isNaming ? link.priceLabel?.trim() : undefined;
  const description = link.description?.trim() || '';
  const descriptionPlaceholder =
    isNaming ?
      AI_GUIDE_CARD_NAMING_DESC_PLACEHOLDER
    : TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD;
  const reserveTextHeight = layout === 'multi';

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
          if (!canActivate) return;
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
              className={cn(
                aiSceneLinkCardMediaClassName,
                canActivate && aiSceneLinkCardMediaZoomableClassName,
              )}
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
              className={aiSceneLinkCardHereChipClassName}
              sizePx={MATERIAL_SYMBOL_SIZE_12}
            />
          : null}
          {showStatus && link.status ?
            <span className={aiSceneLinkCardBadgeGroupClassName}>
              <NamingStatusBadge
                status={link.status}
                compact
                ariaLabel={link.statusLabel}
                className={cn(
                  tourNavLocationGalleryStatusBadgeVariants({
                    status: link.status,
                  }),
                  aiSceneLinkCardStatusBadgeClassName,
                )}
              />
            </span>
          : null}
        </span>
        <div className={aiSceneLinkCardBodyClassName}>
          {showKindEyebrow ?
            <span className={aiSceneLinkCardKindClassName}>
              {isNaming ? 'Naming opportunity' : 'Place'}
            </span>
          : null}
          {isNaming ?
            <div className={aiSceneLinkCardTitleRowClassName}>
              <span
                className={cn(
                  aiSceneLinkCardTitleClassName,
                  reserveTextHeight && aiSceneLinkCardTitleTallClassName,
                )}
                title={link.title}
              >
                {link.title}
              </span>
              {price ?
                <span className={aiSceneLinkCardPriceClassName}>{price}</span>
              : null}
            </div>
          : <span
              className={cn(
                aiSceneLinkCardTitleClassName,
                reserveTextHeight && aiSceneLinkCardTitleTallClassName,
              )}
              title={link.title}
            >
              {link.title}
            </span>
          }
          <p
            className={cn(
              aiSceneLinkCardDescClassName,
              reserveTextHeight && aiSceneLinkCardDescTallClassName,
              !description && aiSceneLinkCardDescPlaceholderClassName,
            )}
          >
            {description || descriptionPlaceholder}
          </p>
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
  showKindEyebrow,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  disabled,
}: {
  links: ChatGuideLink[];
  showKindEyebrow: boolean;
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  disabled: boolean;
}) {
  if (links.length === 0) return null;
  // Per-row: 2+ in this row → half grid; a lonely single stays full.
  const layout = links.length > 1 ? 'multi' : 'single';
  return (
    <div className={aiSceneLinkListVariants({ layout })}>
      {links.map((link) => (
        <GuideLinkCard
          key={linkKey(link)}
          link={link}
          layout={layout}
          showKindEyebrow={showKindEyebrow}
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
  const showKindEyebrow = places.length > 0 && namings.length > 0;

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

  return (
    <div
      className={cn(
        'mt-3 flex max-w-full flex-col items-stretch gap-2',
        className,
      )}
    >
      <div className='flex max-w-full flex-col items-stretch gap-2.5'>
        <GuideLinkRow
          links={visiblePlaces}
          showKindEyebrow={showKindEyebrow}
          currentSceneId={currentSceneId}
          onSelectScene={onSelectScene}
          onSelectNaming={onSelectNaming}
          disabled={disabled}
        />
        <GuideLinkRow
          links={visibleNamings}
          showKindEyebrow={showKindEyebrow}
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
