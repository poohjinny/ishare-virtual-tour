import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';

/**
 * Brand color preview. `inline` rides beside meta text, `field` sits inside a
 * hex input without growing the control width, `control` is the swatch acting
 * as its own input — big enough to click, short enough to stay form-dense.
 */
export function ColorSwatch({
  color,
  size = 'inline',
  className,
}: {
  color: string;
  size?: 'inline' | 'field' | 'control';
  className?: string;
}) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'shrink-0 rounded-full border',
        size === 'control' && 'size-7',
        size === 'field' && 'size-5.5',
        size === 'inline' && 'size-3.5',
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

const HEX6 = /^#([0-9a-fA-F]{6})$/;

function toPickerValue(value: string): string {
  const trimmed = value.trim();
  return HEX6.test(trimmed) ? trimmed : '#000000';
}

/** Hex text field with a leading picker inset — width stays one input wide. */
export function ColorHexInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const swatch = value.trim() || 'transparent';

  return (
    <div className={cn('relative w-full', className)}>
      <label
        className={cn(
          'absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center',
          disabled ? 'pointer-events-none' : 'cursor-pointer',
        )}
      >
        <ColorSwatch color={swatch} size='field' />
        <input
          type='color'
          aria-label='Pick color'
          className='absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
          value={toPickerValue(value)}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          tabIndex={-1}
        />
      </label>
      <Input
        id={id}
        className='font-mono pl-9'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
