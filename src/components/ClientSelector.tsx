import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/cn';
import { listTours, loadTour } from '../data/loadTour';
import { buildTourLocation, resolveSceneId } from '../utils/tourPaths';

interface ClientSelectorProps {
  currentTourId: string;
  currentSceneId: string;
  disabled?: boolean;
}

const SELECTOR_SHELL = cn(
  'group absolute top-6 left-6 z-[90] flex min-h-[46px] min-w-0 max-w-[clamp(120px,calc(50vw-72px),280px)] cursor-pointer items-center gap-2 rounded-full border-none py-0 pr-3.5 pl-4',
  'bg-white/52 shadow-[var(--ishare-glass-dock-shadow)] backdrop-blur-[6px] backdrop-saturate-[120%]',
  'transition-[background,box-shadow,transform] duration-200',
  'hover:has-[select:enabled]:bg-white/78 focus-within:has-[select:enabled]:bg-white/78',
  'has-[select:disabled]:cursor-not-allowed has-[select:disabled]:opacity-55',
  'max-[900px]:max-w-[clamp(112px,calc(50vw-56px),220px)]',
  'max-sm:top-4 max-sm:left-3 max-sm:max-w-[clamp(104px,calc(50vw-40px),180px)] max-sm:gap-1.5 max-sm:py-0 max-sm:pr-3 max-sm:pl-3.5',
  'max-[480px]:min-h-11 max-[480px]:max-w-[clamp(96px,calc(50vw-32px),148px)] max-[480px]:px-3 max-[480px]:pr-3',
);

const SELECT_MUTED_TEXT =
  'text-[color-mix(in_srgb,var(--color-body)_55%,var(--color-muted))]';

export function ClientSelector({
  currentTourId,
  currentSceneId,
  disabled = false,
}: ClientSelectorProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rootRef = useRef<HTMLLabelElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const tours = listTours();
  const currentTour = useMemo(() => loadTour(currentTourId), [currentTourId]);
  const currentLabel =
    tours.find((tour) => tour.id === currentTourId)?.label ?? currentTourId;
  const clientLogo = currentTour.branding?.logo;
  const clientLogoAlt = currentTour.branding?.logoAlt ?? currentLabel;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      selectRef.current?.blur();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  if (tours.length <= 1) {
    return null;
  }

  return (
    <label
      ref={rootRef}
      className={cn(SELECTOR_SHELL, clientLogo && 'relative', 'ishare-tooltip-host')}
      data-ishare-tooltip={currentLabel}
      data-ishare-tooltip-placement='bottom'
    >
      {clientLogo ?
        <span
          className='pointer-events-none flex shrink-0 items-center'
          aria-hidden='true'
        >
          <img
            className='block h-7 max-w-[72px] w-auto object-contain object-left max-[480px]:h-6 max-[480px]:max-w-14'
            src={clientLogo}
            alt=''
          />
        </span>
      : <span
          className={cn(
            'pointer-events-none shrink-0 font-display text-sm font-semibold tracking-wide uppercase transition-colors duration-200',
            SELECT_MUTED_TEXT,
            'group-hover:has-[select:enabled]:text-muted group-focus-within:has-[select:enabled]:text-muted',
          )}
        >
          Client
        </span>
      }
      <select
        ref={selectRef}
        className={cn(
          'ishare-scrollbar min-w-0 max-w-full flex-1 appearance-none self-stretch border-none bg-transparent p-0 font-display text-md font-semibold leading-[1.2]',
          'cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-200',
          SELECT_MUTED_TEXT,
          'focus:outline-none focus-visible:outline-none focus-visible:shadow-none',
          'enabled:group-hover:text-foreground enabled:group-focus-within:text-foreground',
          'disabled:cursor-not-allowed',
          'max-[480px]:text-sm',
          clientLogo && 'absolute inset-0 h-full w-full flex-none opacity-0',
        )}
        value={currentTourId}
        disabled={disabled}
        aria-label={`Select client, current: ${clientLogoAlt}`}
        onChange={(event) => {
          const nextTourId = event.target.value;
          event.currentTarget.blur();

          if (nextTourId === currentTourId) return;

          const nextTour = loadTour(nextTourId);
          const nextSceneId = resolveSceneId(nextTourId, currentSceneId);

          navigate(
            buildTourLocation(
              nextTourId,
              nextSceneId,
              nextTour.firstScene,
              searchParams,
            ),
            { replace: true },
          );
        }}
      >
        {tours.map((tour) => (
          <option key={tour.id} value={tour.id}>
            {tour.label}
          </option>
        ))}
      </select>
      <svg
        className='pointer-events-none size-3.5 shrink-0 text-muted opacity-72 transition-opacity duration-200 group-hover:has-[select:enabled]:opacity-100 group-focus-within:has-[select:enabled]:opacity-100 max-[480px]:size-3'
        viewBox='0 0 20 20'
        fill='none'
        aria-hidden='true'
      >
        <path
          d='M5 8l5 5 5-5'
          stroke='currentColor'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </label>
  );
}
