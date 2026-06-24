import { useCallback, useMemo, useState, type ReactNode } from 'react';
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
  TOUR_SHARE_URL_LABEL,
  TOUR_SHARE_WHATSAPP_LABEL,
  TOUR_SHARE_X_LABEL,
  canUseNativeShare,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import {
  buildShareFacebookUrl,
  buildShareLinkedInUrl,
  buildShareMailtoUrl,
  buildShareWhatsAppUrl,
  buildShareXUrl,
} from '../utils/buildShareUrl';
import { copyToClipboard } from '../utils/clipboard';
import { ShareIcon } from './icons/ShareIcon';
import { IconTooltip } from './ui/IconTooltip';
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
  shareTourAppTileClassName,
  shareTourCopyButtonVariants,
  shareTourPanelDividerClassName,
  shareTourPanelDividerLabelClassName,
  shareTourPanelDividerLineClassName,
  shareTourPanelLeadClassName,
  shareTourPanelRootClassName,
  shareTourPanelUrlFieldClassName,
  shareTourPanelUrlInputClassName,
  shareTourPanelUrlRowClassName,
} from './shareTourPanelVariants';

interface ShareTourPanelProps {
  contextLabel: string;
  shareUrl: string;
  message: ShareMessage;
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
}

export function ShareTourPanel({
  contextLabel,
  shareUrl,
  message,
}: ShareTourPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [channelFeedback, setChannelFeedback] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const showNativeShare = canUseNativeShare();

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    setCopyState(ok ? 'copied' : 'failed');
    window.setTimeout(() => setCopyState('idle'), 2400);
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!canUseNativeShare()) return;

    try {
      await navigator.share({
        title: message.title,
        text: message.text,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }, [message.text, message.title, shareUrl]);

  const handleInstagramShare = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    setChannelFeedback({
      id: 'instagram',
      label: ok ? TOUR_SHARE_COPIED_LABEL : TOUR_SHARE_COPY_FAILED,
    });
    window.setTimeout(() => setChannelFeedback(null), 2400);
  }, [shareUrl]);

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
          <ShareIcon className='share-tour-panel__share-icon size-[18px]' />
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
        href: buildShareMailtoUrl(shareUrl, message),
      },
      {
        id: 'whatsapp',
        label: TOUR_SHARE_WHATSAPP_LABEL,
        iconVariant: 'whatsapp',
        icon: <WhatsAppBrandIcon />,
        href: buildShareWhatsAppUrl(shareUrl, message),
        external: true,
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
        iconVariant: 'linkedin',
        icon: <LinkedInBrandIcon />,
        href: buildShareLinkedInUrl(shareUrl),
        external: true,
      },
    );

    return channels;
  }, [
    handleInstagramShare,
    handleNativeShare,
    message,
    shareUrl,
    showNativeShare,
  ]);

  return (
    <div className={shareTourPanelRootClassName}>
      <p className={shareTourPanelLeadClassName}>
        {TOUR_SHARE_LEAD}: <strong>{contextLabel}</strong>.
      </p>

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
                <CopyCheckIcon />
              : <CopyIcon />}
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

      <ul
        className='m-0 flex list-none flex-wrap gap-x-3.5 gap-y-3 p-0'
        role='list'
      >
        {shareChannels.map((channel) => (
          <li key={channel.id}>
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
    return (
      <a
        className={shareTourAppTileClassName}
        href={channel.href}
        aria-label={ariaLabel}
        {...(channel.external ?
          { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
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

function CopyIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <rect
        x='9'
        y='9'
        width='11'
        height='11'
        rx='2'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <path
        d='M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function CopyCheckIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path
        d='M7 12.5 10.5 16 17 9'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
