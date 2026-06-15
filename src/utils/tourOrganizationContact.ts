import type { TourOrganization } from '../types/tour';

export interface OrganizationPhoneEntry {
  label: string;
  number: string;
  telHref: string;
}

export function phoneToTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

/** Google Maps search URL for an organization address. */
export function addressToGoogleMapsHref(
  address: string,
  organizationName?: string,
): string {
  const trimmedAddress = address.trim();
  const trimmedName = organizationName?.trim() ?? '';
  const query =
    trimmedName && trimmedAddress ?
      `${trimmedAddress}, ${trimmedName}`
    : trimmedAddress || trimmedName;

  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getOrganizationPhones(
  organization: TourOrganization,
): OrganizationPhoneEntry[] {
  if (organization.phones?.length) {
    return organization.phones.map((entry) => ({
      label: entry.label ?? 'Phone',
      number: entry.number,
      telHref: phoneToTelHref(entry.number),
    }));
  }

  if (organization.phone) {
    return [
      {
        label: organization.phoneLabel ?? 'Phone',
        number: organization.phone,
        telHref: phoneToTelHref(organization.phone),
      },
    ];
  }

  return [];
}

export function hasOrganizationContact(
  organization?: TourOrganization,
): organization is TourOrganization {
  if (!organization) return false;

  return Boolean(
    organization.website ||
    organization.email ||
    organization.phone ||
    organization.phones?.length ||
    organization.fax ||
    organization.address,
  );
}
