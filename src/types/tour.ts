export type HotspotType = 'nav' | 'info';

/** Viewer renderer — determines which viewer component loads for the tour. */
export type TourViewerType = 'panorama' | 'model3d';

/** Nav hotspot role — controls marker chrome (dot vs back/home icon). */
export type NavHotspotVariant = 'discover' | 'back' | 'hub';

export interface ViewPosition {
  yaw: number;
  pitch: number;
  zoom?: number;
  /** 3D orbit target (pan offset) — only used by model3d viewer. */
  target?: { x: number; y: number; z: number };
}

/** 3D world-space position for model3d scenes (GLTF / Three.js). */
export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Hotspot position — spherical for panorama scenes, world-space for 3D scenes.
 * Each viewer interprets the relevant coordinate system.
 */
export type HotspotPosition3D = ViewPosition | WorldPosition;

/** Type guard — true when position uses 3D world coordinates. */
export function isWorldPosition(pos: HotspotPosition3D): pos is WorldPosition {
  return 'x' in pos && 'y' in pos && 'z' in pos;
}

export type PopupDisplay = 'modal' | 'anchored';

export type PopupCtaProduct = 'giftabulator';

export interface PopupCta {
  /** Platform product CTA — label/sublabel from product config (e.g. giftabulator) */
  product?: PopupCtaProduct;
  /** Custom label when `product` is omitted */
  label?: string;
  url: string;
  sublabel?: string;
  ariaLabel?: string;
  /** Footer button style — defaults to primary */
  variant?: 'primary' | 'secondary';
  /** Footer icon — set from NO status defaults; URL/label heuristics when omitted */
  iconKind?: 'arrow' | 'mail' | 'bell' | 'external' | 'heart';
}

export type NamingOpportunityStatus = 'open' | 'reserved' | 'soon' | 'closed';

export interface NamingOpportunity {
  /** Full naming opportunity title (e.g. "Reception Desk Naming Opportunity") */
  name: string;
  /** Numeric amount in tour JSON (e.g. 75000) — formatted at display time. */
  price: number;
  priceLabel?: string;
  /** Availability — defaults to `open` when omitted */
  status?: NamingOpportunityStatus;
}

export interface PopupSponsor {
  name: string;
  label?: string;
  logo?: string;
}

export type PopupWidthTier = 'compact' | 'standard' | 'rich' | 'wide';

export interface PopupContent {
  title: string;
  body: string;
  /** modal = screen overlay (default), anchored = HTML marker on panorama */
  display?: PopupDisplay;
  /** Panel width in px, or preset tier. Defaults to dock panel width (440px) when omitted. */
  width?: number | PopupWidthTier;
  namingOpportunity?: NamingOpportunity;
  image?: string;
  videoUrl?: string;
  /** Optional poster for local `videoUrl` (mp4/webm) */
  videoPoster?: string;
  /** Optional Giftabulator URL override (`calc=` prefill) when auto price-based params are not desired */
  cta?: PopupCta;
  /** Full footer CTA override (replaces status defaults) */
  ctas?: PopupCta[];
  sponsor?: PopupSponsor;
  /** Navigate to another scene from the popup footer — depth-safe alternative to nav hotspot. */
  visitScene?: string;
}

export interface Hotspot {
  id: string;
  type: HotspotType;
  position: HotspotPosition3D;
  label?: string;
  targetScene?: string;
  targetView?: ViewPosition;
  popup?: PopupContent;
  /** Skip preview card and navigate immediately (e.g. back links). */
  instant?: boolean;
  /** Nav marker + default UX — discover (dot), back, or hub (firstScene). */
  navVariant?: NavHotspotVariant;
  /** Optional overrides for nav preview card */
  preview?: { image?: string; videoUrl?: string };
  /**
   * For `model3d` tour-level info / naming hotspots — viewpoint scene id.
   * Per-hotspot camera + Explore thumbnail live on `targetView` / `preview.image`.
   */
  sceneId?: string;
}

/** Naming opportunity summary — accordion row in nav preview. */
export interface NavPreviewNamingItem {
  /** Info hotspot id — used to open the naming opportunity in-scene */
  hotspotId: string;
  name: string;
  statusLabel: string;
  statusShortLabel: string;
  statusModifier: string;
  price: number;
  priceLabel?: string;
  /** First paragraph from info popup body */
  description?: string;
  /** model3d — baked preview image for directory cards */
  previewImage?: string;
}

/** Lightweight nav destination preview — shown before scene transition. */
export interface NavPreviewContent {
  targetSceneId: string;
  title: string;
  /** Target scene panorama — used for mini 360 preview */
  panorama?: string;
  /** Static fallback for reduced-motion / load errors — defaults to target panorama */
  image?: string;
  /** Custom preview video — nav `preview.videoUrl`, else target scene `videoUrl` */
  videoUrl?: string;
  description?: string;
  namingItems?: NavPreviewNamingItem[];
  targetView?: ViewPosition;
  /** Hotspot label — used for CTA copy when present */
  ctaLabel?: string;
  /** False when the destination scene is not ready (e.g. same scene as current). */
  canNavigate: boolean;
}

export interface SceneMapPosition {
  /** 0–1 horizontal position on the floor plan */
  x: number;
  /** 0–1 vertical position on the floor plan */
  y: number;
  /**
   * Map bearing (°) when viewer yaw equals defaultView.yaw.
   * 0 = up on the plan, clockwise. Must be calibrated per scene — not equal to yaw.
   */
  heading: number;
}

export interface FloorPlan {
  image: string;
  width: number;
  height: number;
}

export interface Scene {
  id: string;
  title: string;
  description?: string;
  /** Optional scene intro video — YouTube, Synthesia embed, or hosted mp4/webm. */
  videoUrl?: string;
  /** Optional poster for local `videoUrl` (mp4/webm). */
  videoPoster?: string;
  /** Equirectangular panorama URL (panorama tours). */
  panorama: string;
  /** GLTF / GLB model URL (model3d tours). Optional per-scene override of {@link Tour.model}. */
  model?: string;
  /** Baked rectilinear preview at defaultView — Explore location cards; from `npm run generate-thumbnails`. */
  thumbnail?: string;
  defaultView: ViewPosition;
  /** Panorama / legacy 3D hotspots — `model3d` tours use {@link Tour.hotspots} instead. */
  hotspots: Hotspot[];
  /** Panorama minimap pin — normalized position on {@link Tour.floorPlan}. */
  map?: SceneMapPosition;
}

export interface ClientPhone {
  number: string;
  label?: string;
}

/** Client identity and contact — resolved from catalog via {@link resolveTourClient}. */
export interface TourClient {
  name: string;
  website: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  phones?: ClientPhone[];
  fax?: string;
  faxLabel?: string;
  address?: string;
}

export interface TourBranding {
  logo?: string;
  logoAlt?: string;
  /** Client brand primary — e.g. "#cb007c" */
  primaryColor?: string;
  /** Client tour font — sets `--client-font` on `.tour-page` (body + headings) */
  fontFamily?: string;
  /** Google Fonts stylesheet URL (https://fonts.googleapis.com/… only) */
  fontSourceUrl?: string;
  favicon?: string;
}

/** Immersive bed — toggled from the viewer navbar. */
export interface TourImmersiveBackground {
  /** Single track (loops). Use `playlist` or `playlistManifest` for multi-track. */
  audio?: string;
  /** Inline track list — random start, random next on end. */
  playlist?: string[];
  /**
   * Online JSON manifest — `{ "playlist": ["https://…mp3", …], "volume"?: 0.28 }`.
   * Root-relative or absolute HTTPS. Takes precedence over inline `playlist`.
   */
  playlistManifest?: string;
  /** 0–1, default 0.35 */
  volume?: number;
}

export interface Tour {
  /** Tour id — unique per experience; used in URL paths and `loadTour()`. */
  id: string;
  /** Viewer renderer — `'panorama'` (default) or `'model3d'` (Three.js walkthrough). */
  viewerType?: TourViewerType;
  /** Shared GLB/GLTF for all scenes on model3d tours. */
  model?: string;
  /**
   * Tour-level hotspots on the shared model (`model3d` only) — nav, info, and
   * naming opportunities. Panorama tours keep hotspots on each {@link Scene}.
   */
  hotspots?: Hotspot[];
  /** Owning client id — defaults to `id` when one tour per client. */
  clientId?: string;
  /** Platform category — e.g. Healthcare, Education. */
  category?: string;
  /** @deprecated Legacy tour URL — use catalog client `website` via {@link getTourWebsite}. */
  url?: string;
  /** Facility or experience title (e.g. "Ken Sargent House") */
  title: string;
  /** Optional override — defaults to `{client.name} Virtual Tour` */
  productFullName?: string;
  /** Optional per-tour branding override — defaults to catalog client `branding`. */
  branding?: TourBranding;
  /** Optional per-tour override — defaults to platform global playlist in `loadTour`. */
  immersiveBackground?: TourImmersiveBackground;
  /** Panorama tours only — 2D minimap image and scene `map` pin coordinate space. */
  floorPlan?: FloorPlan;
  firstScene: string;
  defaultTransition?: { speed?: string; effect?: 'fade' | 'black' };
  scenes: Record<string, Scene>;
}

/** Live viewer orientation for mini-map and dev tooling */
export interface ViewerOrientation extends ViewPosition {
  hFov: number;
}

export interface FaqEntry {
  q: string;
  a: string;
}

export interface SceneKnowledge {
  title: string;
  description: string;
  facts: string[];
  faqs: FaqEntry[];
  suggestedQuestions: string[];
}

export interface TourKnowledge {
  id: string;
  url: string;
  global: { facilityName: string; summary: string };
  scenes: Record<string, SceneKnowledge>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
