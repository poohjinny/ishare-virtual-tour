import {
  Box,
  HandHeart,
  ImageOff,
  MapPin,
  View,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { AssetImage } from '@/components/asset-image';
import { BrandedAvatar } from '@/components/branded-avatar';
import { CategoryBadge, VisibilityBadge } from '@/components/status-badges';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AdminTourOverview } from '@/lib/tour-overview';

function CoverFallback({ label }: { label: string }) {
  return (
    <div className='flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground'>
      <ImageOff aria-hidden='true' className='size-5' />
      <span className='px-4 text-center text-xs'>{label}</span>
    </div>
  );
}

function CatalogViewerMeta({
  viewerType,
}: {
  viewerType: AdminTourOverview['viewerType'];
}) {
  const is3d = viewerType === 'model3d';
  const Icon = is3d ? Box : View;
  const label = is3d ? '3D' : '360°';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex items-center gap-1.5 type-meta text-muted-foreground'>
          <Icon aria-hidden='true' className='icon-inline' />
          <span>{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {is3d ? '3D model tour' : '360° panorama tour'}
      </TooltipContent>
    </Tooltip>
  );
}

function CatalogCountLink({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className='inline-flex cursor-pointer items-center gap-1.5 type-meta text-muted-foreground transition-colors hover:text-primary'
        >
          <Icon aria-hidden='true' className='icon-inline' />
          <span>{label}</span>
          <span className='tabular-nums text-foreground'>{count}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>Open {label.toLowerCase()}</TooltipContent>
    </Tooltip>
  );
}

function TourCard({ tour }: { tour: AdminTourOverview }) {
  return (
    <article className='group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40'>
      <Link
        href={`/tours/${tour.id}`}
        className='relative block aspect-video cursor-pointer overflow-hidden bg-muted'
      >
        <AssetImage
          src={tour.coverUrl}
          alt=''
          className='size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none'
          fallback={<CoverFallback label='No baked scene thumbnail' />}
        />
        <span
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 z-1 bg-transparent transition-colors duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:bg-black/70 motion-reduce:transition-none [@media(hover:hover)]:group-hover:bg-black/70'
        />
        <div className='absolute inset-x-0 top-0 z-2 flex items-start justify-between gap-1.5 p-2'>
          <BrandedAvatar
            src={tour.logoUrl}
            label={tour.clientName}
            brandColor={tour.brandColor}
            size='sm'
            className='h-7 w-10 bg-background/90 backdrop-blur'
          />
          <div className='flex max-w-[70%] flex-wrap items-start justify-end gap-1'>
            <VisibilityBadge visibility={tour.visibility} hero size='sm' />
            <CategoryBadge category={tour.category} hero size='sm' />
          </div>
        </div>
        <div className='absolute inset-x-0 bottom-0 z-2 bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 pt-8'>
          <p className='truncate text-sm font-semibold text-white'>
            {tour.title}
          </p>
          <p className='truncate text-xs text-white/80'>{tour.clientName}</p>
        </div>
      </Link>

      <div className='flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-3 py-2.5'>
        <CatalogViewerMeta viewerType={tour.viewerType} />
        <CatalogCountLink
          href={`/tours/${tour.id}/scenes`}
          icon={MapPin}
          label='Scenes'
          count={tour.sceneCount}
        />
        <CatalogCountLink
          href={`/tours/${tour.id}/namings`}
          icon={HandHeart}
          label='Namings'
          count={tour.namingCount}
        />
      </div>
    </article>
  );
}

export function TourGallery({ tours }: { tours: AdminTourOverview[] }) {
  if (tours.length === 0) {
    return (
      <p className='rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground'>
        No tours in the catalog yet.
      </p>
    );
  }

  return (
    <div className='@container'>
      <div className='grid grid-cols-1 gap-3 @min-[28rem]:grid-cols-2 @min-[44rem]:grid-cols-3 @min-[64rem]:grid-cols-4'>
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  );
}
