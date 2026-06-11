export type HotspotType = 'nav' | 'info';

export interface ViewPosition {
  yaw: number;
  pitch: number;
  zoom?: number;
}

export interface PopupContent {
  title: string;
  body: string;
  image?: string;
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

export interface TourBranding {
  logo: string;
  logoAlt: string;
}

export interface Tour {
  /** Client id — hostname without TLD, matches assets/{id}/ and ?tour= param */
  id: string;
  /** Client website URL */
  url: string;
  title: string;
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
