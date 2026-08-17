import { DonutChart } from '@/components/donut-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  chartFillTimeline,
  chartShares,
  type ChartMotionEasing,
} from '@/lib/chart-motion';
import { cn } from '@/lib/utils';

const DONUT_STROKES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export interface DistributionItem {
  label: string;
  count: number;
  color?: string;
  colorClass?: string;
  stroke?: string;
}

const DEFAULT_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
];

function totalOf(items: DistributionItem[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

/** Empty bar + legend slot so a stat cell matches neighbors that have a mix. */
export function StatChartPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2 text-left', className)} aria-hidden='true'>
      <SegmentedBar items={[]} />
      <p className='type-meta text-muted-foreground/70'>No mix</p>
    </div>
  );
}

/** Horizontal stacked bar for categorical mix (visibility, status, …). */
export function SegmentedBar({
  items,
  className,
  startMs = 0,
  easing = 'ease-out',
  'aria-label': ariaLabel,
}: {
  items: DistributionItem[];
  className?: string;
  /** When this bar starts sweeping — see `chartStartTimes`. */
  startMs?: number;
  easing?: ChartMotionEasing;
  'aria-label'?: string;
}) {
  const total = totalOf(items);
  if (total === 0) {
    return (
      <div
        className={cn('h-2.5 rounded-full bg-muted', className)}
        aria-label={ariaLabel}
      />
    );
  }

  const fills = chartFillTimeline(chartShares(items), startMs, easing);

  return (
    <div
      className={cn(
        'flex h-2.5 overflow-hidden rounded-full bg-muted',
        className,
      )}
      role='img'
      aria-label={
        ariaLabel ??
        items.map((item) => `${item.label} ${item.count}`).join(', ')
      }
    >
      {items.map((item, index) => {
        if (item.count <= 0) return null;
        const fillStyle = fills[index];
        return (
          <span
            key={item.label}
            className={cn(
              'chart-animate-bar h-full min-w-0',
              !item.color &&
                (item.colorClass ??
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
            )}
            style={{
              ...fillStyle,
              width: `${(item.count / total) * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.count}`}
          />
        );
      })}
    </div>
  );
}

/** Card with segmented bar + legend for a categorical distribution. */
export function DistributionCard({
  title,
  items,
  variant = 'bar',
  className,
  easing = 'ease-out',
}: {
  title: string;
  items: DistributionItem[];
  variant?: 'bar' | 'donut';
  className?: string;
  easing?: ChartMotionEasing;
}) {
  const total = totalOf(items);

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='type-title'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center'>
          {variant === 'donut' ?
            <DonutChart
              slices={items.map((item, index) => ({
                label: item.label,
                count: item.count,
                color:
                  item.stroke ?? DONUT_STROKES[index % DONUT_STROKES.length],
              }))}
              center={String(total)}
              easing={easing}
            />
          : <div className='min-w-0 flex-1'>
              <SegmentedBar items={items} easing={easing} aria-label={title} />
            </div>
          }
          <ul className='min-w-0 flex-1 space-y-2'>
            {items.map((item, index) => {
              const pct =
                total === 0 ? 0 : Math.round((item.count / total) * 100);
              return (
                <li
                  key={item.label}
                  className='flex items-center justify-between gap-3 text-sm'
                >
                  <span className='flex min-w-0 items-center gap-1.5'>
                    <span
                      aria-hidden='true'
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        item.colorClass ??
                          DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                      )}
                    />
                    <span className='truncate'>{item.label}</span>
                  </span>
                  <span className='shrink-0 tabular-nums text-muted-foreground'>
                    {item.count}
                    <span className='ml-1 text-xs'>({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/** Vertical list of proportional bars (categories). */
export function CategoryBars({
  items,
  className,
  startMs = 0,
  easing = 'ease-out',
}: {
  items: DistributionItem[];
  className?: string;
  /** When this chart starts sweeping — see `chartStartTimes`. */
  startMs?: number;
  easing?: ChartMotionEasing;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const fills = chartFillTimeline(
    items.map((item) => item.count / max),
    startMs,
    easing,
  );

  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item, index) => {
        const fillStyle = fills[index];
        return (
          <li key={item.label} className='space-y-1.5'>
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='truncate font-medium'>{item.label}</span>
              <span className='tabular-nums text-muted-foreground'>
                {item.count}
              </span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-muted'>
              <div
                className={cn(
                  'chart-animate-bar h-full rounded-full motion-reduce:transition-none',
                  item.colorClass ??
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                )}
                style={{ ...fillStyle, width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
