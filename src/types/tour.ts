export type HotspotType = 'nav' | 'info';

export interface ViewPosition {
  yaw: number;
  pitch: number;
  zoom?: number;
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

export type NamingOpportunityStatus =
  | 'on_sale'
  | 'sold'
  | 'reserved'
  | 'coming_soon';

export interface NamingOpportunity {
  /** Full naming opportunity title (e.g. "Reception Desk Naming Opportunity") */
  name: string;
  /** Numeric amount only in tour JSON (e.g. "75000") — formatted at display time. */
  price: string;
  priceLabel?: string;
  /** Availability — defaults to `on_sale` when omitted */
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
}

export interface Hotspot {
  id: string;
  type: HotspotType;
  position: ViewPosition;
  label?: string;
  targetScene?: string;
  targetView?: ViewPosition;
  popup?: PopupContent;
  /** Skip preview card and navigate immediately (e.g. back links). */
  instant?: boolean;
  /** Optional overrides for nav preview card */
  preview?: { image?: string };
}

/** Naming opportunity summary — accordion row in nav preview. */
export interface NavPreviewNamingItem {
  /** Info hotspot id — used to open the naming opportunity in-scene */
  hotspotId: string;
  name: string;
  statusLabel: string;
  statusShortLabel: string;
  statusModifier: string;
  price: string;
  priceLabel?: string;
  /** First paragraph from info popup body */
  description?: string;
}

/** Lightweight nav destination preview — shown before scene transition. */
export interface NavPreviewContent {
  targetSceneId: string;
  title: string;
  /** Target scene panorama — used for mini 360 preview */
  panorama?: string;
  /** Static fallback for reduced-motion / load errors — defaults to target panorama */
  image?: string;
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
  panorama: string;
  /** Baked rectilinear preview at defaultView — generated via `npm run generate-thumbnails`. */
  thumbnail?: string;
  defaultView: ViewPosition;
  hotspots: Hotspot[];
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
  logo: string;
  logoAlt: string;
  /** Client brand primary — e.g. "#cb007c" */
  primaryColor?: string;
  /** Client tour font — sets `--client-font` on `.tour-page` (body + headings) */
  fontFamily?: string;
  /** Google Fonts stylesheet URL (https://fonts.googleapis.com/… only) */
  fontSourceUrl?: string;
  /** Optional override — defaults to /assets/{clientId}/{tourId}/favicon.ico */
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
  branding?: TourBranding;
  /** Optional per-tour override — defaults to platform global playlist in `loadTour`. */
  immersiveBackground?: TourImmersiveBackground;
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
