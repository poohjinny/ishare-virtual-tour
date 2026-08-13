import { DEV_DEVICE_BROWSER_CHROME_HEIGHT_PX } from '../../constants/devDevicePresets';
import { cn } from '../../lib/cn';
import {
  devDeviceBrowserChromeAddressClassName,
  devDeviceBrowserChromeBadgeClassName,
  devDeviceBrowserChromeClassName,
  devDeviceBrowserChromeDotClassName,
  devDeviceBrowserChromeTrafficClassName,
} from './devViewPanelVariants';

type DevDeviceBrowserChromeProps = {
  url: string;
  /** Right-side badge — typically the tour title. */
  badgeLabel?: string;
  /** Hide the badge on narrow frames. */
  showBadge?: boolean;
};

/**
 * Lightweight shared browser chrome — traffic lights + URL + tour badge.
 * Sits outside the measured CSS-px viewport.
 */
export function DevDeviceBrowserChrome({
  url,
  badgeLabel,
  showBadge = true,
}: DevDeviceBrowserChromeProps) {
  const badge = badgeLabel?.trim() ?? '';
  return (
    <div
      className={devDeviceBrowserChromeClassName}
      style={{ height: DEV_DEVICE_BROWSER_CHROME_HEIGHT_PX }}
      aria-hidden
    >
      <div className={devDeviceBrowserChromeTrafficClassName}>
        <span
          className={cn(
            devDeviceBrowserChromeDotClassName,
            'bg-[rgb(255,95,87)]',
          )}
        />
        <span
          className={cn(
            devDeviceBrowserChromeDotClassName,
            'bg-[rgb(255,189,46)]',
          )}
        />
        <span
          className={cn(
            devDeviceBrowserChromeDotClassName,
            'bg-[rgb(39,201,63)]',
          )}
        />
      </div>
      <span className={devDeviceBrowserChromeAddressClassName}>{url}</span>
      {showBadge && badge ?
        <span className={devDeviceBrowserChromeBadgeClassName}>{badge}</span>
      : <span className='w-2 shrink-0' aria-hidden />}
    </div>
  );
}
