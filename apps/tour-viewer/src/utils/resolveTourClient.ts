import type { ClientPhone, Tour, TourClient } from '../types/tour';
import { findCatalogClient, type CatalogClient } from '../data/tourCatalog';
import { getTourClientId } from './tourClientId';

type TourWithLegacyClient = Tour & {
  client?: TourClient;
  organization?: TourClient;
  url?: string;
};

export function catalogClientToTourClient(
  catalogClient: CatalogClient,
): TourClient {
  return {
    name: catalogClient.name,
    website: catalogClient.website?.trim() || 'https://example.com',
    email: catalogClient.email,
    phone: catalogClient.phone,
    phoneLabel: catalogClient.phoneLabel,
    phones: catalogClient.phones,
    fax: catalogClient.fax,
    faxLabel: catalogClient.faxLabel,
    address: catalogClient.address,
  };
}

/** Contact + identity for a tour — resolved from catalog (`clientId`), not tour JSON. */
export function resolveTourClient(tour: Tour): TourClient | undefined {
  const catalogClient = findCatalogClient(getTourClientId(tour));
  if (catalogClient) {
    return catalogClientToTourClient(catalogClient);
  }

  const legacy = tour as TourWithLegacyClient;
  return legacy.client ?? legacy.organization;
}

export function getTourWebsite(tour: Tour): string {
  return (
    resolveTourClient(tour)?.website ??
    (tour as TourWithLegacyClient).url ??
    'https://example.com'
  );
}

export type CatalogClientContactPatch = {
  name?: string;
  website?: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  phones?: ClientPhone[];
  fax?: string;
  faxLabel?: string;
  address?: string;
};
