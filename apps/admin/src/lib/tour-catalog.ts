import { clientLogoUrl } from '@/lib/admin-media';

import catalog from '../../../tour-viewer/tours/catalog.json';

export type TourVisibility = 'public' | 'unlisted' | 'internal';

export interface AdminTourSummary {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  category: string;
  visibility: TourVisibility;
  summary: string;
}

export const adminTourCategories = catalog.categories as string[];

export interface AdminClientPhone {
  number: string;
  label: string;
}

export interface AdminClientSummary {
  id: string;
  name: string;
  website?: string;
  email?: string;
  address?: string;
  phones: AdminClientPhone[];
  fax?: AdminClientPhone;
  brandColor?: string;
  logoAlt?: string;
  fontFamily?: string;
  fontSourceUrl?: string;
  /** Tour product license. Omit in catalog.json = licensed (local stand-in for Ops). */
  licensed: boolean;
  tours: AdminTourSummary[];
}

/**
 * catalog.json clients mix two phone shapes (`phone` + `phoneLabel` vs
 * `phones[]`), and most contact fields are optional. This raw type covers the
 * superset so we can normalize into AdminClientSummary.
 */
interface CatalogClient {
  id: string;
  name: string;
  licensed?: boolean;
  website?: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  phones?: Array<{ number: string; label?: string }>;
  fax?: string;
  faxLabel?: string;
  address?: string;
  branding?: {
    logoAlt?: string;
    primaryColor?: string;
    fontFamily?: string;
    fontSourceUrl?: string;
  };
  tours: Array<{
    id: string;
    name: string;
    category: string;
    visibility: string;
    summary?: string;
  }>;
}

const catalogClients = catalog.clients as CatalogClient[];

function normalizePhones(client: CatalogClient): AdminClientPhone[] {
  if (client.phones) {
    return client.phones.map((phone) => ({
      number: phone.number,
      label: phone.label ?? 'Telephone',
    }));
  }
  if (client.phone) {
    return [{ number: client.phone, label: client.phoneLabel ?? 'Telephone' }];
  }
  return [];
}

export const adminClientCatalog: AdminClientSummary[] = catalogClients.map(
  (client) => ({
    id: client.id,
    name: client.name,
    website: client.website,
    email: client.email,
    address: client.address,
    phones: normalizePhones(client),
    fax:
      client.fax ?
        { number: client.fax, label: client.faxLabel ?? 'Fax' }
      : undefined,
    brandColor: client.branding?.primaryColor,
    logoAlt: client.branding?.logoAlt,
    fontFamily: client.branding?.fontFamily,
    fontSourceUrl: client.branding?.fontSourceUrl,
    licensed: client.licensed !== false,
    tours: client.tours.map((tour) => ({
      id: tour.id,
      name: tour.name,
      clientId: client.id,
      clientName: client.name,
      category: tour.category,
      visibility: tour.visibility as TourVisibility,
      summary: tour.summary ?? '',
    })),
  }),
);

export const adminTourCatalog: AdminTourSummary[] = adminClientCatalog.flatMap(
  (client) => client.tours,
);

export const adminCatalogStats = {
  clients: adminClientCatalog.length,
  tours: adminTourCatalog.length,
  licensedClients: adminClientCatalog.filter((client) => client.licensed)
    .length,
  publicTours: adminTourCatalog.filter((tour) => tour.visibility === 'public')
    .length,
};

export function getAdminTour(tourId: string) {
  return adminTourCatalog.find((tour) => tour.id === tourId);
}

export function getAdminClient(clientId: string) {
  return adminClientCatalog.find((client) => client.id === clientId);
}

export function adminClientCrumbPeers(
  clientId: string,
  hrefTemplate = '/clients/{id}',
) {
  return {
    value: clientId,
    label: 'Switch client',
    hrefTemplate,
    imageFit: 'contain' as const,
    options: adminClientCatalog.map((item) => ({
      value: item.id,
      label: item.name,
      image: clientLogoUrl(item.id),
    })),
  };
}
