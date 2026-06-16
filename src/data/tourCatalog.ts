import catalogJson from '../../tours/catalog.json';
import {
  TOUR_CATEGORIES,
  type TourCategory,
} from '../constants/tourCategories';

export interface CatalogTourEntry {
  id: string;
  category: TourCategory;
  name: string;
}

export interface CatalogClient {
  id: string;
  name: string;
  tours: CatalogTourEntry[];
}

interface TourCatalogFile {
  categories: TourCategory[];
  clients: CatalogClient[];
}

const catalog = catalogJson as TourCatalogFile;

export function listTourCategories(): readonly TourCategory[] {
  return catalog.categories.length > 0 ? catalog.categories : TOUR_CATEGORIES;
}

export function listCatalogClients(): CatalogClient[] {
  return catalog.clients;
}

export interface CatalogTourListItem {
  tourId: string;
  clientId: string;
  clientName: string;
  category: TourCategory;
  tourName: string;
}

export function listCatalogTours(): CatalogTourListItem[] {
  return catalog.clients.flatMap((client) =>
    client.tours.map((tour) => ({
      tourId: tour.id,
      clientId: client.id,
      clientName: client.name,
      category: tour.category,
      tourName: tour.name,
    })),
  );
}

export function listCatalogToursByCategory(): Array<{
  category: TourCategory;
  tours: CatalogTourListItem[];
}> {
  return listTourCategories()
    .map((category) => ({
      category,
      tours: listCatalogTours().filter((tour) => tour.category === category),
    }))
    .filter((group) => group.tours.length > 0);
}
