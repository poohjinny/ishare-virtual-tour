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
}

export type NamingOpportunityStatus = 'on_sale' | 'sold' | 'reserved';

export interface NamingOpportunity {
  /** Full naming opportunity title (e.g. "Reception Desk Naming Opportunity") */
  name: string;
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
  /** Panel width in px, or preset tier (anchored popups). Auto-tier when omitted. */
  width?: number | PopupWidthTier;
  namingOpportunity?: NamingOpportunity;
  image?: string;
  videoUrl?: string;
  cta?: PopupCta;
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
}

export interface Scene {
  id: string;
  title: string;
  panorama: string;
  thumbnail?: string;
  defaultView: ViewPosition;
  hotspots: Hotspot[];
}

export interface OrganizationPhone {
  number: string;
  label?: string;
}

export interface TourOrganization {
  name: string;
  website: string;
  email?: string;
  phone?: string;
  phoneLabel?: string;
  phones?: OrganizationPhone[];
  fax?: string;
  faxLabel?: string;
  address?: string;
}

export interface TourBranding {
  logo: string;
  logoAlt: string;
  /** Client brand primary — e.g. "#cb007c" */
  primaryColor?: string;
}

export interface Tour {
  /** Client id — hostname without TLD, matches assets/{id}/ and ?tour= param */
  id: string;
  /** Primary website URL (often organization website) */
  url: string;
  title: string;
  organization?: TourOrganization;
  branding?: TourBranding;
  firstScene: string;
  defaultTransition?: { speed?: string; effect?: 'fade' | 'black' };
  scenes: Record<string, Scene>;
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
