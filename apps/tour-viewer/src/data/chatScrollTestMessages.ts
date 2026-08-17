import type { ChatMessage } from '../types/tour';
import { VIRTUAL_TOUR_GUIDE_NAME } from '../constants/branding';

/** Markdown sample for `?guideUiTest=1` — bold, lists, links, quotes, code. */
export const CHAT_MARKDOWN_TEST_CONTENT = `Here are some **open naming opportunities** at Ken Sargent House:

- **Stairwell** — connects levels of the house
- **Accessible Suite (Suite A2)** — for families needing special accommodations
  - Includes wider doorways
  - Near the elevator
- **Quiet Space / Library** — a calm place to read and reflect

> Express interest with the foundation team when you're ready — no checkout cart here.

You can also visit [tour.ishare.ca](https://tour.ishare.ca) or open https://tour.ishare.ca directly.

Notes: _italic_, __also bold__, ~~retired label~~, and \`guideUiTest=1\` preview this without the API.`;

/** TODO(test): remove when scroll UX is verified — enable with ?guideUiTest=1 */
export const CHAT_SCROLL_TEST_MESSAGES: ChatMessage[] = [
  {
    id: 'test-1',
    role: 'assistant',
    content: `Hi! I'm ${VIRTUAL_TOUR_GUIDE_NAME}. What would you like to know about Overview?`,
  },
  {
    id: 'test-md-q',
    role: 'user',
    content: 'What are the open naming opportunities?',
  },
  { id: 'test-md-a', role: 'assistant', content: CHAT_MARKDOWN_TEST_CONTENT },
  {
    id: 'test-2',
    role: 'user',
    content: 'What can you tell me about Ken Sargent House?',
  },
  {
    id: 'test-3',
    role: 'assistant',
    content:
      'Ken Sargent House is a home away from home for patients and families accessing healthcare in Grande Prairie. The campus includes comfortable guest rooms, shared kitchen and dining areas, laundry facilities, and quiet spaces to rest between appointments.',
  },
  {
    id: 'test-4',
    role: 'user',
    content: 'Is the main entrance wheelchair accessible?',
  },
  {
    id: 'test-5',
    role: 'assistant',
    content:
      'Yes. The main entrance has level access, automatic doors, and wide pathways suitable for wheelchairs and mobility devices. If you need additional assistance on arrival, reception staff can help direct you.',
  },
  {
    id: 'test-6',
    role: 'user',
    content: 'Where is reception and what are the visiting hours?',
  },
  {
    id: 'test-7',
    role: 'assistant',
    content:
      'Reception is just inside the main entrance. Staff can check you in, answer questions, and point you to guest rooms or common areas. Visiting hours may vary by program — reception is the best place to confirm current policies when you arrive.',
  },
  {
    id: 'test-8',
    role: 'user',
    content: 'Are there kitchen facilities for guests?',
  },
  {
    id: 'test-9',
    role: 'assistant',
    content:
      'Shared kitchen and dining spaces are available for guests. You can store labelled food in designated refrigerators, use microwaves and basic cookware, and eat in the dining area. Please follow posted guidelines for cleanliness and shared use.',
  },
  {
    id: 'test-10',
    role: 'user',
    content: 'How do I get from overview to the main entrance in this tour?',
  },
  {
    id: 'test-11',
    role: 'assistant',
    content:
      'From the overview scene, use the Main Entrance navigation hotspot to move to the exterior entrance view. You can also open the scene menu in the top-right corner and select Main Entrance directly.',
  },
  {
    id: 'test-12',
    role: 'user',
    content: 'Anything else I should know before my stay?',
  },
  {
    id: 'test-13',
    role: 'assistant',
    content:
      'Bring personal essentials, any medications you need, and identification for check-in. Wi‑Fi, laundry, and quiet rooms are typically available — ask at reception for passwords, room assignments, and house rules. This scroll test message confirms the chat panel body scrolls correctly when history grows.',
  },
];
