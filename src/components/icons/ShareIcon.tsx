interface ShareIconProps {
  className?: string;
}

export function ShareIcon({ className }: ShareIconProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='18'
        cy='5'
        r='2.25'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <circle
        cx='6'
        cy='12'
        r='2.25'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <circle
        cx='18'
        cy='19'
        r='2.25'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <path
        d='M8.1 10.9 15.9 6.6M8.1 13.1l7.8 4.3'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
