import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { AnimatedStatValue } from '@/components/animated-stat-value';
import {
  DonutChart,
  DonutLegend,
  type DonutSlice,
} from '@/components/donut-chart';
import {
  chartShares,
  chartStartTimes,
  type ChartMotionEasing,
} from '@/lib/chart-motion';
import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'primary' | 'success' | 'warning' | 'info';

const toneStyles: Record<
  StatTone,
  { card: string; value: string; pill: string }
> = {
  default: {
    card: 'border-border bg-card',
    value: 'text-foreground',
    pill: 'bg-muted text-muted-foreground',
  },
  primary: {
    card: 'border-primary/20 bg-primary/5',
    value: 'text-(--stat-ink-primary)',
    pill: 'bg-primary/15 text-(--stat-ink-primary)',
  },
  success: {
    card: 'border-success/25 bg-success/10',
    value: 'text-(--stat-ink-success)',
    pill: 'bg-success/20 text-(--stat-ink-success)',
  },
  warning: {
    card: 'border-warning/30 bg-warning/10',
    value: 'text-(--stat-ink-warning)',
    pill: 'bg-warning/25 text-(--stat-ink-warning)',
  },
  info: {
    card: 'border-info/25 bg-info/10',
    value: 'text-(--stat-ink-info)',
    pill: 'bg-info/20 text-(--stat-ink-info)',
  },
};

export interface StatDonutGroup {
  label?: string;
  slices: DonutSlice[];
  icon?: LucideIcon;
  easing?: ChartMotionEasing;
}

/** Status / attribute labels — not count nouns. */
const INVARIANT_STAT_LABELS = new Set([
  'Visibility',
  'Licensed',
  'Open',
  'Public',
]);

function singularizeStatLabel(label: string) {
  if (label.endsWith('ies')) return `${label.slice(0, -3)}y`;
  if (label.endsWith('s')) return label.slice(0, -1);
  return label;
}

function statLabelForCount(label: string, value: ReactNode) {
  if (INVARIANT_STAT_LABELS.has(label) || typeof value !== 'number') {
    return label;
  }
  return value === 1 ? singularizeStatLabel(label) : label;
}

/** Rounded-square icon + optional large count + uppercase label (`pill`),
 * or a light icon + label row for nested bar-chart titles (`plain`). */
function StatPillEyebrow({
  label,
  value,
  showValue = true,
  variant = 'pill',
  icon: Icon,
  valueClass,
  pillClass,
}: {
  label: string;
  value: ReactNode;
  showValue?: boolean;
  variant?: 'pill' | 'plain';
  icon?: LucideIcon;
  valueClass: string;
  pillClass: string;
}) {
  if (variant === 'plain') {
    return (
      <div className='flex w-full items-center gap-1.5'>
        {Icon ?
          <Icon aria-hidden='true' className='icon-inline shrink-0' />
        : null}
        <span className='type-label text-foreground'>{label}</span>
      </div>
    );
  }

  return (
    <div className='flex w-full items-center gap-2.5'>
      {Icon ?
        <span
          aria-hidden='true'
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            pillClass,
          )}
        >
          <Icon className='size-5' />
        </span>
      : null}
      <div className='flex min-w-0 items-baseline gap-2'>
        {showValue ?
          <span
            className={cn(
              'font-heading text-3xl leading-snug tabular-nums tracking-tight',
              valueClass,
            )}
          >
            {typeof value === 'number' ?
              <AnimatedStatValue value={value} />
            : value}
          </span>
        : null}
        <span className='type-label uppercase tracking-[0.14em] text-muted-foreground'>
          {label}
        </span>
      </div>
    </div>
  );
}

/** Labeled donut: caption in the hole; slice labels stack to the right. */
function DonutBlock({
  slices,
  caption,
  icon: Icon,
  startMs = 0,
  easing = 'ease-out',
}: {
  slices: DonutSlice[];
  caption?: string;
  icon?: LucideIcon;
  startMs?: number;
  easing?: ChartMotionEasing;
}) {
  return (
    <div className='flex w-full items-center justify-center gap-4'>
      <div className='relative size-40 shrink-0'>
        <DonutChart
          slices={slices}
          className='size-full'
          startMs={startMs}
          easing={easing}
        >
          {caption || Icon ?
            <div className='flex flex-col items-center justify-center gap-1 text-center'>
              {Icon ?
                <Icon aria-hidden='true' className='icon-inline' />
              : null}
              {caption ?
                <span className='type-label leading-tight text-foreground'>
                  {caption}
                </span>
              : null}
            </div>
          : null}
        </DonutChart>
      </div>
      <DonutLegend slices={slices} className='type-meta shrink-0 text-left' />
    </div>
  );
}

export function StatCard({
  label,
  value,
  showValue = true,
  description,
  icon: Icon,
  tone = 'default',
  donut,
  donuts,
  chartEasing = 'ease-out',
  framed = false,
  eyebrow = 'pill',
  className,
}: {
  label: string;
  value: ReactNode;
  /** When false, eyebrow is icon + label only (mix charts whose total is in the legend). */
  showValue?: boolean;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  donut?: DonutSlice[];
  donuts?: StatDonutGroup[];
  /** Used by the single `donut`; groups can set their own easing. */
  chartEasing?: ChartMotionEasing;
  /** Full-card chrome without donuts (e.g. Tours page rollup around bar mixes). */
  framed?: boolean;
  /** `pill` = hero count eyebrow; `plain` = nested bar-chart title. */
  eyebrow?: 'pill' | 'plain';
  className?: string;
}) {
  const styles = toneStyles[tone];
  const charts: StatDonutGroup[] =
    donuts ?? (donut ? [{ slices: donut, easing: chartEasing }] : []);
  const hasCharts = charts.length > 0;
  const chartStarts = chartStartTimes(
    charts.map((chart) => chartShares(chart.slices)),
  );
  const countLabel = showValue ? statLabelForCount(label, value) : label;
  const asCard = hasCharts || framed;

  const title = (
    <StatPillEyebrow
      label={countLabel}
      value={value}
      showValue={showValue}
      variant={eyebrow}
      icon={Icon}
      valueClass={styles.value}
      pillClass={styles.pill}
    />
  );

  const body = (
    <>
      {title}
      {hasCharts ?
        charts.length === 1 ?
          <DonutBlock
            slices={charts[0].slices}
            caption={charts[0].label}
            icon={charts[0].icon}
            easing={charts[0].easing}
          />
        : <div
            className={cn(
              'grid w-full justify-items-center gap-4 sm:grid-cols-2',
              charts.length >= 3 && 'lg:grid-cols-3',
            )}
          >
            {charts.map((chart, index) => (
              <DonutBlock
                key={chart.label ?? 'chart'}
                slices={chart.slices}
                caption={chart.label}
                icon={chart.icon}
                startMs={chartStarts[index]}
                easing={chart.easing}
              />
            ))}
          </div>

      : null}
      {description ?
        <div className='w-full text-left'>{description}</div>
      : null}
    </>
  );

  if (asCard) {
    return (
      <section
        className={cn(
          'flex flex-col items-center rounded-xl p-5',
          framed ? 'gap-6' : 'gap-3',
          styles.card,
          className,
        )}
      >
        {body}
      </section>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-stretch',
        eyebrow === 'plain' ? 'gap-2' : 'gap-3',
        className,
      )}
    >
      {body}
    </div>
  );
}

export function StatCardGrid({
  children,
  columns = 3,
  tone = 'default',
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  tone?: StatTone;
  className?: string;
  'aria-label'?: string;
}) {
  const themed = tone !== 'default';

  return (
    <section
      aria-label={ariaLabel}
      data-slot='stat-grid'
      className={cn(
        'grid overflow-hidden rounded-xl',
        themed ?
          cn(toneStyles[tone].card, 'gap-10 p-6 sm:gap-16')
        : 'divide-y bg-card ring-1 ring-foreground/10 sm:divide-y-0 sm:divide-x [&>*]:p-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </section>
  );
}
