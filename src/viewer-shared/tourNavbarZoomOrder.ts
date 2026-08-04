/**
 * Shared tour navbar zoom control order — PSV registers the `zoom` group as
 * zoomOut → zoomRange → zoomIn. Keep 2D + 3D identical.
 */
export const TOUR_NAVBAR_ZOOM_BUTTON_IDS = [
  'zoomOut',
  'zoomRange',
  'zoomIn',
] as const;

export type TourNavbarZoomButtonId =
  (typeof TOUR_NAVBAR_ZOOM_BUTTON_IDS)[number];
