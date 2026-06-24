import { useMemo } from 'react';
import { cn } from '../lib/cn';
import { useLazyInView } from '../hooks/useLazyInView';
import { usePreviewHeroReveal } from '../hooks/usePreviewHeroReveal';
import { useScenePreview } from '../hooks/useScenePreview';
import type { Scene } from '../types/tour';
import type { NamingStatusModifier } from './ui/Badge';
import { Badge } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import {
  tourNavLocationGalleryCardClassName,
  tourNavLocationGalleryCardHeroClassName,
  tourNavLocationGalleryCardHeroImageClassName,
  tourNavLocationGalleryCardHeroSkeletonClassName,
  tourNavLocationGalleryCtaClassName,
  tourNavLocationGalleryCurrentBadgeClassName,
  tourNavLocationGalleryHeroBadgeGroupClassName,
  tourNavLocationGalleryHeroBottomOverlayClassName,
  tourNavLocationGalleryHeroCtaOverlayClassName,
  tourNavLocationGalleryHeroNamingLabelClassName,
  tourNavLocationGalleryHeroNamingLocationClassName,
  tourNavLocationGalleryHeroNamingNameClassName,
  tourNavLocationGalleryHeroNamingSeparatorClassName,
  tourNavLocationGalleryStatusBadgeVariants,
} from './tourNavFloatVariants';
import {
  resolveNamingDirectoryPreviewView,
  type TourDirectoryNamingItem,
} from '../utils/tourDirectory';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';

interface ExploreNamingGalleryCardProps {
  tourId: string;
  scenes: Scene[];
  item: TourDirectoryNamingItem;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function ExploreNamingGalleryCard({
  tourId,
  scenes,
  item,
  active,
  disabled = false,
  onSelect,
}: ExploreNamingGalleryCardProps) {
  const { ref, inView } = useLazyInView<HTMLLIElement>();
  const scene = useMemo(
    () => scenes.find((entry) => entry.id === item.sceneId),
    [item.sceneId, scenes],
  );
  const previewView = useMemo(
    () =>
      resolveNamingDirectoryPreviewView(scenes, item.sceneId, item.hotspotId),
    [item.hotspotId, item.sceneId, scenes],
  );
  const {
    src: previewSrc,
    failed: previewFailed,
    loading: previewLoading,
  } = useScenePreview(
    tourId,
    scene ?? {
      id: item.sceneId,
      panorama: '',
      defaultView: { yaw: 0, pitch: 0, zoom: 50 },
    },
    inView && Boolean(scene?.panorama),
    { view: previewView, cacheKeySuffix: `no:${item.hotspotId}` },
  );
  const {
    imgRef,
    revealed: previewLoaded,
    onLoad: onPreviewLoad,
  } = usePreviewHeroReveal(previewSrc);

  return (
    <li
      ref={ref}
      className='m-0 flex min-h-0 list-none p-0'
      role='presentation'
    >
      <button
        type='button'
        role='option'
        aria-selected={active}
        disabled={disabled}
        className={tourNavLocationGalleryCardClassName({ active })}
        onClick={onSelect}
        aria-label={
          active ?
            `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}.`
          : `${item.name}, ${item.sceneTitle}. ${item.statusLabel}.`
        }
      >
        <span
          className={cn(
            tourNavLocationGalleryCardHeroClassName,
            previewFailed && 'bg-[#e2e8f0]',
          )}
          aria-busy={previewLoading || undefined}
        >
          {previewLoading ?
            <span
              className={tourNavLocationGalleryCardHeroSkeletonClassName}
              aria-hidden='true'
            />
          : null}
          {previewSrc && !previewFailed ?
            <img
              ref={imgRef}
              className={cn(
                tourNavLocationGalleryCardHeroImageClassName({ active }),
                previewLoaded && 'opacity-100',
              )}
              src={previewSrc}
              alt=''
              aria-hidden='true'
              draggable={false}
              onLoad={onPreviewLoad}
            />
          : null}
          {previewFailed ?
            <span
              className='absolute inset-0 z-[1] block bg-[#e2e8f0]'
              aria-hidden='true'
            />
          : null}
          <span className={tourNavLocationGalleryHeroBadgeGroupClassName}>
            {active ?
              <Badge
                variant='fill'
                size='sm'
                tone='primary'
                uppercase
                className={tourNavLocationGalleryCurrentBadgeClassName}
              >
                Current
              </Badge>
            : null}
            <NamingStatusBadge
              statusModifier={item.statusModifier as NamingStatusModifier}
              label={item.statusShortLabel}
              ariaLabel={item.statusLabel}
              className={tourNavLocationGalleryStatusBadgeVariants({
                status: item.statusModifier as NamingStatusModifier,
              })}
            />
          </span>
          {!active ?
            <span className={tourNavLocationGalleryHeroCtaOverlayClassName}>
              <span className={tourNavLocationGalleryCtaClassName}>
                <ExploreGalleryCtaArrowIcon />
              </span>
            </span>
          : null}
          <span className={tourNavLocationGalleryHeroBottomOverlayClassName}>
            <span className={tourNavLocationGalleryHeroNamingLabelClassName}>
              <span className={tourNavLocationGalleryHeroNamingNameClassName}>
                {item.name}
              </span>
              <span
                className={tourNavLocationGalleryHeroNamingSeparatorClassName}
                aria-hidden='true'
              >
                |
              </span>
              <span
                className={tourNavLocationGalleryHeroNamingLocationClassName}
              >
                {item.sceneTitle}
              </span>
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
