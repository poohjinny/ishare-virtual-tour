import { ADMIN_GUIDE_COPY } from '@/lib/authoring-copy';
import {
  GUIDE_FIXTURE_TOUR_EDIT_HREF,
  GUIDE_FIXTURE_TOUR_ID,
  TOUR_CREATE_HREF,
  tourPath,
} from '@/lib/admin-routes';

export type AdminGuideScenarioId =
  | 'welcome'
  | 'create-tour'
  | 'edit-tour'
  | 'tour-visibility'
  | 'client-branding'
  | 'delete-confirmation';

export type AdminGuideScenarioMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  artifact?: AdminGuideArtifact;
};

export type AdminGuideArtifact =
  | {
      type: 'tour-draft';
      title: string;
      client: string;
      visibility: 'unlisted' | 'public';
      firstSceneTitle: string;
    }
  | {
      type: 'tour-edit';
      tourId: string;
      title: string;
      client: string;
      visibility: 'unlisted' | 'public' | 'internal';
      summary: string;
    };

export type AdminGuideScenario = {
  id: AdminGuideScenarioId;
  label: string;
  hint: string;
  messages: readonly AdminGuideScenarioMessage[];
};

export const ADMIN_GUIDE_SCENARIO_EVENT = 'ishare-admin-debug-guide-scenario';

export const ADMIN_GUIDE_SCENARIOS: readonly AdminGuideScenario[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    hint: 'Reset to the empty first-run state',
    messages: [
      { id: 'welcome', role: 'assistant', text: ADMIN_GUIDE_COPY.welcome },
    ],
  },
  {
    id: 'create-tour',
    label: 'Create a tour',
    hint: 'Long authoring walkthrough with follow-ups',
    messages: [
      {
        id: 'create-tour-user-1',
        role: 'user',
        text: 'Help me create a new tour for Grand River Hospital Foundation.',
      },
      {
        id: 'create-tour-assistant-1',
        role: 'assistant',
        text: `Sure. Open [Add tour](${TOUR_CREATE_HREF}) and pick Grand River Hospital Foundation as the client, then fill in the tour title, cover, and first scene. Leave Visibility as Unlisted while the tour is still being reviewed so only people with the direct link can open it.`,
      },
      {
        id: 'create-tour-user-2',
        role: 'user',
        text: 'What should I prepare before I open the form?',
      },
      {
        id: 'create-tour-assistant-2',
        role: 'assistant',
        text: 'Have these ready:\n\n• Tour title and short description\n• Cover image\n• First panorama (and optional scene title)\n• Client logo / colors if this tour should not inherit Shared Branding from [Clients](/clients)\n\nI’ve prepared a small draft below. You can review or adjust these values before the full create step.',
        artifact: {
          type: 'tour-draft',
          title: 'Spring Campaign 2026',
          client: 'Grand River Hospital Foundation',
          visibility: 'unlisted',
          firstSceneTitle: 'Overview',
        },
      },
      {
        id: 'create-tour-user-3',
        role: 'user',
        text: 'Do I need immersive audio and a custom font on day one?',
      },
      {
        id: 'create-tour-assistant-3',
        role: 'assistant',
        text: 'No. Experience and Branding can stay on the client defaults for the first draft. Once the first scene looks right, open the tour from [Tours](/tours) and use Edit tour to tune transition speed, immersive mode, playlist audio, and any tour-level logo or font overrides.',
      },
      {
        id: 'create-tour-user-4',
        role: 'user',
        text: 'Where do I go after Create?',
      },
      {
        id: 'create-tour-assistant-4',
        role: 'assistant',
        text: 'You’ll land in the tour workspace from [Tours](/tours). Use Manage scenes to add the rest of the panoramas, then open a scene to place hotspots. Naming opportunities live under Manage namings when the campaign needs donor spots. Preview anytime from the tour header before you change Visibility to Public.',
      },
    ],
  },
  {
    id: 'edit-tour',
    label: 'Edit a tour',
    hint: 'Update draft card + open full Edit sheet',
    messages: [
      {
        id: 'edit-tour-user-1',
        role: 'user',
        text: 'Update the Ken Sargent House tour summary and keep it unlisted for review.',
      },
      {
        id: 'edit-tour-assistant-1',
        role: 'assistant',
        text: `I found Ken Sargent House under Grande Prairie Regional Hospital Foundation. Open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}) to change title, summary, visibility, experience, and branding on the full form.`,
      },
      {
        id: 'edit-tour-user-2',
        role: 'user',
        text: 'Can you draft the summary change here first?',
      },
      {
        id: 'edit-tour-assistant-2',
        role: 'assistant',
        text: 'Here’s a compact edit draft. Adjust the fields below, then open the full form when you’re ready to save. Live Guide CRUD isn’t connected yet — Save still happens in the Edit tour Sheet.',
        artifact: {
          type: 'tour-edit',
          tourId: GUIDE_FIXTURE_TOUR_ID,
          title: 'Ken Sargent House',
          client: 'Grande Prairie Regional Hospital Foundation',
          visibility: 'unlisted',
          summary:
            'A quiet residential stay near the hospital — updated for the spring review cycle.',
        },
      },
      {
        id: 'edit-tour-user-3',
        role: 'user',
        text: 'Where else can I edit this tour?',
      },
      {
        id: 'edit-tour-assistant-3',
        role: 'assistant',
        text: `From the [tour workspace](${tourPath(GUIDE_FIXTURE_TOUR_ID)}) header, use Edit. Or open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}) directly from here — that deep link opens the same Sheet. Manage scenes and Manage namings stay on their own workspace tabs.`,
      },
      {
        id: 'edit-tour-user-4',
        role: 'user',
        text: 'Will changing visibility here publish it?',
      },
      {
        id: 'edit-tour-assistant-4',
        role: 'assistant',
        text: 'Not until you confirm Save on the full Edit tour Sheet. Keep Visibility as Unlisted in the draft if the tour is still in review. Preview from the tour header before flipping to Public.',
      },
    ],
  },
  {
    id: 'tour-visibility',
    label: 'Tour visibility',
    hint: 'Extended product Q&A about sharing',
    messages: [
      {
        id: 'tour-visibility-user-1',
        role: 'user',
        text: 'What is the difference between an unlisted and public tour?',
      },
      {
        id: 'tour-visibility-assistant-1',
        role: 'assistant',
        text: 'Unlisted means anyone with the direct link can open the tour, but it is not meant for broad discovery. Public means the tour is approved for wider sharing — for example campaign pages, email, or embed partners. Draft and review work should stay Unlisted until sign-off.',
      },
      {
        id: 'tour-visibility-user-2',
        role: 'user',
        text: 'If I share an unlisted link, can someone still forward it?',
      },
      {
        id: 'tour-visibility-assistant-2',
        role: 'assistant',
        text: 'Yes. Unlisted is not a password. Treat the link like a soft gate for review and soft launches. If a tour must stay private after review, keep it Unlisted and only send the link to the people who need it, or wait until you are ready to switch it to Public for the campaign.',
      },
      {
        id: 'tour-visibility-user-3',
        role: 'user',
        text: 'When should we flip a tour to Public?',
      },
      {
        id: 'tour-visibility-assistant-3',
        role: 'assistant',
        text: `Flip to Public after scenes, hotspots, naming copy, and branding have been checked in Preview — and after the client has approved the experience. Open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}), then change Visibility. That does not rebuild assets; it only changes how the tour is intended to be shared.`,
      },
      {
        id: 'tour-visibility-user-4',
        role: 'user',
        text: 'Can we go back to Unlisted later?',
      },
      {
        id: 'tour-visibility-assistant-4',
        role: 'assistant',
        text: `Yes. Open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}) and set Visibility back to Unlisted if a campaign ends or something needs to come down quickly. Existing bookmarks may still open the tour until caches clear, so communicate the change to partners who already had the public link.`,
      },
    ],
  },
  {
    id: 'client-branding',
    label: 'Client branding',
    hint: 'Long help thread for logos and colors',
    messages: [
      {
        id: 'client-branding-user-1',
        role: 'user',
        text: 'Where should I update a client logo and brand colors?',
      },
      {
        id: 'client-branding-assistant-1',
        role: 'assistant',
        text: 'Open [Clients](/clients), choose the client, then Edit client. Shared Branding is the reusable source of truth: logo, favicon, primary color, and font defaults. New tours can inherit those values so you are not re-uploading the same brand kit every time.',
      },
      {
        id: 'client-branding-user-2',
        role: 'user',
        text: 'This spring campaign needs a different logo than the main foundation site.',
      },
      {
        id: 'client-branding-assistant-2',
        role: 'assistant',
        text: `Keep Shared Branding on the foundation defaults in [Clients](/clients), then open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}) → Branding. Switch Branding mode to tour-specific overrides and upload the campaign logo and colors there. Other tours for the same client keep using Shared Branding.`,
      },
      {
        id: 'client-branding-user-3',
        role: 'user',
        text: 'Does the favicon follow the tour override too?',
      },
      {
        id: 'client-branding-assistant-3',
        role: 'assistant',
        text: 'Yes, when the tour uses its own branding. If Branding mode is set to inherit, the tour uses the client favicon from Shared Branding on [Clients](/clients). Preview the tour after you save so you can confirm the tab icon and header logo both match the campaign kit.',
      },
      { id: 'client-branding-user-4', role: 'user', text: 'What about fonts?' },
      {
        id: 'client-branding-assistant-4',
        role: 'assistant',
        text: `Font family and Google Fonts source URL live in the same Branding section — shared on the client via [Clients](/clients), or overridden on the tour from [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}). Stick to an approved Google Fonts URL when you set a custom source so Preview and production load the same typeface.`,
      },
    ],
  },
  {
    id: 'delete-confirmation',
    label: 'Delete confirmation',
    hint: 'Guarded write flow with back-and-forth',
    messages: [
      {
        id: 'delete-confirmation-user-1',
        role: 'user',
        text: 'Delete the Spring Campaign tour.',
      },
      {
        id: 'delete-confirmation-assistant-1',
        role: 'assistant',
        text: 'I found Spring Campaign under Grand River Hospital Foundation in [Tours](/tours). It currently has 8 scenes and 14 naming opportunities. Deleting it removes the tour JSON and related local assets and cannot be undone from Admin.',
      },
      {
        id: 'delete-confirmation-user-2',
        role: 'user',
        text: 'Will that also remove the naming opportunities?',
      },
      {
        id: 'delete-confirmation-assistant-2',
        role: 'assistant',
        text: 'Yes. Naming opportunities belong to the tour, so they go with it — along with scenes, hotspots, and tour branding overrides. Client Shared Branding on [Clients](/clients) and other tours for the same client are left alone.',
      },
      {
        id: 'delete-confirmation-user-3',
        role: 'user',
        text: 'We only need to retire the public link. Is delete the right move?',
      },
      {
        id: 'delete-confirmation-assistant-3',
        role: 'assistant',
        text: `Probably not. If the goal is to stop sharing, open [Edit tour](${GUIDE_FIXTURE_TOUR_EDIT_HREF}) and set Visibility to Unlisted (or keep the tour for archive reference) instead of deleting. Delete is for tours that should no longer exist in the catalog at all.`,
      },
      {
        id: 'delete-confirmation-user-4',
        role: 'user',
        text: 'Understood — delete it anyway. Please proceed.',
      },
      {
        id: 'delete-confirmation-assistant-4',
        role: 'assistant',
        text: 'I would open a confirmation dialog that names Spring Campaign and summarizes the 8 scenes / 14 namings impact, then wait for an explicit Confirm before calling delete from [Tours](/tours). Live CRUD helpers are not wired yet — this thread is the shell for that guarded write pattern.',
      },
    ],
  },
] as const;

export function getAdminGuideScenario(id: AdminGuideScenarioId) {
  return (
    ADMIN_GUIDE_SCENARIOS.find((scenario) => scenario.id === id) ??
    ADMIN_GUIDE_SCENARIOS[0]
  );
}

export type AdminGuideReply = {
  text: string;
  artifact?: AdminGuideArtifact;
  /** Follow-up prompts from the same scenario turn — chat chips. */
  followUps: readonly string[];
};

/** One question → the answer that followed it, flattened across all scenarios. */
type GuideQaPair = {
  scenarioId: AdminGuideScenarioId;
  question: string;
  tokens: Set<string>;
  reply: AdminGuideReply;
};

/** Words too common in these fixtures to identify a topic. */
const STOP_WORDS = new Set([
  'about',
  'also',
  'that',
  'the',
  'this',
  'them',
  'they',
  'there',
  'here',
  'have',
  'help',
  'need',
  'need',
  'with',
  'what',
  'when',
  'where',
  'which',
  'will',
  'from',
  'does',
  'done',
  'been',
  'just',
  'only',
  'please',
  'should',
  'would',
  'could',
  'still',
  'make',
  'want',
  'like',
  'into',
  'more',
  'much',
  'over',
]);

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  return new Set(tokens);
}

const GUIDE_QA_PAIRS: readonly GuideQaPair[] = ADMIN_GUIDE_SCENARIOS.flatMap(
  (scenario) => {
    const pairs: GuideQaPair[] = [];
    scenario.messages.forEach((message, index) => {
      if (message.role !== 'user') return;
      const answer = scenario.messages[index + 1];
      if (!answer || answer.role !== 'assistant') return;

      const followUps = scenario.messages
        .slice(index + 2)
        .filter((next) => next.role === 'user')
        .slice(0, 2)
        .map((next) => next.text);

      pairs.push({
        scenarioId: scenario.id,
        question: message.text,
        tokens: tokenize(message.text),
        reply: { text: answer.text, artifact: answer.artifact, followUps },
      });
    });
    return pairs;
  },
);

/** Opening chips — the first question of every scenario except the welcome reset. */
export const ADMIN_GUIDE_STARTERS: readonly string[] =
  ADMIN_GUIDE_SCENARIOS.filter((scenario) => scenario.id !== 'welcome')
    .map((scenario) => scenario.messages.find((m) => m.role === 'user')?.text)
    .filter((text): text is string => Boolean(text));

/**
 * Best fixture answer for a typed prompt — keyword overlap against every
 * scenario question. Shell only: no model, no tools, no writes.
 */
export function matchAdminGuideReply(prompt: string): AdminGuideReply {
  const promptTokens = tokenize(prompt);
  let best: { score: number; pair: GuideQaPair } | null = null;

  for (const pair of GUIDE_QA_PAIRS) {
    let score = 0;
    for (const token of promptTokens) {
      if (pair.tokens.has(token)) score += 2;
      else if (pair.question.toLowerCase().includes(token)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, pair };
  }

  if (!best) {
    return {
      text: ADMIN_GUIDE_COPY.mockReply,
      followUps: ADMIN_GUIDE_STARTERS,
    };
  }
  return best.pair.reply;
}

export function loadAdminGuideScenario(id: AdminGuideScenarioId) {
  window.dispatchEvent(
    new CustomEvent<AdminGuideScenarioId>(ADMIN_GUIDE_SCENARIO_EVENT, {
      detail: id,
    }),
  );
}
