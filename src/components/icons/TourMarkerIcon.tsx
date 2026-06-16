interface TourMarkerIconProps {
  className?: string;
}

/** Filled location pin — tour product mark. */
export function TourMarkerIcon({ className }: TourMarkerIconProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12 22s8-5.33 8-12a8 8 0 1 0-16 0c0 6.67 8 12 8 12z'
        fill='currentColor'
      />
      <circle cx='12' cy='10' r='3' fill='white' fillOpacity='0.92' />
    </svg>
  );
}
