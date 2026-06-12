import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listTours, loadTour } from '../data/loadTour';
import { buildTourLocation, resolveSceneId } from '../utils/tourPaths';
import './ClientSelector.css';

interface ClientSelectorProps {
  currentTourId: string;
  currentSceneId: string;
  disabled?: boolean;
}

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
    <label ref={rootRef} className='client-selector'>
      {clientLogo ?
        <span className='client-selector__logo-wrap' aria-hidden='true'>
          <img
            className='client-selector__logo'
            src={clientLogo}
            alt=''
          />
        </span>
      : <span className='client-selector__label'>Client</span>}
      <select
        ref={selectRef}
        className='client-selector__select ishare-scrollbar'
        value={currentTourId}
        disabled={disabled}
        aria-label={`Select client, current: ${clientLogoAlt}`}
        title={currentLabel}
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
      <span className='client-selector__chevron' aria-hidden='true' />
    </label>
  );
}
