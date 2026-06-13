import type { TourOrganization } from '../types/tour';
import {
  getOrganizationPhones,
  hasOrganizationContact,
  phoneToTelHref,
} from '../utils/tourOrganizationContact';

interface TourContactInfoProps {
  organization?: TourOrganization;
}

function formatWebsiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

export function TourContactInfo({ organization }: TourContactInfoProps) {
  if (!hasOrganizationContact(organization)) return null;

  const phones = getOrganizationPhones(organization);
  const faxHref = organization.fax ? phoneToTelHref(organization.fax) : '';

  return (
    <>
      <hr className='tour-nav-actions__help-divider' aria-hidden='true' />

      <p className='tour-nav-actions__section-title'>
        Contact {organization.name}
      </p>

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
              {organization.address}
            </dd>
          </div>
        : null}
      </dl>
    </>
  );
}
