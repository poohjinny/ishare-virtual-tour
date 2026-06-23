import type { ReactNode } from 'react';
import type { TourOrganization } from '../types/tour';
import { cn } from '../lib/cn';
import {
  addressToGoogleMapsHref,
  getOrganizationPhones,
  hasOrganizationContact,
  phoneToTelHref,
} from '../utils/tourOrganizationContact';
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
  organization?: TourOrganization;
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
  organization,
  logo,
  embedded = false,
}: TourContactInfoProps) {
  if (!hasOrganizationContact(organization)) return null;

  const phones = getOrganizationPhones(organization);
  const faxHref = organization.fax ? phoneToTelHref(organization.fax) : '';

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
          <p className={tourNavContactNameClassName}>{organization.name}</p>
        : null}
      </div>

      <dl className={tourNavContactListClassName}>
        {organization.website ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>Website</dt>
            <dd className={tourNavContactValueClassName}>
              <a
                className={tourNavContactLinkClassName}
                href={organization.website}
                target='_blank'
                rel='noopener noreferrer'
              >
                {formatWebsiteLabel(organization.website)}
              </a>
            </dd>
          </div>
        : null}

        {organization.email ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>Email</dt>
            <dd className={tourNavContactValueClassName}>
              <a
                className={tourNavContactLinkClassName}
                href={`mailto:${organization.email}`}
              >
                {organization.email}
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

        {organization.fax ?
          <div className={tourNavContactItemClassName}>
            <dt className={tourNavContactLabelClassName}>
              {organization.faxLabel ?? 'Fax'}
            </dt>
            <dd className={tourNavContactValueClassName}>
              {faxHref ?
                <a className={tourNavContactLinkClassName} href={faxHref}>
                  {organization.fax}
                </a>
              : organization.fax}
            </dd>
          </div>
        : null}

        {organization.address ?
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
                href={addressToGoogleMapsHref(
                  organization.address,
                  organization.name,
                )}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`Open in Google Maps: ${organization.address}, ${organization.name}`}
              >
                {organization.address}
              </a>
            </dd>
          </div>
        : null}
      </dl>
    </>
  );
}
