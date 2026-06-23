import type { Tour, TourKnowledge } from '../types/tour';
import type { PublishedTourBundle } from '../types/publishedTour';
import type { CatalogTourListItem } from '../data/tourCatalog';
import { normalizeTourAssets } from './normalizeTourAssets';

export class ApiTourRepository {
  constructor(private readonly baseUrl: string) {}

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async loadPublishedTour(tourId: string): Promise<PublishedTourBundle> {
    const response = await fetch(
      this.url(`/v1/tours/${encodeURIComponent(tourId)}`),
    );
    if (!response.ok) {
      throw new Error(
        `Failed to load tour "${tourId}" (${response.status} ${response.statusText})`,
      );
    }

    const bundle = (await response.json()) as PublishedTourBundle;
    return { ...bundle, tour: normalizeTourAssets(bundle.tour) };
  }

  async loadTour(tourId: string): Promise<Tour> {
    return (await this.loadPublishedTour(tourId)).tour;
  }

  async loadKnowledge(tourId: string): Promise<TourKnowledge> {
    const response = await fetch(
      this.url(`/v1/tours/${encodeURIComponent(tourId)}/knowledge`),
    );
    if (!response.ok) {
      throw new Error(
        `Failed to load knowledge for "${tourId}" (${response.status} ${response.statusText})`,
      );
    }
    return (await response.json()) as TourKnowledge;
  }

  async loadCatalog(): Promise<CatalogTourListItem[]> {
    const response = await fetch(this.url('/v1/catalog'));
    if (!response.ok) {
      throw new Error(
        `Failed to load catalog (${response.status} ${response.statusText})`,
      );
    }
    return (await response.json()) as CatalogTourListItem[];
  }
}
