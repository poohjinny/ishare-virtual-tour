import type { TourClient } from '../types/tour';

export interface ClientPhoneEntry {
  label: string;
  number: string;
  telHref: string;
}

export function phoneToTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

/** Google Maps search URL for a client address. */
export function addressToGoogleMapsHref(
  address: string,
  clientName?: string,
): string {
  const trimmedAddress = address.trim();
  const trimmedName = clientName?.trim() ?? '';
  const query =
    trimmedName && trimmedAddress ?
      `${trimmedAddress}, ${trimmedName}`
    : trimmedAddress || trimmedName;

  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getClientPhones(client: TourClient): ClientPhoneEntry[] {
  if (client.phones?.length) {
    return client.phones.map((entry) => ({
      label: entry.label ?? 'Phone',
      number: entry.number,
      telHref: phoneToTelHref(entry.number),
    }));
  }

  if (client.phone) {
    return [
      {
        label: client.phoneLabel ?? 'Phone',
        number: client.phone,
        telHref: phoneToTelHref(client.phone),
      },
    ];
  }

  return [];
}

export function hasClientContact(
  client?: TourClient,
): client is TourClient {
  if (!client) return false;

  return Boolean(
    client.website ||
    client.email ||
    client.phone ||
    client.phones?.length ||
    client.fax ||
    client.address,
  );
}
