import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import {
  TOUR_SHARE_APPS_HEADING,
  TOUR_SHARE_APP_OPEN_DELAY_MS,
  TOUR_SHARE_COPY_FAILED,
  TOUR_SHARE_COPY_LABEL,
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_EMAIL_LABEL,
  TOUR_SHARE_FACEBOOK_LABEL,
  TOUR_SHARE_INSTAGRAM_ARIA,
  TOUR_SHARE_INSTAGRAM_IDLE_TIP,
  TOUR_SHARE_INSTAGRAM_LABEL,
  TOUR_SHARE_LEAD_AFTER,
  TOUR_SHARE_LEAD_BEFORE,
  TOUR_SHARE_LINKEDIN_IDLE_TIP,
  TOUR_SHARE_LINKEDIN_LABEL,
  TOUR_SHARE_NATIVE_LABEL,
  TOUR_SHARE_PASTE_REPLACE_HINT,
  TOUR_SHARE_WHATSAPP_IDLE_TIP,
  TOUR_SHARE_WHATSAPP_LABEL,
  TOUR_SHARE_X_LABEL,
  canUseNativeShare,
  shouldPreferNativeShare,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import {
  buildNativeShareData,
  buildShareFacebookUrl,
  buildShareGmailComposeUrl,
  buildShareLinkedInUrl,
  buildShareCaptionClipboardText,
  buildShareWhatsAppUrl,
  buildShareXUrl,
  openShareAppLink,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import { ShareIcon } from './icons/ShareIcon';
import {
  EmailBrandIcon,
  FacebookBrandIcon,
  InstagramBrandIcon,
  LinkedInBrandIcon,
  WhatsAppBrandIcon,
  XBrandIcon,
} from './icons/ShareBrandIcons';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { IconTooltip } from './ui/IconTooltip';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_22,
} from './ui/materialSymbolClasses';
import {
  shareTourAppIconVariants,
  shareTourAppTileClassName,
} from './shareTourPanelVariants';
import { GlassPanelCloseIcon } from './TourGlassPanel';
import {
  ANCHOR_SHARE_HERO_OVERLAY_OPEN_ATTR,
  ANCHORED_SHARE_MENU_EXIT_MS,
  anchoredShareMenuAttr,
  anchoredShareMenuHeroBodyClassName,
  anchoredShareMenuCloseClassName,
  anchoredShareMenuCloseIconClassName,
  anchoredShareMenuDropdownClassName,
  anchoredShareMenuGridClassName,
  anchoredShareMenuHeroGridClassName,
  anchoredShareMenuHeroLeadClassName,
  anchoredShareMenuHeroOverlayClassName,
  anchoredShareMenuInClassName,
  anchoredShareMenuItemClassName,
  anchoredShareMenuItemLabelClassName,
  anchoredShareMenuLeadClassName,
  anchoredShareMenuOutClassName,
} from './anchoredShareMenuVariants';

export type AnchoredShareMenuPayload = {
  shareUrl: string;
  message: ShareMessage;
  contextLabel: string;
  anchorEl: HTMLElement;
};

const HERO_SELECTOR = '.anchored-panel__hero';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolveShareHero(anchor: HTMLElement): HTMLElement | null {
  const hero = anchor.closest(HERO_SELECTOR);
  return hero instanceof HTMLElement ? hero : null;
}

type ShareAppIconVariant =
  | 'native'
  | 'email'
  | 'instagram'
  | 'whatsapp'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'copy';

type MenuChannel = {
  id: string;
  label: string;
  ariaLabel?: string;
  idleTooltip?: string;
  iconVariant: ShareAppIconVariant;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  openHref?: (href: string) => void | Promise<void>;
};

const MENU_GAP_PX = 8;
const MENU_VIEWPORT_PAD_PX = 12;

type AnchoredShareMenuProps = AnchoredShareMenuPayload & {
  open: boolean;
  onClose: () => void;
  /** Called after exit animation so the parent can unmount. */
  onExited?: () => void;
};

export function AnchoredShareMenu({
  shareUrl,
  message,
  contextLabel,
  anchorEl,
  open,
  onClose,
  onExited,
}: AnchoredShareMenuProps) {
  void contextLabel;
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    top: 0,
    left: 0,
    visibility: 'hidden',
  });
  const [heroOverlay, setHeroOverlay] = useState(false);
  const [channelFeedback, setChannelFeedback] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const openDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const showNativeShare = shouldPreferNativeShare();

  const reposition = useCallback(() => {
    const menu = menuRef.current;
    if (!menu || !anchorEl.isConnected) return;

    const hero = resolveShareHero(anchorEl);
    if (hero) {
      const rect = hero.getBoundingClientRect();
      setHeroOverlay(true);
      setStyle({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visibility: 'visible',
      });
      return;
    }

    const anchor = anchorEl.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchor.bottom + MENU_GAP_PX;
    if (top + menuRect.height > vh - MENU_VIEWPORT_PAD_PX) {
      top = Math.max(
        MENU_VIEWPORT_PAD_PX,
        anchor.top - MENU_GAP_PX - menuRect.height,
      );
    }

    let left = anchor.right - menuRect.width;
    left = Math.min(
      Math.max(MENU_VIEWPORT_PAD_PX, left),
      vw - MENU_VIEWPORT_PAD_PX - menuRect.width,
    );

    setHeroOverlay(false);
    setStyle({
      top,
      left,
      width: undefined,
      height: undefined,
      visibility: 'visible',
    });
  }, [anchorEl]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition, shareUrl]);

  useLayoutEffect(() => {
    if (!open || !heroOverlay) return;
    const hero = resolveShareHero(anchorEl);
    if (!hero) return;
    hero.setAttribute(ANCHOR_SHARE_HERO_OVERLAY_OPEN_ATTR, '');
    return () => {
      hero.removeAttribute(ANCHOR_SHARE_HERO_OVERLAY_OPEN_ATTR);
    };
  }, [anchorEl, heroOverlay, open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => reposition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;

    // Don't dismiss from the same gesture that opened the menu (nav/info
    // share opens on pointerdown; listener mounts before pointerup).
    let dismissArmed = false;
    const armDismiss = () => {
      dismissArmed = true;
    };
    const armTimer = window.setTimeout(armDismiss, 0);
    window.addEventListener('pointerup', armDismiss, true);
    window.addEventListener('pointercancel', armDismiss, true);

    const onPointerDown = (event: PointerEvent) => {
      if (!dismissArmed) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(armTimer);
      window.removeEventListener('pointerup', armDismiss, true);
      window.removeEventListener('pointercancel', armDismiss, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorEl, onClose, open]);

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(
      () => onExited?.(),
      prefersReducedMotion() ? 0 : ANCHORED_SHARE_MENU_EXIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, onExited]);

  const clearShareTimers = useCallback(() => {
    if (openDelayTimerRef.current) {
      window.clearTimeout(openDelayTimerRef.current);
      openDelayTimerRef.current = null;
    }
    if (feedbackClearTimerRef.current) {
      window.clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearShareTimers(), [clearShareTimers]);

  const flashFeedback = useCallback((id: string, label: string, ms = 2400) => {
    if (feedbackClearTimerRef.current) {
      window.clearTimeout(feedbackClearTimerRef.current);
    }
    setChannelFeedback({ id, label });
    feedbackClearTimerRef.current = window.setTimeout(() => {
      feedbackClearTimerRef.current = null;
      setChannelFeedback(null);
    }, ms);
  }, []);

  const handleCopy = useCallback(async () => {
    clearShareTimers();
    const ok = await copyToClipboard(shareUrl);
    flashFeedback(
      'copy',
      ok ? TOUR_SHARE_COPIED_LABEL : TOUR_SHARE_COPY_FAILED,
    );
  }, [clearShareTimers, flashFeedback, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!canUseNativeShare()) return;
    try {
      const data = buildNativeShareData(shareUrl, message);
      if (
        typeof navigator.canShare === 'function' &&
        !navigator.canShare(data)
      ) {
        await navigator.share({ text: `${data.text}\n${shareUrl}` });
      } else {
        await navigator.share(data);
      }
      onClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }, [message, onClose, shareUrl]);

  const handleInstagramShare = useCallback(async () => {
    clearShareTimers();
    const ok = await copyToClipboard(shareUrl);
    flashFeedback(
      'instagram',
      ok ? TOUR_SHARE_COPIED_LABEL : TOUR_SHARE_COPY_FAILED,
    );
  }, [clearShareTimers, flashFeedback, shareUrl]);

  const handleWhatsAppShare = useCallback(async () => {
    clearShareTimers();
    const text = buildShareCaptionClipboardText(shareUrl, message);
    const ok = await copyToClipboard(text);
    flashFeedback(
      'whatsapp',
      ok ? TOUR_SHARE_PASTE_REPLACE_HINT : TOUR_SHARE_COPY_FAILED,
      TOUR_SHARE_APP_OPEN_DELAY_MS + 2400,
    );
    if (!ok) return;
    openDelayTimerRef.current = window.setTimeout(() => {
      openDelayTimerRef.current = null;
      openShareAppLink(buildShareWhatsAppUrl(shareUrl, message));
    }, TOUR_SHARE_APP_OPEN_DELAY_MS);
  }, [clearShareTimers, flashFeedback, message, shareUrl]);

  const handleLinkedInShare = useCallback(async () => {
    clearShareTimers();
    const text = buildShareCaptionClipboardText(shareUrl, message);
    const ok = await copyToClipboard(text);
    flashFeedback(
      'linkedin',
      ok ? TOUR_SHARE_PASTE_REPLACE_HINT : TOUR_SHARE_COPY_FAILED,
      TOUR_SHARE_APP_OPEN_DELAY_MS + 2400,
    );
    if (!ok) return;
    openDelayTimerRef.current = window.setTimeout(() => {
      openDelayTimerRef.current = null;
      openShareAppLink(buildShareLinkedInUrl(shareUrl));
    }, TOUR_SHARE_APP_OPEN_DELAY_MS);
  }, [clearShareTimers, flashFeedback, message, shareUrl]);

  const channels = useMemo(() => {
    const list: MenuChannel[] = [
      {
        id: 'copy',
        label: TOUR_SHARE_COPY_LABEL,
        idleTooltip: TOUR_SHARE_COPY_LABEL,
        iconVariant: 'copy',
        icon: (
          <MaterialSymbol
            name='content_copy'
            className='leading-none'
            sizePx={MATERIAL_SYMBOL_SIZE_16}
          />
        ),
        onClick: () => void handleCopy(),
      },
    ];

    if (showNativeShare) {
      list.push({
        id: 'native',
        label: TOUR_SHARE_NATIVE_LABEL,
        iconVariant: 'native',
        icon: (
          <ShareIcon
            className='share-tour-panel__share-icon'
            sizePx={MATERIAL_SYMBOL_SIZE_22}
          />
        ),
        onClick: () => void handleNativeShare(),
      });
    }

    list.push(
      {
        id: 'email',
        label: TOUR_SHARE_EMAIL_LABEL,
        iconVariant: 'email',
        icon: <EmailBrandIcon />,
        href: buildShareGmailComposeUrl(shareUrl, message),
      },
      {
        id: 'whatsapp',
        label: TOUR_SHARE_WHATSAPP_LABEL,
        idleTooltip: TOUR_SHARE_WHATSAPP_IDLE_TIP,
        iconVariant: 'whatsapp',
        icon: <WhatsAppBrandIcon />,
        onClick: () => void handleWhatsAppShare(),
      },
      {
        id: 'instagram',
        label: TOUR_SHARE_INSTAGRAM_LABEL,
        ariaLabel: TOUR_SHARE_INSTAGRAM_ARIA,
        idleTooltip: TOUR_SHARE_INSTAGRAM_IDLE_TIP,
        iconVariant: 'instagram',
        icon: <InstagramBrandIcon />,
        onClick: () => void handleInstagramShare(),
      },
      {
        id: 'facebook',
        label: TOUR_SHARE_FACEBOOK_LABEL,
        iconVariant: 'facebook',
        icon: <FacebookBrandIcon />,
        href: buildShareFacebookUrl(shareUrl),
      },
      {
        id: 'x',
        label: TOUR_SHARE_X_LABEL,
        iconVariant: 'x',
        icon: <XBrandIcon />,
        href: buildShareXUrl(shareUrl, message),
      },
      {
        id: 'linkedin',
        label: TOUR_SHARE_LINKEDIN_LABEL,
        idleTooltip: TOUR_SHARE_LINKEDIN_IDLE_TIP,
        iconVariant: 'linkedin',
        icon: <LinkedInBrandIcon />,
        onClick: () => void handleLinkedInShare(),
      },
    );

    return list;
  }, [
    handleCopy,
    handleInstagramShare,
    handleLinkedInShare,
    handleNativeShare,
    handleWhatsAppShare,
    message,
    shareUrl,
    showNativeShare,
  ]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      {...{ [anchoredShareMenuAttr]: '' }}
      ref={menuRef}
      role='menu'
      aria-label={TOUR_SHARE_APPS_HEADING}
      aria-hidden={!open}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      className={cn(
        heroOverlay ?
          anchoredShareMenuHeroOverlayClassName
        : anchoredShareMenuDropdownClassName,
        open ? anchoredShareMenuInClassName : anchoredShareMenuOutClassName,
      )}
      style={style}
    >
      <button
        type='button'
        className={anchoredShareMenuCloseClassName}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label='Close'
      >
        <GlassPanelCloseIcon className={anchoredShareMenuCloseIconClassName} />
      </button>
      <div
        className={heroOverlay ? anchoredShareMenuHeroBodyClassName : undefined}
      >
        <p
          className={
            heroOverlay ?
              anchoredShareMenuHeroLeadClassName
            : anchoredShareMenuLeadClassName
          }
        >
          {TOUR_SHARE_LEAD_BEFORE} {TOUR_SHARE_LEAD_AFTER}
        </p>
        <ul
          className={
            heroOverlay ?
              anchoredShareMenuHeroGridClassName
            : anchoredShareMenuGridClassName
          }
        >
          {channels.map((channel) => {
            const feedbackLabel =
              channelFeedback?.id === channel.id ? channelFeedback.label : null;
            const idleTip = channel.idleTooltip ?? channel.label;
            const tooltipLabel = feedbackLabel ?? idleTip;
            const ariaLabel = channel.ariaLabel ?? channel.label;
            const showFeedbackTip = feedbackLabel !== null;
            const icon = (
              <span
                className={shareTourAppIconVariants({
                  channel: channel.iconVariant,
                })}
                aria-hidden='true'
              >
                {channel.icon}
              </span>
            );

            const tile =
              channel.href ?
                (() => {
                  const isMailto = channel.href.startsWith('mailto:');
                  return (
                    <a
                      role='menuitem'
                      className={shareTourAppTileClassName}
                      href={channel.href}
                      target={isMailto ? undefined : '_blank'}
                      rel={isMailto ? undefined : 'noopener noreferrer'}
                      aria-label={ariaLabel}
                      onClick={(event) => {
                        if (isMailto) return;
                        event.preventDefault();
                        openShareAppLink(channel.href!);
                      }}
                    >
                      {icon}
                      <span className={anchoredShareMenuItemLabelClassName}>
                        {channel.label}
                      </span>
                    </a>
                  );
                })()
              : <button
                  type='button'
                  role='menuitem'
                  className={shareTourAppTileClassName}
                  aria-label={ariaLabel}
                  onClick={channel.onClick}
                  disabled={showFeedbackTip}
                >
                  {icon}
                  <span className={anchoredShareMenuItemLabelClassName}>
                    {channel.label}
                  </span>
                </button>;

            return (
              <li
                key={channel.id}
                className={anchoredShareMenuItemClassName}
                role='none'
              >
                <IconTooltip
                  label={tooltipLabel}
                  placement='top'
                  forceShow={showFeedbackTip}
                  className='block min-w-0 w-full'
                >
                  {tile}
                </IconTooltip>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
