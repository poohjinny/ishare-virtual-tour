export function AccordionChevron({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden='true'>
      <svg viewBox='0 0 20 20' fill='none'>
        <path
          d='M5 8l5 5 5-5'
          stroke='currentColor'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  );
}
