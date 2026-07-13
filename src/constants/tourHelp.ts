import { SHOW_ASK_GUIDE, VIRTUAL_TOUR_GUIDE_NAME } from './branding';

import type { TourViewerType } from '../types/tour';

export const TOUR_HELP_PANEL_TITLE = 'Help';

export const TOUR_HELP_SECTION_USING = 'Using this tour';
export const TOUR_HELP_SECTION_SHORTCUTS = 'Keyboard shortcuts';
export const TOUR_HELP_SECTION_CONTROLS = 'Viewer controls';
export const TOUR_HELP_SECTION_FAQ = 'FAQ';
export const TOUR_HELP_SECTION_CONTACT = 'Contact';

export const TOUR_HELP_TOUR_SUPPORT_LEAD =
  'Questions about this virtual tour? Contact our team.';

const TOUR_HELP_KEYBOARD_SHORTCUTS_COMMON = [
  'E — open or close Explore tour',
  'U — open or close Share',
  'C — collapse or expand the viewer controls pill (desktop)',
  'H — open or close Help',
  'R — reset to default view',
  'F — toggle fullscreen',
  'M — play or pause background music',
  'Esc — close the most recently opened panel (search, tour panels, zoom/move controls, hotspot panels, and more)',
] as const;

export const TOUR_HELP_KEYBOARD_SHORTCUTS = [
  ...TOUR_HELP_KEYBOARD_SHORTCUTS_COMMON,
  'Arrow keys — pan the view',
  '+ / − — zoom in and out',
] as const;

export const TOUR_HELP_KEYBOARD_SHORTCUTS_3D = [
  ...TOUR_HELP_KEYBOARD_SHORTCUTS_COMMON,
  'Arrow keys — orbit the camera',
  'W A S D — walk around the model',
] as const;

export const TOUR_HELP_VIEWER_CONTROLS = [
  'Drag to look around',
  'Scroll or pinch to zoom',
  'Use the control pill at the bottom for zoom, move, default view, and fullscreen',
  'Collapse or expand the control pill (Show controls / Hide controls)',
  'Arrow keys to rotate',
  '+ / − to zoom in and out',
] as const;

export const TOUR_HELP_VIEWER_CONTROLS_3D = [
  'Drag with left mouse to orbit — right mouse to pan',
  'Scroll or pinch to zoom',
  'Click the floor to move the camera toward that point',
  'Use the control pill at the bottom for zoom, default view, immersive ambience, and fullscreen',
  'Collapse or expand the control pill (Show controls / Hide controls)',
  'Arrow keys to orbit',
  'W A S D to walk around',
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

export const TOUR_HELP_FAQ_3D: TourHelpFaqItem[] = [
  {
    id: 'jump-location',
    question: 'How do I jump to a location?',
    answer:
      'Open Explore tour to browse viewpoints, use search to find a name, or tap the breadcrumb to move up to an earlier stop. Hotspots in the model also move you to linked areas.',
  },
  {
    id: 'naming-opportunities',
    question: 'What are naming opportunities?',
    answer:
      'Naming opportunities are sponsorship or recognition options tied to spaces in the facility. Look for heart markers on the model or the Naming tab in Explore tour.',
  },
  {
    id: 'ask-guide',
    question: 'How do I use Ask Guide?',
    answer: `Tap Ask Guide in the bottom-right corner to chat with ${VIRTUAL_TOUR_GUIDE_NAME} about this facility and your current location.`,
  },
  {
    id: 'move-around',
    question: 'How do I explore the 3D model?',
    answer:
      'Drag to orbit, scroll to zoom, and click the floor to reposition the camera. Use arrow keys to orbit, W A S D to walk, and the control pill for zoom and default view.',
  },
  {
    id: 'share-tour',
    question: 'How can I share this tour?',
    answer:
      'Tap Share in the top-right nav to copy a link or send it through email, WhatsApp, or your device’s share menu. The link opens the same tour location you are viewing.',
  },
];

export function tourHelpKeyboardShortcuts(
  viewerType?: TourViewerType,
): readonly string[] {
  return viewerType === 'model3d' ?
      TOUR_HELP_KEYBOARD_SHORTCUTS_3D
    : TOUR_HELP_KEYBOARD_SHORTCUTS;
}

export function tourHelpViewerControls(
  viewerType?: TourViewerType,
): readonly string[] {
  return viewerType === 'model3d' ?
      TOUR_HELP_VIEWER_CONTROLS_3D
    : TOUR_HELP_VIEWER_CONTROLS;
}

export function tourHelpFaq(
  viewerType?: TourViewerType,
  options?: { showAskGuide?: boolean },
): TourHelpFaqItem[] {
  const items = viewerType === 'model3d' ? TOUR_HELP_FAQ_3D : TOUR_HELP_FAQ;
  const showAskGuide = options?.showAskGuide ?? SHOW_ASK_GUIDE;
  return showAskGuide ? items : items.filter((item) => item.id !== 'ask-guide');
}

export function tourHelpLeadText(
  tourTitle: string,
  viewerType?: TourViewerType,
): string {
  if (viewerType === 'model3d') {
    return `Welcome to ${tourTitle}. Explore the 3D model, move between viewpoints using hotspots, and use the sections below to find your way around.`;
  }

  return `Welcome to ${tourTitle}. Explore each location in 360°, move between scenes with hotspots, and use the sections below to find your way around.`;
}
