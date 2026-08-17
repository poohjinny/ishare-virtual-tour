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
  iconKind?: 'arrow' | 'mail' | 'bell' | 'external' | 'heart' | 'volunteer';
}

export type NamingOpportunityStatus = 'open' | 'reserved' | 'soon' | 'sold';

export type NamingDonorKind = 'person' | 'organization';

/** Single named donor when the opportunity is sold. */
export interface NamingDonor {
  name: string;
  kind: NamingDonorKind;
  /**
   * Person only — org/affiliation name.
   * Credit: “Named by {name}, {affiliation}”.
   */
  affiliation?: string;
  /**
   * Organization: donor site (links the name).
   * Person: affiliation site (links the affiliation).
   */
  website?: string;
  /**
   * Organization: donor logo.
   * Person: affiliation logo.
   * JSON: `true` = conventional `naming/{hotspotId}/donor-logo.png`;
   * string = override URL/path; omit = no logo.
   * After {@link normalizeTourAssets}, this is always a resolved URL string.
   */
  logo?: string | true;
}

/**
 * Resolved naming opportunity for UI (name always filled via inherit).
 * Prefer reading via {@link resolveNamingPopup} / catalog lookup — not raw JSON.
 */
export interface NamingOpportunity {
  /** Naming opportunity display name (e.g. "Reception Desk") — no suffix. */
  name: string;
  /** Numeric amount in tour JSON (e.g. 75000) — formatted at display time. */
  price: number;
  priceLabel?: string;
  /** Availability — defaults to `open` when omitted */
  status?: NamingOpportunityStatus;
  /** Sold opportunities — shown as “Named by {name}”. */
  donor?: NamingDonor;
}

/**
 * Tour-level naming catalog entry (`tour.namingOpportunities[no_*]`).
 * Business fields live here; panorama pins reference via {@link Hotspot.namingId}.
 */
export interface NamingOpportunityRecord {
  id: string;
  /** Omit to inherit host scene title at resolve time. */
  name?: string;
  price: number;
  priceLabel?: string;
  status?: NamingOpportunityStatus;
  donor?: NamingDonor;
  /** Optional NO copy; omit to inherit host scene description. */
  body?: string;
  /** Optional panel video; omit to inherit host scene previewVideoUrl. */
  videoUrl?: string;
  /** Optional panel image; omit to inherit host scene thumbnail when no video. */
  image?: string;
  /**
   * Discoverability — omit / undefined = public.
   * Same tiers as scenes: Explore + markers = public; unlisted = `?no=` link;
   * internal = `?dev=1` only.
   */
  visibility?: 'public' | 'unlisted' | 'internal';
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
  /** Panel width in px, or preset tier. Defaults to dock panel width (480px) when omitted. */
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
  /**
   * Naming catalog id (`no_*`) — pin references {@link Tour.namingOpportunities}.
   * Legacy tours may still embed `popup.namingOpportunity` until migrated.
   */
  namingId?: string;
  /** Skip preview card and navigate immediately (e.g. back links). */
  instant?: boolean;
  /** Nav marker + default UX — discover (dot), back, or hub (firstScene). */
  navVariant?: NavHotspotVariant;
  /**
   * Optional preview card image. Naming pins omit the conventional
   * `hotspot-thumbs/{hotspotId}.webp` path in JSON; filled at load. Nav pins only
   * store this for a non-default override.
   */
  preview?: { image?: string };
  /**
   * For `model3d` tour-level info / naming hotspots — viewpoint scene id.
   * Per-hotspot camera + Explore thumbnail live on `targetView` / `preview.image`.
   */
  sceneId?: string;
  /**
   * Auto place-overview pin — inherits scene title/description at display time.
   * Id is opaque `h_*`; detect via `role`, not the pin id.
   */
  role?: 'placeOverview';
  /** Author moved this place-overview pin — stop syncing position to defaultView. */
  placeOverviewManual?: boolean;
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
  /** Sold + donor — e.g. “Named by Jane Smith”. */
  donorCredit?: string;
}

/** Lightweight nav destination preview — shown before scene transition. */
export interface NavPreviewContent {
  targetSceneId: string;
  title: string;
  /** Target scene panorama — used for mini 360 preview */
  panorama?: string;
  /** Static fallback for reduced-motion / load errors — defaults to target panorama */
  image?: string;
  /** Target scene hero video — from `scene.previewVideoUrl` (Synthesia embed or mp4/webm) */
  videoUrl?: string;
  /** Poster for local hero video — from `scene.videoPoster` */
  videoPoster?: string;
  /** Target scene body video — from `scene.videoUrl` (YouTube) */
  bodyVideoUrl?: string;
  description?: string;
  namingItems?: NavPreviewNamingItem[];
  /** Department total across the destination sector — set only for sector roots. */
  namingTotalLabel?: string;
  /** Raw sector total (for the count-up animation) — paired with `namingTotalLabel`. */
  namingTotalAmount?: number;
  targetView?: ViewPosition;
  /** Hotspot label — used for CTA copy when present */
  ctaLabel?: string;
  /** False when the destination scene is not ready (e.g. same scene as current). */
  canNavigate: boolean;
}

export interface Scene {
  id: string;
  title: string;
  description?: string;
  /**
   * Discoverability — same tiers as catalog tours (`undefined` = public).
   * Explore shows public only; unlisted is URL/share; internal needs `?dev=1`.
   */
  visibility?: 'public' | 'unlisted' | 'internal';
  /**
   * Author deleted the auto place-overview pin — do not recreate while set.
   */
  suppressPlaceOverview?: boolean;
  /** Optional hero video — Synthesia embed or hosted mp4/webm; Explore + nav preview hero. */
  previewVideoUrl?: string;
  /** Optional body video — YouTube; Explore scene detail + nav preview body. */
  videoUrl?: string;
  /** Optional poster for hero `previewVideoUrl` when it is local mp4/webm. */
  videoPoster?: string;
  /**
   * Equirectangular panorama URL (panorama tours).
   * JSON omits the conventional `panoramas/{sceneId}.webp` path; filled at load.
   * model3d tours omit this — cards use {@link thumbnail}.
   */
  panorama?: string;
  /** GLTF / GLB model URL (model3d tours). Optional per-scene override of {@link Tour.model}. */
  model?: string;
  /**
   * Baked rectilinear preview at defaultView — Explore / intro / catalog cards.
   * JSON omits the conventional `scene-thumbs/{sceneId}.webp` path; filled at load.
   */
  thumbnail?: string;
  defaultView: ViewPosition;
  /** Panorama / legacy 3D hotspots — `model3d` tours use {@link Tour.hotspots} instead. */
  hotspots: Hotspot[];
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
  /**
   * Client catalog: omit (inferred `/assets/{clientId}/brand/logo.png`).
   * Tour override: `true` = conventional tour logo, string = custom URL.
   */
  logo?: string | true;
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

/** One stop in a guided Play Tour slideshow. */
export interface PlayTourStop {
  sceneId: string;
  /** Optional camera; falls back to the scene `defaultView` at play time. */
  view?: ViewPosition;
  /** Per-stop dwell after the camera settles (ms). */
  dwellMs?: number;
}

/** Author-defined autoplay sequence — Matterport-style Play (slideshow hops). */
export interface PlayTour {
  /** Default dwell at each stop after camera settles (ms). */
  dwellMs?: number;
  /** When true, restart from the first stop after the last (default false). */
  loop?: boolean;
  stops: PlayTourStop[];
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
  /**
   * Naming opportunity catalog — business fields (name/price/status/donor).
   * Scene/tour hotspots place pins with {@link Hotspot.namingId}.
   */
  namingOpportunities?: Record<string, NamingOpportunityRecord>;
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
  /**
   * When true, show Tour Guide (Ask Guide) on this tour.
   * Omitted / false keeps it hidden unless product default or `?askGuide=1`.
   */
  askGuideEnabled?: boolean;
  /**
   * Optional per-tour branding override — defaults to catalog client `branding`.
   * Conventional logo/favicon paths are omitted; runtime infers them.
   */
  branding?: TourBranding;
  /** Optional per-tour override — defaults to platform global playlist in `loadTour`. */
  immersiveBackground?: TourImmersiveBackground;
  firstScene: string;
  /**
   * Author Explore / Play order — scene ids as listed in DEV Manage.
   * When omitted or incomplete, runtime fills gaps via nav BFS.
   */
  sceneOrder?: string[];
  defaultTransition?: { speed?: string; effect?: 'fade' | 'black' };
  /**
   * Optional guided Play Tour (slideshow). When omitted / invalid, load time
   * fills Explore-visible scenes in authored {@link sceneOrder} (needs ≥2
   * scenes for Play).
   */
  playTour?: PlayTour;
  scenes: Record<string, Scene>;
}

/** Live viewer orientation for dev tooling */
export interface ViewerOrientation extends ViewPosition {
  hFov: number;
}

/** Ask Guide interactive card — place or naming opportunity. */
export interface ChatGuideLink {
  kind: 'scene' | 'naming';
  sceneId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  /** Next image if `thumbnail` 404s (e.g. hotspot-thumb → scene-thumb). */
  thumbnailFallback?: string;
  /** `naming` only — catalog id (`no_*`). */
  namingId?: string;
  /** `naming` only — pin id for opening the opportunity. */
  hotspotId?: string;
  statusLabel?: string;
  priceLabel?: string;
  /** `naming` only — for status badge styling. */
  status?: NamingOpportunityStatus;
  /**
   * `naming` only — per-opportunity actions (Giftabulator gt / interest).
   * Attached when hydrating Ask Guide replies.
   */
  ctas?: ChatGuideCta[];
}

/** External or in-app action under an Ask Guide reply. */
export type ChatGuideCtaKind =
  | 'website'
  | 'donate'
  | 'contact'
  /** Opens the Help dock panel (closes Ask Guide — mutex). */
  | 'open-help'
  /** Opens the Explore dock panel. */
  | 'open-explore'
  /** Opens Ask Tour Guide (from Help / other chrome). */
  | 'open-ask-guide';

export interface ChatGuideCta {
  id: string;
  label: string;
  /** External URL — omit for in-app chrome actions. */
  url?: string;
  kind: ChatGuideCtaKind;
}

/** @deprecated Prefer {@link ChatGuideLink}. */
export type ChatGuideSceneLink = ChatGuideLink;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Auto place/NO context — one of each; replaced on the next Visit / open of that kind. */
  source?: 'nav-scene' | 'nav-naming' | 'nav-preview';
  /** Optional place / naming cards under an assistant reply. */
  guideLinks?: ChatGuideLink[];
  /** Optional Website / Donate actions under the reply. */
  guideCtas?: ChatGuideCta[];
  /** Contextual follow-up questions (max 4). */
  followUps?: string[];
}
