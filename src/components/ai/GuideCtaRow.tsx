import type {
  ChatGuideCta,
  ChatGuideCtaKind,
  TourClient,
} from '../../types/tour';
import { cn } from '../../lib/cn';
import {
  addressToGoogleMapsHref,
  getClientPhones,
  hasClientContact,
  phoneToTelHref,
} from '../../utils/tourClientContact';
import { isMailtoCtaUrl, openCtaUrl } from '../../utils/popupCtaPlacement';
import {
  aiGuideContactFieldsClassName,
  aiGuideContactInfoClassName,
  aiGuideContactItemClassName,
  aiGuideContactLabelClassName,
  aiGuideContactLinkClassName,
  aiGuideContactLogoClassName,
  aiGuideContactValueClassName,
  aiGuideContactValueAddressClassName,
  aiGuideCtaActionsColsClassName,
  aiGuideCtaClassName,
  aiGuideCtaCompactClassName,
  aiGuideCtaCompactPrimaryClassName,
  aiGuideCtaPrimaryClassName,
  aiGuideCtaRowClassName,
} from './aiAssistantVariants';

const MAX_VISIBLE_CTAS = 3;

const CHROME_CTA_KINDS = new Set<ChatGuideCtaKind>([
  'open-help',
  'open-explore',
  'open-ask-guide',
]);

function isChromeCta(cta: ChatGuideCta): boolean {
  return CHROME_CTA_KINDS.has(cta.kind);
}

interface GuideCtaRowProps {
  ctas: ChatGuideCta[];
  client?: TourClient;
  clientLogo?: string;
  logoAlt?: string;
  className?: string;
  /** `card` = match single-card width; `stretch` = fill parent (grid cell). */
  align?: 'card' | 'stretch';
  /** Catalog contact block — off when CTAs sit under a naming card. */
  showContactInfo?: boolean;
  /** Stack actions vertically (under naming cards). */
  stack?: boolean;
  /** In-app chrome actions (Help / Explore / Ask Guide). */
  onChromeAction?: (kind: ChatGuideCtaKind) => void;
}

function preferContactThenDonate(ctas: ChatGuideCta[]): ChatGuideCta[] {
  const contact = ctas.find((cta) => cta.kind === 'contact');
  const donate = ctas.find((cta) => cta.kind === 'donate');
  const preferred = [contact, donate].filter((cta): cta is ChatGuideCta =>
    Boolean(cta),
  );
  if (preferred.length > 0) {
    const rest = ctas.filter(
      (cta) => cta.kind !== 'contact' && cta.kind !== 'donate',
    );
    return [...preferred, ...rest].slice(0, MAX_VISIBLE_CTAS);
  }
  return ctas.slice(0, MAX_VISIBLE_CTAS);
}

function actionCtas(
  ctas: ChatGuideCta[],
  showInfo: boolean,
  client?: TourClient,
): ChatGuideCta[] {
  const preferred = preferContactThenDonate(ctas);
  if (!showInfo) return preferred;

  const clientMailto =
    client?.email?.trim() ? `mailto:${client.email.trim()}` : '';

  return preferred.filter((cta) => {
    if (cta.kind === 'website') return false;
    // Catalog Email is already in the contact info block.
    if (cta.kind === 'contact' && cta.id === 'contact:client') return false;
    // Keep naming “Express interest” (prefilled subject/body) even when
    // the org email is already listed above.
    if (
      cta.kind === 'contact' &&
      cta.id.startsWith('contact:') &&
      cta.id !== 'contact:client'
    ) {
      return true;
    }
    if (
      cta.kind === 'contact' &&
      clientMailto &&
      cta.url &&
      cta.url === clientMailto
    ) {
      return false;
    }
    return true;
  });
}

function formatWebsiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function shouldShowContactInfo(ctas: ChatGuideCta[]): boolean {
  return ctas.some((cta) => cta.kind === 'contact' || cta.kind === 'website');
}

export function GuideCtaRow({
  ctas,
  client,
  clientLogo,
  logoAlt,
  className,
  align = 'card',
  showContactInfo = true,
  stack = false,
  onChromeAction,
}: GuideCtaRowProps) {
  const showInfo =
    showContactInfo &&
    shouldShowContactInfo(ctas) &&
    hasClientContact(client) &&
    client;
  const visible = actionCtas(ctas, Boolean(showInfo), client);
  const phones = showInfo ? getClientPhones(client) : [];
  const logoSrc = clientLogo?.trim() || '';
  const faxHref = showInfo && client.fax ? phoneToTelHref(client.fax) : '';
  const address = showInfo ? client.address?.trim() || '' : '';
  const mapsHref =
    address ? addressToGoogleMapsHref(address, client?.name) : '';

  if (visible.length === 0 && !showInfo) return null;

  const chromeOnly = visible.length > 0 && visible.every(isChromeCta);

  return (
    <div
      className={cn(
        aiGuideCtaRowClassName,
        (visible.length > 1 || align === 'stretch') && 'w-full self-stretch',
        className,
      )}
    >
      {showInfo ?
        <div className={aiGuideContactInfoClassName}>
          {logoSrc ?
            <img
              className={aiGuideContactLogoClassName}
              src={logoSrc}
              alt={logoAlt?.trim() || client.name || ''}
            />
          : null}
          <dl className={aiGuideContactFieldsClassName}>
            {!logoSrc && client.name ?
              <div className={aiGuideContactItemClassName}>
                <dt className={aiGuideContactLabelClassName}>Organization: </dt>
                <dd className={aiGuideContactValueClassName}>{client.name}</dd>
              </div>
            : null}
            {client.email ?
              <div className={aiGuideContactItemClassName}>
                <dt className={aiGuideContactLabelClassName}>Email: </dt>
                <dd className={aiGuideContactValueClassName}>
                  <a
                    className={aiGuideContactLinkClassName}
                    href={`mailto:${client.email}`}
                    onClick={(event) => {
                      event.preventDefault();
                      openCtaUrl(`mailto:${client.email}`);
                    }}
                  >
                    {client.email}
                  </a>
                </dd>
              </div>
            : null}
            {phones.map((phone) => (
              <div
                key={`${phone.label}-${phone.number}`}
                className={aiGuideContactItemClassName}
              >
                <dt className={aiGuideContactLabelClassName}>
                  {phone.label}:{' '}
                </dt>
                <dd className={aiGuideContactValueClassName}>
                  {phone.telHref ?
                    <a
                      className={aiGuideContactLinkClassName}
                      href={phone.telHref}
                    >
                      {phone.number}
                    </a>
                  : phone.number}
                </dd>
              </div>
            ))}
            {client.fax ?
              <div className={aiGuideContactItemClassName}>
                <dt className={aiGuideContactLabelClassName}>
                  {client.faxLabel?.trim() || 'Fax'}:{' '}
                </dt>
                <dd className={aiGuideContactValueClassName}>
                  {faxHref ?
                    <a className={aiGuideContactLinkClassName} href={faxHref}>
                      {client.fax}
                    </a>
                  : client.fax}
                </dd>
              </div>
            : null}
            {address ?
              <div className={aiGuideContactItemClassName}>
                <dt className={aiGuideContactLabelClassName}>Address: </dt>
                <dd
                  className={cn(
                    aiGuideContactValueClassName,
                    aiGuideContactValueAddressClassName,
                  )}
                >
                  {mapsHref ?
                    <a
                      className={aiGuideContactLinkClassName}
                      href={mapsHref}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`Open in Google Maps: ${address}${
                        client.name ? `, ${client.name}` : ''
                      }`}
                    >
                      {address}
                    </a>
                  : address}
                </dd>
              </div>
            : null}
            {client.website && client.website !== 'https://example.com' ?
              <div className={aiGuideContactItemClassName}>
                <dt className={aiGuideContactLabelClassName}>Website: </dt>
                <dd className={aiGuideContactValueClassName}>
                  <a
                    className={aiGuideContactLinkClassName}
                    href={client.website}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {formatWebsiteLabel(client.website)}
                  </a>
                </dd>
              </div>
            : null}
          </dl>
        </div>
      : null}
      {visible.length > 0 ?
        <div
          className={cn(
            'grid',
            stack ? 'gap-1.5' : 'gap-2',
            aiGuideCtaActionsColsClassName(
              visible.length,
              align,
              stack,
              chromeOnly,
            ),
          )}
        >
          {visible.map((cta, index) => {
            const chrome = isChromeCta(cta);
            const href = cta.url?.trim() || '';
            const isMailto = Boolean(href) && isMailtoCtaUrl(href);
            // Naming stack: one quiet primary + secondary peers (avoid all-theme clash).
            const isPrimary =
              stack ?
                index === 0
              : cta.kind === 'donate' ||
                cta.kind === 'contact' ||
                cta.kind === 'open-help';
            const className =
              stack ?
                isPrimary ? aiGuideCtaCompactPrimaryClassName
                : aiGuideCtaCompactClassName
              : isPrimary ? aiGuideCtaPrimaryClassName
              : aiGuideCtaClassName;

            if (chrome) {
              return (
                <button
                  key={cta.id}
                  type='button'
                  className={className}
                  onClick={() => onChromeAction?.(cta.kind)}
                >
                  {cta.label}
                </button>
              );
            }

            if (!href) return null;

            return (
              <a
                key={cta.id}
                href={href}
                className={className}
                {...(isMailto ?
                  {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
                onClick={(event) => {
                  if (!isMailto) return;
                  event.preventDefault();
                  openCtaUrl(href);
                }}
              >
                {cta.label}
              </a>
            );
          })}
        </div>
      : null}
    </div>
  );
}
