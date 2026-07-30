import type {
  ChatGuideCta,
  ChatGuideLink,
  ChatMessage,
  Tour,
} from '../types/tour';
import { assembleTourContext } from '../utils/assembleTourContext';
import {
  buildGuideCtas,
  buildGuideFollowUps,
  shapeGuideLinksForQuestion,
  shouldAttachGuideLinks,
  shouldInferGuideLinksFromText,
  attachNamingGuideLinkCtas,
  isExpressInterestIntent,
  isPrimarilyPlaceChoiceQuestion,
  matchTourPlaceSceneIdsFromQuestion,
  withCurrentPlaceSummaryLink,
  withInterestNamingLink,
} from '../utils/guideMessageExtras';
import {
  resolveGuideLinks,
  resolveGuideSceneLinks,
  buildCurrentPlaceGuideLink,
  capGuideLinks,
} from '../utils/guideSceneLinks';
import { askMockAssistant } from './mockAssistant';

const ASK_GUIDE_DEV_STATUS_URL = '/__dev/api/ask-guide/status';
const ASK_GUIDE_DEV_CHAT_URL = '/__dev/api/ask-guide/chat';

/** `?guideMock=1` — brief think pause so scripted replies feel conversational. */
const GUIDE_MOCK_THINK_MS_MIN = 650;
const GUIDE_MOCK_THINK_MS_MAX = 1400;

export type AskGuideReply = {
  reply: string;
  /** True when the reply came from the live OpenAI proxy (dev or production API). */
  live: boolean;
  /** Live proxy failure — show in UI as an error, not as a guide reply. */
  error?: string;
  guideLinks?: ChatGuideLink[];
  guideCtas?: ChatGuideCta[];
  followUps?: string[];
};

let cachedLiveStatus: boolean | null = null;
let liveStatusInflight: Promise<boolean> | null = null;

/** Dev QA — `?guideMock=1` (legacy `askGuideMock`) forces scripted replies. */
export function isAskGuideMockForced(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('guideMock') === '1' || params.get('askGuideMock') === '1';
}

/**
 * Production / preview API base (`…/api`).
 * DEV without this env keeps using Vite `/__dev/api/ask-guide/*`.
 */
export function resolveAskGuideApiBase(): string | null {
  const configured = import.meta.env.VITE_ASK_GUIDE_API_URL?.trim();
  if (configured) {
    // Recover PowerShell path-mangling of https://…
    // e.g. `D:\repo\https:\host\api` → `https://host/api`
    const mangled = configured.match(/https?:[/\\]+(.+)$/i);
    const candidate =
      mangled ? `https://${mangled[1].replace(/\\/g, '/')}` : configured;
    if (/^https?:\/\//i.test(candidate)) {
      return candidate.replace(/\/$/, '');
    }
    console.warn(
      '[ask-guide] VITE_ASK_GUIDE_API_URL must be an absolute http(s) URL; got:',
      configured,
    );
  }
  if (import.meta.env.DEV) {
    return null;
  }
  // Production build without env — same-origin SWA/Functions proxy.
  return '/api';
}

function askGuideStatusUrl(apiBase: string | null): string {
  if (apiBase === null) return ASK_GUIDE_DEV_STATUS_URL;
  return `${apiBase}/tour/chat/status`;
}

function askGuideChatUrl(apiBase: string | null): string {
  if (apiBase === null) return ASK_GUIDE_DEV_CHAT_URL;
  return `${apiBase}/tour/chat`;
}

function guideMockThinkDelayMs(): number {
  return (
    GUIDE_MOCK_THINK_MS_MIN +
    Math.floor(
      Math.random() * (GUIDE_MOCK_THINK_MS_MAX - GUIDE_MOCK_THINK_MS_MIN + 1),
    )
  );
}

function hydrateGuideExtras(
  tour: Tour,
  sceneId: string,
  question: string,
  reply: string,
  rawSceneLinks?: Array<{ sceneId?: string; label?: string }> | null,
  rawNamingLinks?: Array<{ namingId?: string; label?: string }> | null,
  modelFollowUps?: string[] | null,
): Pick<AskGuideReply, 'guideLinks' | 'guideCtas' | 'followUps'> {
  const hasModelLinks =
    (rawSceneLinks?.some((entry) => entry?.sceneId?.trim()) ?? false) ||
    (rawNamingLinks?.some((entry) => entry?.namingId?.trim()) ?? false);
  const placeChoiceIds = matchTourPlaceSceneIdsFromQuestion(tour, question);
  const attachLinks = shouldAttachGuideLinks(question, reply, { tour });
  const allowTextInference = shouldInferGuideLinksFromText(
    question,
    reply,
    hasModelLinks,
    { tour },
  );

  const sceneLinkInputs = [
    ...(rawSceneLinks ?? []),
    ...placeChoiceIds.map((id) => ({ sceneId: id })),
  ];

  let guideLinks: ChatGuideLink[] = [];
  // Opt-in: only resolve cards when the question warrants them (ignore leftover model links).
  if (attachLinks) {
    guideLinks = resolveGuideLinks(
      tour,
      sceneId,
      reply,
      sceneLinkInputs,
      rawNamingLinks,
      { allowTextInference },
    );
    // Question-only scrape when the visitor typed a place name (reply may not repeat it).
    if (placeChoiceIds.length > 0) {
      const choiceLinks = resolveGuideSceneLinks(
        tour,
        sceneId,
        placeChoiceIds.map((id) => ({ sceneId: id })),
      );
      const currentChoice =
        placeChoiceIds.includes(sceneId) ?
          buildCurrentPlaceGuideLink(tour, sceneId)
        : null;
      guideLinks = capGuideLinks([
        ...guideLinks,
        ...choiceLinks,
        ...(currentChoice ? [currentChoice] : []),
      ]);
    }
    if (isPrimarilyPlaceChoiceQuestion(question, placeChoiceIds)) {
      const choiceOnly = guideLinks.filter(
        (link) =>
          link.kind === 'scene' && placeChoiceIds.includes(link.sceneId),
      );
      if (choiceOnly.length > 0) guideLinks = choiceOnly;
    }
    guideLinks = withCurrentPlaceSummaryLink(
      tour,
      sceneId,
      question,
      guideLinks,
    );
    guideLinks = withInterestNamingLink(
      tour,
      sceneId,
      question,
      guideLinks,
      reply,
    );
    guideLinks = attachNamingGuideLinkCtas(
      tour,
      capGuideLinks(shapeGuideLinksForQuestion(tour, question, guideLinks)),
      { includeSupportCtas: isExpressInterestIntent(question, reply) },
    );
  }

  // Naming support CTAs are on each card when includeSupportCtas was set.
  // Place cards stay suppressed; contact referral CTAs still attach.
  const guideCtas = buildGuideCtas(tour, sceneId, guideLinks, question, reply);
  const followUps = buildGuideFollowUps({
    question,
    reply,
    tour,
    sceneId,
    modelFollowUps,
    guideLinks,
  });

  return {
    ...(guideLinks.length ? { guideLinks } : {}),
    ...(guideCtas.length ? { guideCtas } : {}),
    ...(followUps.length ? { followUps } : {}),
  };
}

async function mockGuideReply(
  tour: Tour,
  sceneId: string,
  question: string,
): Promise<AskGuideReply> {
  const reply = askMockAssistant(tour, sceneId, question);
  if (isAskGuideMockForced()) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, guideMockThinkDelayMs());
    });
  }
  return {
    reply,
    live: false,
    ...hydrateGuideExtras(tour, sceneId, question, reply),
  };
}

/** Whether live Ask Guide is configured (dev Vite proxy or production API). */
export async function fetchAskGuideLiveStatus(force = false): Promise<boolean> {
  if (isAskGuideMockForced()) {
    cachedLiveStatus = false;
    return false;
  }
  if (!force && cachedLiveStatus !== null) return cachedLiveStatus;
  if (!force && liveStatusInflight) return liveStatusInflight;

  const apiBase = resolveAskGuideApiBase();

  let request!: Promise<boolean>;
  request = (async () => {
    try {
      const response = await fetch(askGuideStatusUrl(apiBase));
      if (!response.ok) {
        cachedLiveStatus = false;
        return false;
      }
      const data = (await response.json()) as { enabled?: boolean };
      cachedLiveStatus = Boolean(data.enabled);
      return cachedLiveStatus;
    } catch {
      cachedLiveStatus = false;
      return false;
    } finally {
      if (liveStatusInflight === request) {
        liveStatusInflight = null;
      }
    }
  })();

  liveStatusInflight = request;
  return request;
}

/**
 * Prefer live Ask Guide when configured; otherwise scripted mock.
 * Does not silently swap to mock after a live attempt fails — that returns `error`.
 */
export async function askTourGuide(
  tour: Tour,
  sceneId: string,
  question: string,
  priorMessages: ChatMessage[] = [],
): Promise<AskGuideReply> {
  const trimmed = question.trim();
  if (!trimmed) {
    return mockGuideReply(tour, sceneId, question);
  }

  if (isAskGuideMockForced()) {
    console.info('[ask-guide] mock forced (?guideMock=1)');
    return mockGuideReply(tour, sceneId, trimmed);
  }

  const apiBase = resolveAskGuideApiBase();

  // Always re-check so a stale `cachedLiveStatus === false` cannot sticky-mock.
  const live = await fetchAskGuideLiveStatus(true);
  if (!live) {
    console.info('[ask-guide] live unavailable — using mock');
    return mockGuideReply(tour, sceneId, trimmed);
  }

  const context = assembleTourContext(tour, sceneId);
  try {
    const response = await fetch(askGuideChatUrl(apiBase), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: tour.id,
        sceneId,
        context,
        messages: [
          ...priorMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          { role: 'user', content: trimmed },
        ],
      }),
    });

    if (response.status === 503) {
      cachedLiveStatus = false;
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(
        data?.error ??
          'Ask Guide live is not configured. Check OPENAI_API_KEY on the server.',
      );
    }

    if (response.status === 429) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(
        data?.error ?? 'Too many Ask Guide requests. Try again shortly.',
      );
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? `Ask Guide failed (${response.status})`);
    }

    const data = (await response.json()) as {
      reply?: string;
      sceneLinks?: Array<{ sceneId?: string; label?: string }>;
      namingLinks?: Array<{ namingId?: string; label?: string }>;
      followUps?: string[];
    };
    const reply = data.reply?.trim();
    if (!reply) {
      throw new Error('Ask Guide returned an empty reply');
    }
    return {
      reply,
      live: true,
      ...hydrateGuideExtras(
        tour,
        sceneId,
        trimmed,
        reply,
        data.sceneLinks,
        data.namingLinks,
        data.followUps,
      ),
    };
  } catch (error) {
    console.warn('[ask-guide] live chat failed', error);
    return { reply: '', live: false, error: formatLiveFailureError(error) };
  }
}

function formatLiveFailureError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error ?? '');
  if (/insufficient_quota|exceeded your current quota/i.test(detail)) {
    return 'OpenAI quota exceeded. Add billing or credits at platform.openai.com, then try again.';
  }
  if (/invalid.?api.?key|incorrect api key|401/i.test(detail)) {
    return 'OpenAI authentication failed. Check OPENAI_API_KEY on the Ask Guide server.';
  }
  if (/model|does not exist|404/i.test(detail)) {
    return 'OpenAI model error. Set OPENAI_ASK_GUIDE_MODEL (for example gpt-4o-mini) on the Ask Guide server.';
  }
  if (/too many ask guide requests/i.test(detail)) {
    return detail;
  }
  return 'Live Tour Guide could not answer just now. Check the browser console for details, then try again.';
}
