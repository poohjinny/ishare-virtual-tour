import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import {
  TOUR_SHARE_APPS_HEADING,
  TOUR_SHARE_COPY_FAILED,
  TOUR_SHARE_COPY_LABEL,
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_EMAIL_LABEL,
  TOUR_SHARE_FACEBOOK_LABEL,
  TOUR_SHARE_INSTAGRAM_ARIA,
  TOUR_SHARE_INSTAGRAM_LABEL,
  TOUR_SHARE_LEAD,
  TOUR_SHARE_LINKEDIN_LABEL,
  TOUR_SHARE_NATIVE_LABEL,
  TOUR_SHARE_PREVIEW_LABEL,
  TOUR_SHARE_URL_LABEL,
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
  buildShareWhatsAppUrl,
  buildShareXUrl,
  buildNativeShareData,
  openShareAppLink,
  resolveShareLinkHost,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import { ensureShareOgImage } from '../utils/ensureShareOgImage';
import { ShareIcon } from './icons/ShareIcon';
import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import type { NamingStatusModifier } from './ui/Badge';
import { namingOpportunityStatusShowsBadge } from '../data/namingOpportunityStatus';
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
import { aiFabBubblePlaceDotClassName } from './ai/aiAssistantVariants';
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
  shareTourPreviewPriceClassName,
  shareTourPreviewSectionClassName,
  shareTourPreviewTitleClassName,
  shareTourPreviewTitleLineClassName,
  shareTourPreviewTitleTrailingClassName,
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
  iconVariant: ShareAppIconVariant;
  icon: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  /** Prefer over default `openShareAppLink` so share can warm OG first. */
  openHref?: (href: string) => void | Promise<void>;
}

export function ShareTourPanel({
  contextLabel,
  shareUrl,
  message,
  previewImageUrl,
}: ShareTourPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [channelFeedback, setChannelFeedback] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const showNativeShare = shouldPreferNativeShare();

  useEffect(() => {
    void ensureShareOgImage(shareUrl);
  }, [shareUrl]);

  const handleCopy = useCallback(async () => {
    await ensureShareOgImage(shareUrl);
    const ok = await copyToClipboard(shareUrl);
    setCopyState(ok ? 'copied' : 'failed');
    window.setTimeout(() => setCopyState('idle'), 2400);
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!canUseNativeShare()) return;

    await ensureShareOgImage(shareUrl);
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
    await ensureShareOgImage(shareUrl);
    const ok = await copyToClipboard(shareUrl);
    setChannelFeedback({
      id: 'instagram',
      label: ok ? TOUR_SHARE_COPIED_LABEL : TOUR_SHARE_COPY_FAILED,
    });
    window.setTimeout(() => setChannelFeedback(null), 2400);
  }, [shareUrl]);

  const handleExternalChannelOpen = useCallback(
    async (href: string) => {
      await ensureShareOgImage(shareUrl);
      openShareAppLink(href);
    },
    [shareUrl],
  );

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
        openHref: handleExternalChannelOpen,
      },
      {
        id: 'whatsapp',
        label: TOUR_SHARE_WHATSAPP_LABEL,
        iconVariant: 'whatsapp',
        icon: <WhatsAppBrandIcon />,
        href: buildShareWhatsAppUrl(shareUrl, message),
        external: true,
        openHref: handleExternalChannelOpen,
      },
      {
        id: 'instagram',
        label: TOUR_SHARE_INSTAGRAM_LABEL,
        ariaLabel: TOUR_SHARE_INSTAGRAM_ARIA,
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
        openHref: handleExternalChannelOpen,
      },
      {
        id: 'x',
        label: TOUR_SHARE_X_LABEL,
        iconVariant: 'x',
        icon: <XBrandIcon />,
        href: buildShareXUrl(shareUrl, message),
        external: true,
        openHref: handleExternalChannelOpen,
      },
      {
        id: 'linkedin',
        label: TOUR_SHARE_LINKEDIN_LABEL,
        iconVariant: 'linkedin',
        icon: <LinkedInBrandIcon />,
        href: buildShareLinkedInUrl(shareUrl),
        external: true,
        openHref: handleExternalChannelOpen,
      },
    );

    return channels;
  }, [
    handleExternalChannelOpen,
    handleInstagramShare,
    handleNativeShare,
    message,
    shareUrl,
    showNativeShare,
  ]);

  return (
    <div className={shareTourPanelRootClassName}>
      <p className={shareTourPanelLeadClassName}>
        {TOUR_SHARE_LEAD}:{' '}
        <strong className='inline-flex items-center gap-1 align-middle leading-relaxed whitespace-nowrap'>
          <span className={aiFabBubblePlaceDotClassName} aria-hidden='true' />
          {contextLabel}
        </strong>
        .
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
  const linkHost = useMemo(() => resolveShareLinkHost(shareUrl), [shareUrl]);
  const priceLabel = message.priceLabel?.trim() || '';
  const showStatusBadge = namingOpportunityStatusShowsBadge(
    message.status ?? message.statusModifier ?? undefined,
  );

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
          {linkHost ?
            <p className={shareTourPreviewHostClassName}>{linkHost}</p>
          : null}
          <div className={shareTourPreviewTitleLineClassName}>
            <p className={shareTourPreviewTitleClassName}>{message.title}</p>
            {showStatusBadge || priceLabel ?
              <div className={shareTourPreviewTitleTrailingClassName}>
                {showStatusBadge ?
                  <NamingStatusBadge
                    status={message.status ?? undefined}
                    statusModifier={
                      (message.statusModifier as NamingStatusModifier | null) ??
                      undefined
                    }
                    label={message.statusLabel ?? undefined}
                    compact
                  />
                : null}
                {priceLabel ?
                  <p className={shareTourPreviewPriceClassName}>{priceLabel}</p>
                : null}
              </div>
            : null}
          </div>
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
  const displayLabel = feedbackLabel ?? channel.label;
  const ariaLabel = channel.ariaLabel ?? channel.label;

  const content = (
    <>
      <span
        className={shareTourAppIconVariants({ channel: channel.iconVariant })}
      >
        {channel.icon}
      </span>
      <span
        className={cn(
          shareTourAppLabelClassName,
          feedbackLabel && 'text-primary',
        )}
      >
        {displayLabel}
      </span>
    </>
  );

  if (channel.href) {
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
  }

  return (
    <button
      type='button'
      className={shareTourAppTileClassName}
      onClick={channel.onClick}
      aria-label={ariaLabel}
      disabled={feedbackLabel !== null}
    >
      {content}
    </button>
  );
}
