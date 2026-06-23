import { useMemo } from 'react';
import { cn } from '../lib/cn';
import { formatNamingPriceAmount } from '../utils/namingPrice';
import {
  namingPriceFilterFillClassName,
  namingPriceFilterHeaderClassName,
  namingPriceFilterInputMaxClassName,
  namingPriceFilterInputMinClassName,
  namingPriceFilterLabelClassName,
  namingPriceFilterRailClassName,
  namingPriceFilterRootClassName,
  namingPriceFilterTrackClassName,
  namingPriceFilterValuesClassName,
  namingPriceFilterVariants,
} from './namingPriceRangeFilterVariants';

interface NamingPriceRangeFilterProps {
  label: string;
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (nextMin: number, nextMax: number) => void;
  disabled?: boolean;
}

function toPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function NamingPriceRangeFilter({
  label,
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  disabled = false,
}: NamingPriceRangeFilterProps) {
  const fillStyle = useMemo(
    () => ({
      left: `${toPercent(valueMin, min, max)}%`,
      right: `${100 - toPercent(valueMax, min, max)}%`,
    }),
    [max, min, valueMax, valueMin],
  );

  const isActive = valueMin > min || valueMax < max;

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(event.target.value), valueMax);
    onChange(nextMin, valueMax);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(event.target.value), valueMin);
    onChange(valueMin, nextMax);
  };

  return (
    <div
      className={cn(
        namingPriceFilterRootClassName,
        namingPriceFilterVariants({ active: isActive }),
      )}
    >
      <div className={namingPriceFilterHeaderClassName}>
        <span className={namingPriceFilterLabelClassName}>{label}</span>
        <span className={namingPriceFilterValuesClassName} aria-live='polite'>
          {formatNamingPriceAmount(valueMin)} –{' '}
          {formatNamingPriceAmount(valueMax)}
        </span>
      </div>

      <div className={namingPriceFilterTrackClassName}>
        <div className={namingPriceFilterRailClassName} aria-hidden='true'>
          <div className={namingPriceFilterFillClassName} style={fillStyle} />
        </div>

        <input
          type='range'
          className={namingPriceFilterInputMinClassName}
          min={min}
          max={max}
          step={step}
          value={valueMin}
          disabled={disabled}
          aria-label={`${label} minimum`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          aria-valuetext={formatNamingPriceAmount(valueMin)}
          onChange={handleMinChange}
        />
        <input
          type='range'
          className={namingPriceFilterInputMaxClassName}
          min={min}
          max={max}
          step={step}
          value={valueMax}
          disabled={disabled}
          aria-label={`${label} maximum`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={formatNamingPriceAmount(valueMax)}
          onChange={handleMaxChange}
        />
      </div>
    </div>
  );
}
