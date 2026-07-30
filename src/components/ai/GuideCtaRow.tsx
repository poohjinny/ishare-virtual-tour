import type { ChatGuideCta, TourClient } from '../../types/tour';
import { cn } from '../../lib/cn';
import {
  getClientPhones,
  hasClientContact,
} from '../../utils/tourClientContact';
import { isMailtoCtaUrl, openCtaUrl } from '../../utils/popupCtaPlacement';
import {
  aiGuideContactInfoClassName,
  aiGuideContactItemClassName,
  aiGuideContactLabelClassName,
  aiGuideContactLinkClassName,
  aiGuideContactLogoClassName,
  aiGuideContactValueClassName,
  aiGuideCtaActionsColsClassName,
  aiGuideCtaClassName,
  aiGuideCtaCompactClassName,
  aiGuideCtaCompactPrimaryClassName,
  aiGuideCtaPrimaryClassName,
  aiGuideCtaRowClassName,
} from './aiAssistantVariants';

const MAX_VISIBLE_CTAS = 3;

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
    // Keep naming “Express your interest” (prefilled subject/body) even when
    // the org email is already listed above.
    if (
      cta.kind === 'contact' &&
      cta.id.startsWith('contact:') &&
      cta.id !== 'contact:client'
    ) {
      return true;
    }
    if (cta.kind === 'contact' && clientMailto && cta.url === clientMailto) {
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
}: GuideCtaRowProps) {
  const showInfo =
    showContactInfo &&
    shouldShowContactInfo(ctas) &&
    hasClientContact(client) &&
    client;
  const visible = actionCtas(ctas, Boolean(showInfo), client);
  const phones = showInfo ? getClientPhones(client) : [];
  const logoSrc = clientLogo?.trim() || '';

  if (visible.length === 0 && !showInfo) return null;

  return (
    <div
      className={cn(
        aiGuideCtaRowClassName,
        (visible.length > 1 || align === 'stretch') && 'w-full self-stretch',
        className,
      )}
    >
      {showInfo ?
        <dl className={aiGuideContactInfoClassName}>
          {logoSrc ?
            <div className={aiGuideContactItemClassName}>
              <dt className='sr-only'>Organization</dt>
              <dd className='m-0'>
                <img
                  className={aiGuideContactLogoClassName}
                  src={logoSrc}
                  alt={logoAlt?.trim() || client.name || ''}
                />
              </dd>
            </div>
          : client.name ?
            <div className={aiGuideContactItemClassName}>
              <dt className={aiGuideContactLabelClassName}>Organization</dt>
              <dd className={aiGuideContactValueClassName}>{client.name}</dd>
            </div>
          : null}
          {client.email ?
            <div className={aiGuideContactItemClassName}>
              <dt className={aiGuideContactLabelClassName}>Email</dt>
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
              <dt className={aiGuideContactLabelClassName}>{phone.label}</dt>
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
          {client.website && client.website !== 'https://example.com' ?
            <div className={aiGuideContactItemClassName}>
              <dt className={aiGuideContactLabelClassName}>Website</dt>
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
      : null}
      {visible.length > 0 ?
        <div
          className={cn(
            'grid',
            stack ? 'gap-1.5' : 'gap-2',
            aiGuideCtaActionsColsClassName(visible.length, align, stack),
          )}
        >
          {visible.map((cta, index) => {
            const isMailto = isMailtoCtaUrl(cta.url);
            // Naming stack: one quiet primary + secondary peers (avoid all-theme clash).
            const isPrimary =
              stack ?
                index === 0
              : cta.kind === 'donate' || cta.kind === 'contact';
            const className =
              stack ?
                isPrimary ? aiGuideCtaCompactPrimaryClassName
                : aiGuideCtaCompactClassName
              : isPrimary ? aiGuideCtaPrimaryClassName
              : aiGuideCtaClassName;
            return (
              <a
                key={cta.id}
                href={cta.url}
                className={className}
                {...(isMailto ?
                  {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
                onClick={(event) => {
                  if (!isMailto) return;
                  event.preventDefault();
                  openCtaUrl(cta.url);
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
