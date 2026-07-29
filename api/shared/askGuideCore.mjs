/**
 * Shared Ask Guide OpenAI chat — used by Vite DEV proxy and Azure Functions.
 *
 * Callers supply `{ apiKey, model }`. Never read VITE_* secrets here.
 */

export const ASK_GUIDE_DEFAULT_MODEL = 'gpt-4o-mini';
export const ASK_GUIDE_DEFAULT_TEMPERATURE = 0.3;
export const ASK_GUIDE_MAX_HISTORY_MESSAGES = 16;

function formatOtherAreas(otherAreas) {
  if (!Array.isArray(otherAreas) || otherAreas.length === 0) {
    return '- (none)';
  }
  return otherAreas
    .map((area) => {
      if (area && typeof area === 'object') {
        const id = area.id || '';
        const title = area.title || id;
        return id ? `- ${id} | ${title}` : `- ${title}`;
      }
      return `- ${area}`;
    })
    .join('\n');
}

function formatTourNamings(tourNamings) {
  if (!Array.isArray(tourNamings) || tourNamings.length === 0) {
    return '- (none)';
  }
  return tourNamings
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const id = entry.id || '';
      const name = entry.name || id;
      const sceneTitle = entry.sceneTitle || entry.sceneId || '';
      const status = entry.statusLabel || '';
      if (!id) return null;
      return `- ${id} | ${name} | ${sceneTitle} | ${status}`;
    })
    .filter(Boolean)
    .join('\n');
}

function formatContextBlock(context) {
  if (!context || typeof context !== 'object') return '(no scene context)';

  const namings = Array.isArray(context.namings) ? context.namings : [];
  const namingLines =
    namings.length === 0 ?
      '- (none in this scene)'
    : namings
        .map((entry) => {
          const bits = [entry.name, entry.statusLabel, entry.priceLabel].filter(
            Boolean,
          );
          const head = `- ${bits.join(' · ')}`;
          return entry.body ? `${head}\n  ${entry.body}` : head;
        })
        .join('\n');

  return [
    `Tour: ${context.tourTitle || context.tourId || ''}`,
    `Organization: ${context.clientName || '(none)'}`,
    `Website: ${context.websiteUrl || '(none)'}`,
    `Facility summary: ${context.facilitySummary || '(none)'}`,
    `Current scene id: ${context.sceneId || '(none)'}`,
    `Current scene: ${context.sceneTitle || context.sceneId || ''}`,
    `Place copy: ${context.placeCopy || '(none)'}`,
    `Scene description: ${context.sceneDescription || '(none)'}`,
    'Other areas in this tour (id | title) — use these ids in sceneLinks:',
    formatOtherAreas(context.otherAreas),
    'Tour naming opportunities (id | name | scene | status) — use these ids in namingLinks:',
    formatTourNamings(context.tourNamings),
    'Naming opportunities in this scene (details):',
    namingLines,
  ].join('\n');
}

export function buildAskGuideSystemPrompt(context) {
  return `You are a virtual tour guide for a nonprofit fundraising experience.

Tone & manner:
- Warm, kind, and approachable — like a welcoming in-person guide, not a chatbot or sales script
- Friendly and human: natural phrasing, light encouragement, genuine hospitality
- Clear and calm; never stiff, corporate, sarcastic, or overly formal
- Empathetic when someone is unsure; invite curiosity without pressure
- Use “we / this place / you’re welcome to…” energy; avoid hype, slang overload, or emoji
- Keep dignity for naming gifts and donors — appreciative, never pushy

Content guidance — use the context below. Prefer:
- Facility summary + organization for questions about the tour, facility, “what is this place”, or why it exists
- Current scene place copy / description for questions about this place
- Naming opportunity details for naming, gift, price, or status questions
- Other areas list when visitors ask what else they can explore
- Tour naming list when recommending a specific naming opportunity

Location accuracy (critical):
- “Current scene” title/id is authoritative for where the visitor is right now
- For “where am I / current location” questions: name that current scene only; do not say they are in another area even if place copy or facility summary mentions other spaces
- Other areas may be suggested as places they can go next — never as their current location
- sceneLinks for where-am-i answers should be [] (the app adds the current-place card)

Interest / purchase / “how do I buy or support a naming opportunity” playbook:
- Do not invent checkout, cart, or payment steps. Naming is not a typical retail purchase.
- If status is open: say they can express interest with the foundation team, and may explore tax-efficient giving options when available. Point them to the on-screen actions (interest / give) rather than inventing a process.
- If reserved: a commitment is in progress — suggest speaking with the team; do not promise it is available.
- If coming soon: it is not open yet — suggest asking to be notified.
- If sold: it is already named — thank partners and suggest other open opportunities or supporting the mission.
- Mention price/status only when present in context.

Missing facts (critical — do not invent):
- Hours of operation, visiting hours, “is it open now”, schedules, events, admissions, and staffing are usually NOT in this tour context
- If asked and the fact is absent: say you don’t have that detail in this tour — briefly suggest asking the foundation team / reception. Do NOT invent “typically open”, “usually accessible”, or similar filler
- When declining a missing fact: use [] for sceneLinks and namingLinks (do not attach Reception or other place cards just because you mentioned reception)
- Share what you do know for other questions. Only say you lack information for a specific missing fact — then briefly and kindly suggest reception or a related question
Do not invent prices, statuses, medical advice, policies, or hours.
Keep answers short (2–4 sentences), still warm. Match the visitor’s language (reply in Korean if they wrote in Korean).

Respond with ONLY valid JSON (no markdown fences):
{"reply":"string","sceneLinks":[{"sceneId":"id-from-other-areas","label":"optional title"}],"namingLinks":[{"namingId":"id-from-tour-namings","label":"optional name"}],"followUps":["short follow-up question"]}
Rules for links:
- sceneLinks: other areas the visitor can go to; sceneId MUST be from “Other areas” (never invent; never current scene). Include every place you mention when helpful — the UI can collapse long lists.
- namingLinks: naming opportunities to open; namingId MUST be from “Tour naming opportunities”. Include relevant ones you mention.
- For interest / “express interest” / naming-availability questions: put opportunities in namingLinks (not sceneLinks); use [] for sceneLinks unless the visitor asked for directions
- For “where else” / directions / nearby questions: use sceneLinks; use [] for namingLinks unless they also asked about naming
- For interest/purchase questions, include the relevant naming id in namingLinks when known
- For hours / schedule / “when is it open” / missing-fact refusals: use [] for both sceneLinks and namingLinks
- Use [] for either array when not needed
- Prefer relevance over dumping the whole tour; skip places you did not discuss
- Do not introduce or list the cards in the reply text (no “here are some places…”); the UI adds a short lead-in above the cards
- Do not add place cards only because you referred visitors to reception
Rules for followUps:
- 0–4 short questions the visitor might ask next (same language as the reply) — prefer concise chip-friendly phrasing
- ONLY about the current place, naming opportunities in the current place, or places/namings you explicitly named in THIS reply
- Do NOT suggest unrelated rooms or areas just to fill the list (e.g. do not jump to Laundry / Entrance if this reply was about the current hub)
- Ground each follow-up in THIS reply — name a place or naming you just mentioned when possible (e.g. “Tell me about the Kitchen”, “What does the Pantry naming cost?”)
- Vary by reply topic: place details → namings here / nearby only if mentioned; naming → price, availability, how to support; directions → another place you already named
- Stay within tour context; do not invent facts
- Do not suggest visiting the website/homepage as a follow-up question (that is a separate button when relevant)
- Do not repeat the visitor’s last question
- Use [] when none fit

Context:
${formatContextBlock(context)}`;
}

export function normalizeAskGuideMessages(
  messages,
  maxHistory = ASK_GUIDE_MAX_HISTORY_MESSAGES,
) {
  if (!Array.isArray(messages)) return [];
  const cleaned = [];
  for (const entry of messages) {
    if (!entry || typeof entry !== 'object') continue;
    const role = entry.role === 'assistant' ? 'assistant' : 'user';
    const content =
      typeof entry.content === 'string' ? entry.content.trim() : '';
    if (!content) continue;
    cleaned.push({ role, content });
  }
  return cleaned.slice(-maxHistory);
}

export function parseAskGuideModelContent(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    return { reply: '', sceneLinks: [], namingLinks: [], followUps: [] };
  }

  const tryParse = (value) => {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('not an object');
    }
    const reply =
      typeof parsed.reply === 'string' ? parsed.reply.trim()
      : typeof parsed.message === 'string' ? parsed.message.trim()
      : '';
    const sceneLinks =
      Array.isArray(parsed.sceneLinks) ? parsed.sceneLinks : [];
    const namingLinks =
      Array.isArray(parsed.namingLinks) ? parsed.namingLinks : [];
    const followUps = Array.isArray(parsed.followUps) ? parsed.followUps : [];
    return {
      reply,
      sceneLinks: sceneLinks
        .map((entry) => ({
          sceneId:
            typeof entry?.sceneId === 'string' ? entry.sceneId
            : typeof entry?.id === 'string' && entry?.type !== 'naming' ?
              entry.id
            : '',
          label:
            typeof entry?.label === 'string' ? entry.label
            : typeof entry?.title === 'string' ? entry.title
            : undefined,
        }))
        .filter((entry) => entry.sceneId),
      namingLinks: namingLinks
        .map((entry) => ({
          namingId:
            typeof entry?.namingId === 'string' ? entry.namingId
            : typeof entry?.id === 'string' ? entry.id
            : '',
          label:
            typeof entry?.label === 'string' ? entry.label
            : typeof entry?.title === 'string' ? entry.title
            : typeof entry?.name === 'string' ? entry.name
            : undefined,
        }))
        .filter((entry) => entry.namingId),
      followUps: followUps
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
        .slice(0, 3),
    };
  };

  try {
    return tryParse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return tryParse(match[0]);
      } catch {
        /* fall through */
      }
    }
  }

  return { reply: text, sceneLinks: [], namingLinks: [], followUps: [] };
}

/**
 * @param {{ context: unknown, messages: unknown, apiKey: string, model?: string, temperature?: number }} input
 */
export async function askGuideChatCore({
  context,
  messages,
  apiKey,
  model = ASK_GUIDE_DEFAULT_MODEL,
  temperature = ASK_GUIDE_DEFAULT_TEMPERATURE,
}) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) {
    const error = new Error(
      'OPENAI_API_KEY is not set. Configure the server secret and retry.',
    );
    error.statusCode = 503;
    throw error;
  }

  const resolvedModel =
    (typeof model === 'string' && model.trim()) || ASK_GUIDE_DEFAULT_MODEL;
  const history = normalizeAskGuideMessages(messages);
  if (history.length === 0) {
    const error = new Error('messages must include at least one user turn');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: resolvedModel,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildAskGuideSystemPrompt(context) },
        ...history,
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(
      `OpenAI ${response.status}: ${detail.slice(0, 400)}`,
    );
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  const parsed = parseAskGuideModelContent(raw);
  if (!parsed.reply) {
    const error = new Error('OpenAI returned an empty reply');
    error.statusCode = 502;
    throw error;
  }

  return {
    reply: parsed.reply,
    sceneLinks: parsed.sceneLinks,
    namingLinks: parsed.namingLinks,
    followUps: parsed.followUps,
    model: resolvedModel,
  };
}
