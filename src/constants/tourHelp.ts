import { VIRTUAL_TOUR_GUIDE_NAME } from './branding';

export const TOUR_HELP_PANEL_TITLE = 'Help';

export const TOUR_HELP_SECTION_USING = 'Using this tour';
export const TOUR_HELP_SECTION_SHORTCUTS = 'Keyboard shortcuts';
export const TOUR_HELP_SECTION_CONTROLS = 'Viewer controls';
export const TOUR_HELP_SECTION_FAQ = 'FAQ';
export const TOUR_HELP_SECTION_CONTACT = 'Contact';

export const TOUR_HELP_TOUR_SUPPORT_LEAD =
  'Questions about this virtual tour? Contact our team.';

export const TOUR_HELP_VIEWER_CONTROLS = [
  'Drag to look around',
  'Scroll or pinch to zoom',
  'Use the control pill at the bottom for zoom, move, default view, and fullscreen',
  'Arrow keys to rotate',
  '+ / − to zoom in and out',
] as const;

export const TOUR_HELP_KEYBOARD_SHORTCUTS = [
  'E — open or close Explore tour',
  'S — open or close Share',
  'C — show or hide viewer controls',
  'H — open or close Help',
  'R — reset to default view',
  'F — toggle fullscreen',
  'M — play or pause background music',
  'Esc — close the most recently opened panel (search, tour panels, zoom/move controls, hotspot panels, and more)',
] as const;

export interface TourHelpFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const TOUR_HELP_FAQ: TourHelpFaqItem[] = [
  {
    id: 'jump-location',
    question: 'How do I jump to a location?',
    answer:
      'Open Explore tour to browse the full directory, use search to find a name, or tap the breadcrumb to move up to an earlier stop.',
  },
  {
    id: 'naming-opportunities',
    question: 'What are naming opportunities?',
    answer:
      'Naming opportunities are sponsorship or recognition options tied to spaces in the facility. Look for heart markers in the scene or the Naming tab in Explore tour.',
  },
  {
    id: 'ask-guide',
    question: 'How do I use Ask Guide?',
    answer: `Tap Ask Guide in the bottom-right corner to chat with ${VIRTUAL_TOUR_GUIDE_NAME} about this facility and your current location.`,
  },
  {
    id: 'move-around',
    question: 'How do I look around in 360°?',
    answer:
      'Drag to pan, scroll or pinch to zoom, and use the control pill at the bottom for zoom, move, and fullscreen.',
  },
  {
    id: 'share-tour',
    question: 'How can I share this tour?',
    answer:
      'Tap Share in the top-right nav to copy a link or send it through email, WhatsApp, or your device’s share menu. The link opens the same tour location you are viewing.',
  },
];
