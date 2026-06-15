import type { ReactNode } from 'react';
import type { TourOrganization } from '../types/tour';
import {
  addressToGoogleMapsHref,
  getOrganizationPhones,
  hasOrganizationContact,
  phoneToTelHref,
} from '../utils/tourOrganizationContact';

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
        <hr className='tour-nav-actions__help-divider' aria-hidden='true' />
      )}

      <div
        className={[
          'tour-nav-actions__contact-brand',
          logo && 'tour-nav-actions__contact-brand--has-logo',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {logo ?
          <div className='tour-nav-actions__panel-logo'>{logo}</div>
        : null}
        {!logo ?
          <p className='tour-nav-actions__contact-name'>{organization.name}</p>
        : null}
      </div>

      <dl className='tour-nav-actions__contact-list'>
        {organization.website ?
          <div className='tour-nav-actions__contact-item'>
            <dt className='tour-nav-actions__contact-label'>Website</dt>
            <dd className='tour-nav-actions__contact-value'>
              <a
                className='tour-nav-actions__contact-link'
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
          <div className='tour-nav-actions__contact-item'>
            <dt className='tour-nav-actions__contact-label'>Email</dt>
            <dd className='tour-nav-actions__contact-value'>
              <a
                className='tour-nav-actions__contact-link'
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
            className='tour-nav-actions__contact-item'
          >
            <dt className='tour-nav-actions__contact-label'>{phone.label}</dt>
            <dd className='tour-nav-actions__contact-value'>
              {phone.telHref ?
                <a
                  className='tour-nav-actions__contact-link'
                  href={phone.telHref}
                >
                  {phone.number}
                </a>
              : phone.number}
            </dd>
          </div>
        ))}

        {organization.fax ?
          <div className='tour-nav-actions__contact-item'>
            <dt className='tour-nav-actions__contact-label'>
              {organization.faxLabel ?? 'Fax'}
            </dt>
            <dd className='tour-nav-actions__contact-value'>
              {faxHref ?
                <a className='tour-nav-actions__contact-link' href={faxHref}>
                  {organization.fax}
                </a>
              : organization.fax}
            </dd>
          </div>
        : null}

        {organization.address ?
          <div className='tour-nav-actions__contact-item'>
            <dt className='tour-nav-actions__contact-label'>Address</dt>
            <dd className='tour-nav-actions__contact-value tour-nav-actions__contact-value--address'>
              <a
                className='tour-nav-actions__contact-link'
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
