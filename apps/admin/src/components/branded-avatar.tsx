import { AssetImage } from '@/components/asset-image';
import { cn } from '@/lib/utils';

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function BrandedAvatar({
  src,
  fallbackSrc,
  label,
  size = 'md',
  fit = 'contain',
  className,
  loading = 'lazy',
}: {
  src?: string;
  fallbackSrc?: string;
  label: string;
  brandColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fit?: 'cover' | 'contain';
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const sizeClass =
    size === 'xs' ? 'size-5 rounded-md'
    : size === 'sm' ? 'size-8'
    : size === 'lg' ? 'h-12 w-12'
    : 'size-10';

  const containPad = size === 'xs' ? 'p-0.5' : 'p-1';

  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background',
        sizeClass,
        className,
      )}
    >
      <AssetImage
        src={src}
        fallbackSrc={fallbackSrc}
        alt=''
        loading={loading}
        className={cn(
          'size-full',
          fit === 'cover' ? 'object-cover' : cn('object-contain', containPad),
        )}
        fallback={
          <span className='text-[10px] font-semibold text-muted-foreground'>
            {initials(label) || '?'}
          </span>
        }
      />
    </span>
  );
}

export function MediaThumb({
  src,
  label,
  className,
  aspect = 'video',
  fit = 'cover',
}: {
  src?: string;
  label: string;
  className?: string;
  aspect?: 'video' | 'square' | 'auto';
  fit?: 'cover' | 'contain';
}) {
  const fillParent = aspect === 'auto';

  return (
    <span
      className={cn(
        'relative block overflow-hidden rounded-md border bg-muted',
        aspect === 'square' && 'aspect-square',
        aspect === 'video' && 'aspect-video',
        fillParent && 'min-h-0',
        className,
      )}
    >
      <AssetImage
        src={src}
        alt=''
        className={cn(
          fillParent ? 'absolute inset-0 size-full' : 'size-full',
          fit === 'contain' ? 'object-contain p-0.5' : 'object-cover',
        )}
        fallback={
          <span
            className={cn(
              'flex items-center justify-center px-1 text-center text-[10px] text-muted-foreground',
              fillParent ? 'absolute inset-0 size-full' : 'size-full',
            )}
          >
            {label}
          </span>
        }
      />
    </span>
  );
}

/**
 * Fixed square thumb for select/menu rows — avoids SelectItem span/flex crop.
 * `sm` suits a menu row that stands on its own; `xs` is the size that still
 * fits a 32px control, which a Select row needs because Radix repeats the
 * selected row's label inside the trigger.
 */
export function OptionThumb({
  src,
  fallbackSrc,
  label,
  fit = 'cover',
  size = 'sm',
  loading = 'lazy',
}: {
  src?: string;
  fallbackSrc?: string;
  label: string;
  fit?: 'cover' | 'contain';
  size?: 'xs' | 'sm';
  loading?: 'lazy' | 'eager';
}) {
  if (fit === 'contain') {
    return (
      <BrandedAvatar
        src={src}
        fallbackSrc={fallbackSrc}
        label={label}
        size={size}
        fit='contain'
        loading={loading}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md border bg-muted',
        size === 'xs' ? 'size-5' : 'size-8',
      )}
    >
      <AssetImage
        src={src}
        fallbackSrc={fallbackSrc}
        alt=''
        loading={loading}
        className='size-full object-cover'
        fallback={
          <span className='flex size-full items-center justify-center text-[10px] text-muted-foreground'>
            {initials(label) || '?'}
          </span>
        }
      />
    </div>
  );
}

/**
 * Scene row for a Select. The thumb is the field's leading mark once a scene
 * is picked, so the field must not also carry an `InputGroup` icon.
 */
export function SceneOptionLabel({
  title,
  thumbnailUrl,
}: {
  title: string;
  thumbnailUrl?: string;
}) {
  return (
    <span className='flex items-center gap-2'>
      <OptionThumb src={thumbnailUrl} label={title} size='xs' />
      {title}
    </span>
  );
}
