import { useMemo } from 'react';
import { cn } from '../lib/cn';
import { formatNamingPriceAmount } from '../utils/namingPrice';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { MATERIAL_SYMBOL_SIZE_16 } from './ui/materialSymbolClasses';
import {
  namingPriceFilterEmbeddedLabelClassName,
  namingPriceFilterEmbeddedLabelCellClassName,
  namingPriceFilterEmbeddedGridClassName,
  namingPriceFilterEmbeddedThumbLabelClassName,
  namingPriceFilterEmbeddedThumbLabelsClassName,
  namingPriceFilterEmbeddedTrackWrapClassName,
  namingPriceFilterFillClassName,
  namingPriceFilterHeaderClassName,
  namingPriceFilterIconClassName,
  namingPriceFilterInputMaxClassName,
  namingPriceFilterInputMinClassName,
  namingPriceFilterLabelClassName,
  namingPriceFilterLabelRowClassName,
  namingPriceFilterRailClassName,
  namingPriceFilterRootClassName,
  namingPriceFilterRootEmbeddedClassName,
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
  /** Compact inline layout for the Explore Refine popover. */
  embedded?: boolean;
}

function toPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function thumbLabelPositionStyle(percent: number): React.CSSProperties {
  if (percent <= 12) {
    return { left: 0, transform: 'none' };
  }
  if (percent >= 88) {
    return { right: 0, left: 'auto', transform: 'none' };
  }
  return { left: `${percent}%`, transform: 'translateX(-50%)' };
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
  embedded = false,
}: NamingPriceRangeFilterProps) {
  const minPercent = useMemo(
    () => toPercent(valueMin, min, max),
    [max, min, valueMin],
  );
  const maxPercent = useMemo(
    () => toPercent(valueMax, min, max),
    [max, min, valueMax],
  );

  const fillStyle = useMemo(
    () => ({ left: `${minPercent}%`, right: `${100 - maxPercent}%` }),
    [maxPercent, minPercent],
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

  const track = (
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
  );

  return (
    <div
      className={cn(
        embedded ?
          namingPriceFilterRootEmbeddedClassName
        : namingPriceFilterRootClassName,
        namingPriceFilterVariants({ active: isActive }),
      )}
    >
      {embedded ?
        <div className={namingPriceFilterEmbeddedGridClassName}>
          <span
            className={cn(
              namingPriceFilterEmbeddedLabelClassName,
              namingPriceFilterEmbeddedLabelCellClassName,
            )}
          >
            {label}
          </span>
          <div className={namingPriceFilterEmbeddedTrackWrapClassName}>
            {track}
            <div className={namingPriceFilterEmbeddedThumbLabelsClassName}>
              <span
                className={namingPriceFilterEmbeddedThumbLabelClassName}
                style={thumbLabelPositionStyle(minPercent)}
              >
                {formatNamingPriceAmount(valueMin)}
              </span>
              <span
                className={namingPriceFilterEmbeddedThumbLabelClassName}
                style={thumbLabelPositionStyle(maxPercent)}
              >
                {formatNamingPriceAmount(valueMax)}
              </span>
            </div>
          </div>
        </div>
      : <>
          <div className={namingPriceFilterHeaderClassName}>
            <span className={namingPriceFilterLabelRowClassName}>
              <MaterialSymbol
                name='filter_list'
                className={namingPriceFilterIconClassName}
                sizePx={MATERIAL_SYMBOL_SIZE_16}
              />
              <span className={namingPriceFilterLabelClassName}>{label}</span>
            </span>
            <span
              className={namingPriceFilterValuesClassName}
              aria-live='polite'
            >
              {formatNamingPriceAmount(valueMin)} –{' '}
              {formatNamingPriceAmount(valueMax)}
            </span>
          </div>
          {track}
        </>
      }
    </div>
  );
}
