import type { ReactNode } from 'react';

import {
  chartFillTimeline,
  chartShares,
  type ChartMotionEasing,
} from '@/lib/chart-motion';
import { cn } from '@/lib/utils';

export interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

const RADIUS = 36;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function totalOf(slices: DonutSlice[]) {
  return slices.reduce((sum, slice) => sum + slice.count, 0);
}

/**
 * Legend next to a chart. `column` = under a bar → inline items; `row` =
 * beside a donut → stacked items. Swatch size matches both layouts (`size-2`).
 * Label and count are separated by a middle dot (“Public · 5”).
 */
export function DonutLegend({
  slices,
  className,
  layout = 'row',
}: {
  slices: DonutSlice[];
  className?: string;
  layout?: 'row' | 'column';
}) {
  const inline = layout === 'column';

  return (
    <ul
      className={cn(
        inline ?
          'flex w-full flex-wrap items-center justify-start gap-x-5 gap-y-1.5'
        : 'space-y-1',
        className,
      )}
    >
      {slices.map((slice) => (
        <li
          key={slice.label}
          className={
            inline ?
              'inline-flex items-center gap-1.5'
            : 'flex items-center gap-1.5'
          }
        >
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={{ backgroundColor: slice.color }}
          />
          <span className='inline-flex items-baseline gap-0.5 whitespace-nowrap'>
            <span>{slice.label}</span>
            <span aria-hidden='true' className='text-muted-foreground/50'>
              ·
            </span>
            <span className='font-heading font-semibold tabular-nums text-foreground'>
              {slice.count}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Accessible SVG donut for categorical shares. */
export function DonutChart({
  slices,
  center,
  children,
  className,
  centerClassName,
  size,
  startMs = 0,
  easing = 'ease-out',
}: {
  slices: DonutSlice[];
  center?: string;
  children?: ReactNode;
  className?: string;
  centerClassName?: string;
  /** Fixed px box. Omit when `className` sets size (e.g. `size-full`). */
  size?: number;
  /** When this donut starts sweeping — see `chartStartTimes`. */
  startMs?: number;
  easing?: ChartMotionEasing;
}) {
  const total = totalOf(slices);
  const fills = chartFillTimeline(chartShares(slices), startMs, easing);
  let offset = 0;

  return (
    <div
      className={cn('relative shrink-0', size == null && 'size-28', className)}
      style={size != null ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox='0 0 96 96'
        className='size-full -rotate-90'
        role='img'
        aria-label={slices
          .map((slice) => `${slice.label} ${slice.count}`)
          .join(', ')}
      >
        <circle
          cx='48'
          cy='48'
          r={RADIUS}
          fill='none'
          stroke='currentColor'
          className='text-muted'
          strokeWidth={STROKE}
        />
        {total > 0 ?
          slices.map((slice, index) => {
            if (slice.count <= 0) return null;
            const length = (slice.count / total) * CIRCUMFERENCE;
            const fillStyle = fills[index];
            const circle = (
              <circle
                key={slice.label}
                cx='48'
                cy='48'
                r={RADIUS}
                fill='none'
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-offset}
                strokeLinecap='butt'
                className='transition-[stroke-dasharray] duration-500 chart-animate-stroke motion-reduce:transition-none'
                style={fillStyle}
              />
            );
            offset += length;
            return circle;
          })
        : null}
      </svg>
      {children ?
        <div className='absolute inset-[20%] flex items-center justify-center overflow-hidden'>
          {children}
        </div>
      : center ?
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums',
            centerClassName,
          )}
        >
          {center}
        </span>
      : null}
    </div>
  );
}
