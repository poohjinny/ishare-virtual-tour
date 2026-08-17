import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  TOUR_SHARE_PREVIEW_LABEL,
  TOUR_SHARE_URL_LABEL,
  TOUR_SHARE_WHATSAPP_IDLE_TIP,
  TOUR_SHARE_WHATSAPP_LABEL,
  TOUR_SHARE_X_LABEL,
  canUseNativeShare,
  shouldPreferNativeShare,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import {
  buildShareFacebookUrl,
  buildShareGmailComposeUrl,
  buildShareLinkedInUrl,
  buildShareCaptionClipboardText,
  buildShareWhatsAppUrl,
  buildShareXUrl,
  buildNativeShareData,
  openShareAppLink,
  resolveShareLinkHost,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import { ShareIcon } from './icons/ShareIcon';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_22,
} from './ui/materialSymbolClasses';
import {
  EmailBrandIcon,
  FacebookBrandIcon,
  InstagramBrandIcon,
  LinkedInBrandIcon,
  WhatsAppBrandIcon,
  XBrandIcon,
} from './icons/ShareBrandIcons';
import {
  shareTourAppIconVariants,
  shareTourAppLabelClassName,
  shareTourAppListClassName,
  shareTourAppTileClassName,
  shareTourCopyButtonVariants,
  shareTourPanelDividerClassName,
  shareTourPanelDividerLabelClassName,
  shareTourPanelDividerLineClassName,
  shareTourPanelLeadClassName,
  shareTourPanelRootClassName,
  shareTourPreviewBodyClassName,
  shareTourPreviewCardClassName,
  shareTourPreviewDescriptionClassName,
  shareTourPreviewHostClassName,
  shareTourPreviewImageClassName,
  shareTourPreviewImageWrapClassName,
  shareTourPreviewLabelClassName,
  shareTourPreviewPlaceholderClassName,
  shareTourPreviewSectionClassName,
  shareTourPreviewTitleClassName,
  shareTourPanelUrlFieldClassName,
  shareTourPanelUrlInputClassName,
  shareTourPanelUrlRowClassName,
} from './shareTourPanelVariants';

interface ShareTourPanelProps {
  contextLabel: string;
  shareUrl: string;
  message: ShareMessage;
  previewImageUrl?: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

type ShareAppIconVariant =
  | 'native'
  | 'email'
  | 'instagram'
  | 'whatsapp'
  | 'facebook'
  | 'x'
  | 'linkedin';

interface ShareAppChannel {
  id: string;
  label: string;
  ariaLabel?: string;
  /** Hover/idle tooltip — feedback tip overrides while active. */
  idleTooltip?: string;
  iconVariant: ShareAppIconVariant;
  icon: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  /** Prefer over default `openShareAppLink` when a channel needs extra work. */
  openHref?: (href: string) => void | Promise<void>;
}

export function ShareTourPanel({
  contextLabel,
  shareUrl,
  message,
  previewImageUrl,
}: ShareTourPanelProps) {
  void contextLabel;
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [channelFeedback, setChannelFeedback] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const openDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const showNativeShare = shouldPreferNativeShare();

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

  const flashChannelTip = useCallback(
    (id: string, label: string, clearAfterMs: number) => {
      if (feedbackClearTimerRef.current) {
        window.clearTimeout(feedbackClearTimerRef.current);
      }
      setChannelFeedback({ id, label });
      feedbackClearTimerRef.current = window.setTimeout(() => {
        feedbackClearTimerRef.current = null;
        setChannelFeedback(null);
      }, clearAfterMs);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    setCopyState(ok ? 'copied' : 'failed');
    window.setTimeout(() => setCopyState('idle'), 2400);
  }, [shareUrl]);

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
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }, [message, shareUrl]);

  const handleInstagramShare = useCallback(async () => {
    clearShareTimers();
    const ok = await copyToClipboard(shareUrl);
    flashChannelTip(
      'instagram',
      ok ? TOUR_SHARE_COPIED_LABEL : TOUR_SHARE_COPY_FAILED,
      2400,
    );
  }, [clearShareTimers, flashChannelTip, shareUrl]);

  const handleWhatsAppShare = useCallback(async () => {
    clearShareTimers();
    const text = buildShareCaptionClipboardText(shareUrl, message);
    const ok = await copyToClipboard(text);
    flashChannelTip(
      'whatsapp',
      ok ? TOUR_SHARE_PASTE_REPLACE_HINT : TOUR_SHARE_COPY_FAILED,
      TOUR_SHARE_APP_OPEN_DELAY_MS + 2400,
    );
    if (!ok) return;
    openDelayTimerRef.current = window.setTimeout(() => {
      openDelayTimerRef.current = null;
      openShareAppLink(buildShareWhatsAppUrl(shareUrl, message));
    }, TOUR_SHARE_APP_OPEN_DELAY_MS);
  }, [clearShareTimers, flashChannelTip, message, shareUrl]);

  const handleLinkedInShare = useCallback(async () => {
    clearShareTimers();
    const text = buildShareCaptionClipboardText(shareUrl, message);
    const ok = await copyToClipboard(text);
    flashChannelTip(
      'linkedin',
      ok ? TOUR_SHARE_PASTE_REPLACE_HINT : TOUR_SHARE_COPY_FAILED,
      TOUR_SHARE_APP_OPEN_DELAY_MS + 2400,
    );
    if (!ok) return;
    openDelayTimerRef.current = window.setTimeout(() => {
      openDelayTimerRef.current = null;
      openShareAppLink(buildShareLinkedInUrl(shareUrl));
    }, TOUR_SHARE_APP_OPEN_DELAY_MS);
  }, [clearShareTimers, flashChannelTip, message, shareUrl]);

  const copyLabel =
    copyState === 'copied' ? TOUR_SHARE_COPIED_LABEL
    : copyState === 'failed' ? TOUR_SHARE_COPY_FAILED
    : TOUR_SHARE_COPY_LABEL;

  const shareChannels = useMemo(() => {
    const channels: ShareAppChannel[] = [];

    if (showNativeShare) {
      channels.push({
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

    channels.push(
      {
        id: 'email',
        label: TOUR_SHARE_EMAIL_LABEL,
        iconVariant: 'email',
        icon: <EmailBrandIcon />,
        href: buildShareGmailComposeUrl(shareUrl, message),
        external: true,
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
        external: true,
      },
      {
        id: 'x',
        label: TOUR_SHARE_X_LABEL,
        iconVariant: 'x',
        icon: <XBrandIcon />,
        href: buildShareXUrl(shareUrl, message),
        external: true,
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

    return channels;
  }, [
    handleInstagramShare,
    handleLinkedInShare,
    handleNativeShare,
    handleWhatsAppShare,
    message,
    shareUrl,
    showNativeShare,
  ]);

  return (
    <div className={shareTourPanelRootClassName}>
      <p className={shareTourPanelLeadClassName}>
        {TOUR_SHARE_LEAD_BEFORE} {TOUR_SHARE_LEAD_AFTER}
      </p>

      <ShareLinkPreview
        shareUrl={shareUrl}
        message={message}
        previewImageUrl={previewImageUrl}
      />

      <label className={shareTourPanelUrlFieldClassName}>
        <div className={shareTourPanelUrlRowClassName}>
          <input
            className={shareTourPanelUrlInputClassName}
            type='url'
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={TOUR_SHARE_URL_LABEL}
          />
          <IconTooltip label={copyLabel} placement='top'>
            <button
              type='button'
              className={shareTourCopyButtonVariants({ state: copyState })}
              onClick={() => void handleCopy()}
              aria-label={copyLabel}
            >
              {copyState === 'copied' ?
                <MaterialSymbol
                  name='check'
                  className='leading-none'
                  sizePx={MATERIAL_SYMBOL_SIZE_16}
                />
              : <MaterialSymbol
                  name='content_copy'
                  className='leading-none'
                  sizePx={MATERIAL_SYMBOL_SIZE_16}
                />
              }
            </button>
          </IconTooltip>
        </div>
      </label>

      <div className={shareTourPanelDividerClassName} role='presentation'>
        <span
          className={shareTourPanelDividerLineClassName}
          aria-hidden='true'
        />
        <h3 className={shareTourPanelDividerLabelClassName}>
          {TOUR_SHARE_APPS_HEADING}
        </h3>
        <span
          className={shareTourPanelDividerLineClassName}
          aria-hidden='true'
        />
      </div>

      <ul className={shareTourAppListClassName} role='list'>
        {shareChannels.map((channel) => (
          <li key={channel.id} className='min-w-0'>
            <ShareAppTile
              channel={channel}
              feedbackLabel={
                channelFeedback?.id === channel.id ?
                  channelFeedback.label
                : null
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareLinkPreview({
  shareUrl,
  message,
  previewImageUrl,
}: {
  shareUrl: string;
  message: ShareMessage;
  previewImageUrl?: string;
}) {
  const tourTitle = message.tourTitle?.trim() || '';
  const previewTitle = message.sceneTitle?.trim() || message.title;
  const eyebrow = tourTitle || resolveShareLinkHost(shareUrl) || '';

  return (
    <section
      className={shareTourPreviewSectionClassName}
      aria-label={TOUR_SHARE_PREVIEW_LABEL}
    >
      <h3 className={shareTourPreviewLabelClassName}>
        {TOUR_SHARE_PREVIEW_LABEL}
      </h3>
      <div className={shareTourPreviewCardClassName}>
        <div className={shareTourPreviewImageWrapClassName}>
          {previewImageUrl ?
            <img
              className={shareTourPreviewImageClassName}
              src={previewImageUrl}
              alt=''
              loading='lazy'
              decoding='async'
            />
          : <div
              className={shareTourPreviewPlaceholderClassName}
              aria-hidden='true'
            >
              <MaterialSymbol
                name='image'
                className='leading-none opacity-70'
                sizePx={32}
              />
            </div>
          }
        </div>
        <div className={shareTourPreviewBodyClassName}>
          {eyebrow ?
            <p className={shareTourPreviewHostClassName}>{eyebrow}</p>
          : null}
          <p className={shareTourPreviewTitleClassName}>{previewTitle}</p>
          <p className={shareTourPreviewDescriptionClassName}>{message.text}</p>
        </div>
      </div>
    </section>
  );
}

function ShareAppTile({
  channel,
  feedbackLabel = null,
}: {
  channel: ShareAppChannel;
  feedbackLabel?: string | null;
}) {
  const ariaLabel = channel.ariaLabel ?? channel.label;
  const idleTip = channel.idleTooltip ?? channel.label;
  const tooltipLabel = feedbackLabel ?? idleTip;
  const showFeedbackTip = feedbackLabel !== null;

  const content = (
    <>
      <span
        className={shareTourAppIconVariants({ channel: channel.iconVariant })}
      >
        {channel.icon}
      </span>
      <span className={shareTourAppLabelClassName}>{channel.label}</span>
    </>
  );

  const tile =
    channel.href ?
      (() => {
        const isMailto = channel.href.startsWith('mailto:');

        // Mailto: real navigation. Other share apps: button-only open so we don't
        // double-fire (href + openShareAppLink), which can duplicate compose text
        // in WhatsApp and make the unfurler fall back to Overview (`/t_…` only).
        if (!isMailto) {
          return (
            <button
              type='button'
              className={shareTourAppTileClassName}
              aria-label={ariaLabel}
              onClick={() => {
                const open = channel.openHref ?? openShareAppLink;
                void open(channel.href!);
              }}
            >
              {content}
            </button>
          );
        }

        return (
          <a
            className={shareTourAppTileClassName}
            href={channel.href}
            aria-label={ariaLabel}
          >
            {content}
          </a>
        );
      })()
    : <button
        type='button'
        className={shareTourAppTileClassName}
        onClick={channel.onClick}
        aria-label={ariaLabel}
        disabled={showFeedbackTip}
      >
        {content}
      </button>;

  return (
    <IconTooltip
      label={tooltipLabel}
      placement='top'
      forceShow={showFeedbackTip}
      className='block min-w-0 w-full'
    >
      {tile}
    </IconTooltip>
  );
}
