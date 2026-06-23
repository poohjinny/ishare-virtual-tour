import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TourErrorAction {
  label: string;
  onClick: () => void;
}

export interface TourErrorStateProps {
  title: string;
  body: ReactNode;
  primaryAction: TourErrorAction;
  secondaryAction?: TourErrorAction;
}

/** Inline emphasis inside error body copy (e.g. scene title). */
export const tourErrorEmphasisClassName = 'font-semibold text-body';

const errorCtaVariants = cva(
  'w-full cursor-pointer rounded-full px-4 py-2.5 font-display text-lg font-semibold transition-[background,color,transform] duration-200 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'border-none bg-primary text-white hover:bg-primary-dark',
        secondary:
          'border border-[color:var(--ishare-border)] bg-transparent text-body hover:bg-surface-elevated hover:text-foreground',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

const ERROR_ICON = (
  <svg className='size-9' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='1.75' />
    <path
      d='M12 8v5'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
    />
    <circle cx='12' cy='16.25' r='1' fill='currentColor' />
  </svg>
);

export function TourErrorState({
  title,
  body,
  primaryAction,
  secondaryAction,
}: TourErrorStateProps) {
  return (
    <div
      className='pointer-events-auto absolute inset-0 z-[120] flex animate-error-backdrop-in items-center justify-center bg-black/58 p-6'
      role='alert'
      aria-live='assertive'
    >
      <div
        className={cn(
          'w-full max-w-[22rem] animate-error-card-in rounded-xl border border-white/12 bg-surface px-6 pt-[1.375rem] pb-6 text-center',
          'shadow-[0_16px_48px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.2)]',
        )}
      >
        <div className='mb-1.5 flex items-center justify-center text-danger'>
          {ERROR_ICON}
        </div>
        <h2 className='font-display text-2xl font-semibold leading-[1.35] text-foreground'>
          {title}
        </h2>
        <p className='mt-3.5 text-lg leading-normal text-muted'>{body}</p>
        <div className='mt-8 flex flex-col gap-2.5'>
          <button
            type='button'
            className={errorCtaVariants({ variant: 'primary' })}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
          {secondaryAction ?
            <button
              type='button'
              className={errorCtaVariants({ variant: 'secondary' })}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          : null}
        </div>
      </div>
    </div>
  );
}
