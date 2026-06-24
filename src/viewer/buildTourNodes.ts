import type { Tour } from '../types/tour';
import { hotspotToMarkerConfig } from './buildMarkers';

/** VirtualTourPlugin node list from tour JSON. */
export function buildVirtualTourNodes(tour: Tour) {
  return Object.values(tour.scenes).map((scene) => ({
    id: scene.id,
    name: scene.title,
    panorama: scene.panorama,
    links: [],
    markers: scene.hotspots.map(hotspotToMarkerConfig),
  }));
}
