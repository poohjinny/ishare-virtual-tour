import {
  devViewPanelColorFieldClassName,
  devViewPanelColorPickerClassName,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelInputClassName,
} from './devViewPanelVariants';
import { cn } from '../lib/cn';

const DEFAULT_HEX = '#007078';

export function normalizeHexColorInput(value: string, fallback = DEFAULT_HEX) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-f]{6}$/i.test(withHash)) {
    return withHash.toLowerCase();
  }
  if (/^#[0-9a-f]{3}$/i.test(withHash)) {
    return `#${withHash
      .slice(1)
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase()}`;
  }
  return withHash;
}

type DevPanelColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultColor?: string;
  pickerAriaLabel?: string;
};

export function DevPanelColorField({
  label,
  value,
  onChange,
  defaultColor = DEFAULT_HEX,
  pickerAriaLabel,
}: DevPanelColorFieldProps) {
  const pickerValue =
    /^#[0-9a-f]{6}$/i.test(value) ? value : defaultColor;

  return (
    <div className={devViewPanelFieldClassName}>
      <span className={devViewPanelFieldLabelClassName}>{label}</span>
      <div className={devViewPanelColorFieldClassName}>
        <input
          className={devViewPanelColorPickerClassName}
          type='color'
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={pickerAriaLabel ?? `${label} picker`}
        />
        <input
          className={cn(devViewPanelInputClassName, 'min-w-0 flex-1')}
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) =>
            onChange(normalizeHexColorInput(e.target.value, defaultColor))
          }
          placeholder={defaultColor}
          spellCheck={false}
          autoComplete='off'
        />
      </div>
    </div>
  );
}
