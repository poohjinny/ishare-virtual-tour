import type { ReactNode } from 'react';
import type { TourClient } from '../types/tour';
import { cn } from '../lib/cn';
import {
  addressToGoogleMapsHref,
  getClientPhones,
  hasClientContact,
  phoneToTelHref,
} from '../utils/tourClientContact';
import {
  tourNavContactBrandVariants,
  tourNavContactItemClassName,
  tourNavContactLabelClassName,
  tourNavContactLinkClassName,
  tourNavContactListClassName,
  tourNavContactNameClassName,
  tourNavContactValueAddressClassName,
  tourNavContactValueClassName,
  tourNavHelpDividerClassName,
  tourNavPanelLogoClassName,
} from './tourNavFloatVariants';

interface TourContactInfoProps {
  client?: TourClient;
  logo?: ReactNode;
  /** Skip top divider when rendered inside help accordion. */
  embedded?: boolean;
}

function formatWebsiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

export function TourContactInfo({
  client,
  logo,
  embedded = false,
}: TourContactInfoProps) {
  if (!hasClientContact(client)) return null;

  const phones = getClientPhones(client);
  const faxHref = client.fax ? phoneToTelHref(client.fax) : '';

  return (
    <>
      {!embedded && (
        <hr className={tourNavHelpDividerClassName} aria-hidden='true' />
      )}

      <div className={tourNavContactBrandVariants({ hasLogo: Boolean(logo) })}>
        {logo ?
          <div className={tourNavPanelLogoClassName}>{logo}</div>
        : null}
        {!logo ?
          <p className={tourNavContactNameClassName}>{client.name}</p>
        : null}
      </div>

      <dl className={tourNavContactListClassName}>
        {client.website ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>Website</dt>
            <dd className={tourNavContactValueClassName}>
              <a
                className={tourNavContactLinkClassName}
                href={client.website}
                target='_blank'
                rel='noopener noreferrer'
              >
                {formatWebsiteLabel(client.website)}
              </a>
            </dd>
          </div>
        : null}

        {client.email ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>Email</dt>
            <dd className={tourNavContactValueClassName}>
              <a
                className={tourNavContactLinkClassName}
                href={`mailto:${client.email}`}
              >
                {client.email}
              </a>
            </dd>
          </div>
        : null}

        {phones.map((phone) => (
          <div
            key={`${phone.label}-${phone.number}`}
            className={tourNavContactItemClassName}
          >
            <dt className={tourNavContactLabelClassName}>{phone.label}</dt>
            <dd className={tourNavContactValueClassName}>
              {phone.telHref ?
                <a
                  className={tourNavContactLinkClassName}
                  href={phone.telHref}
                >
                  {phone.number}
                </a>
              : phone.number}
            </dd>
          </div>
        ))}

        {client.fax ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>
              {client.faxLabel ?? 'Fax'}
            </dt>
            <dd className={tourNavContactValueClassName}>
              {faxHref ?
                <a className={tourNavContactLinkClassName} href={faxHref}>
                  {client.fax}
                </a>
              : client.fax}
            </dd>
          </div>
        : null}

        {client.address ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>Address</dt>
            <dd
              className={cn(
                tourNavContactValueClassName,
                tourNavContactValueAddressClassName,
              )}
            >
              <a
                className={tourNavContactLinkClassName}
                href={addressToGoogleMapsHref(client.address, client.name)}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`Open in Google Maps: ${client.address}, ${client.name}`}
              >
                {client.address}
              </a>
            </dd>
          </div>
        : null}
      </dl>
    </>
  );
}
