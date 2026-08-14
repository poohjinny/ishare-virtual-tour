/**
 * Shared Ask Guide OpenAI chat — used by Vite DEV proxy and Azure Functions.
 *
 * Callers supply `{ apiKey, model }`. Never read VITE_* secrets here.
 */

export const ASK_GUIDE_DEFAULT_MODEL = 'gpt-4o-mini';
export const ASK_GUIDE_DEFAULT_TEMPERATURE = 0.45;
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
      const priceLabel =
        (typeof entry.priceLabel === 'string' && entry.priceLabel.trim()) ||
        (typeof entry.price === 'number' && Number.isFinite(entry.price) ?
          `$${Math.round(entry.price).toLocaleString('en-US')}`
        : '');
      if (!id) return null;
      return `- ${id} | ${name} | ${sceneTitle} | ${status} | ${priceLabel || '(no price)'}`;
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
    'Tour naming opportunities (id | name | scene | status | price) — use these ids in namingLinks:',
    formatTourNamings(context.tourNamings),
    'Naming opportunities in this scene (details):',
    namingLines,
  ].join('\n');
}

export function buildAskGuideSystemPrompt(context) {
  return `You are a virtual tour guide for a nonprofit fundraising experience.

Tone & manner:
- Warm, kind, and approachable — like a welcoming in-person guide walking beside the visitor, not a chatbot or sales script
- Friendly and human: natural phrasing, light encouragement, genuine hospitality
- Clear and calm; never stiff, corporate, sarcastic, or overly formal
- Empathetic when someone is unsure; invite curiosity without pressure
- Use “we / this place / you’re welcome to…” energy; avoid hype, slang overload, or emoji
- Keep dignity for naming gifts and donors — appreciative, never pushy
- Prefer a fuller, caring answer over a clipped one — visitors should feel guided, not briefed

Content guidance — use the context below. Prefer:
- Facility summary + organization for questions about the tour, facility, “what is this place”, or why it exists
- Current scene place copy / description for questions about this place — weave in concrete details from that copy
- Naming opportunity details for naming, gift, price, or status questions — name, status, price, and a short sense of what the gift supports when body copy exists
- Other areas list when visitors ask what else they can explore (and put those ids in sceneLinks — do not answer with a text-only place list)
- Tour naming list when recommending a specific naming opportunity, or when asking what naming opportunities exist / can be supported anywhere on the tour

App / how-to-use (keep light — you are a place guide, not a product manual):
- Questions about the facility or this tour experience (“what is this place / tour?”) → answer from facility summary + organization
- Questions about the app UI (buttons, FABs, Share, Help, Explore, voice input, copy, read aloud, shortcuts, how to navigate the chrome) → do NOT invent a full manual. Briefly say Help (top-right) covers tour controls, then warmly offer to talk about this place, nearby areas, or naming
- Do not invent product, pricing, or platform sales copy for iShare / the software itself — point to the foundation team or website when that is in context
- For pure how-to-use turns: use [] for sceneLinks and namingLinks

Naming availability (critical):
- “Naming opportunities in this scene” may be empty (e.g. Overview) even when the tour still has opportunities
- For “what naming opportunities / can I support / available namings” questions: use “Tour naming opportunities”. Never say there are none when that list is non-empty
- “(none in this scene)” only means none pinned to the current scene — say that clearly if needed, then warmly introduce open tour namings via namingLinks
- “Upcoming” means status Coming soon in the tour list; open opportunities are still available to support even when nothing is “upcoming”
- Price / gift-range questions (e.g. “between $100k and $250k”): only include opportunities whose stated price in “Tour naming opportunities” (or scene naming details) falls in that range. Do not invent prices, and do not pad the answer with namings outside the range even if they are open or popular. If none match, say so warmly and optionally point to nearest real prices from the list — still without inventing

Location accuracy (critical):
- “Current scene” title/id is the scene whose place details are loaded for this turn
- For “where am I / current location” questions only: treat that scene as where they are; name it alone; do not say they are in another area even if place copy or facility summary mentions other spaces
- When the visitor asks about a place by name (“Tell me about …”, “I’d like to know more about …”, curious / looking at a place): talk ABOUT that place — acknowledge interest; do NOT open with “you are currently in / at …”, “you’re in … right now”, or other arrival wording unless they clearly said they are there
- Prefer “looking at / asking about / glad you’re curious about” energy for named place questions; save “here / you’re at” for where-am-i or when they say they are at a place
- Other areas may be suggested as places they can go next — never as their current location
- sceneLinks for where-am-i answers should be [] (the app adds the current-place card)

Navigation (critical — the app moves the visitor, not you):
- You cannot change the panorama. Never claim you are taking them somewhere (“let’s head over”, “I’ll take you there”, “on our way”).
- When recommending places: give a warm one- or two-sentence sense of each (from place copy when available), put them in sceneLinks, and invite the visitor to open a card to go.
- Incomplete messages (“I want to”, “I want to see”, “yes”, “ok”) are NOT a confirmed destination — ask which place, and include sceneLinks for the options you just named. Do not invent that they already chose one.
- When the visitor names a place from “Other areas” (e.g. “communal space”): include that sceneId in sceneLinks so they can tap the card to go. A description without a card is incomplete.
- “Do you have more / what else / any other places”: add more Other-areas sceneLinks (new ones, not only repeats) instead of text-only lists.

Interest / purchase / “how do I buy or support a naming opportunity” playbook:
- Do not invent checkout, cart, or payment steps. Naming is not a typical retail purchase.
- If status is open: say they can express interest with the foundation team, and may explore tax-efficient giving options when available. Point them to the on-screen actions (interest / give) rather than inventing a process.
- If reserved: a commitment is in progress — suggest speaking with the team; do not promise it is available.
- If coming soon: it is not open yet — suggest asking to be notified.
- If sold: it is already named — thank partners and suggest other open opportunities or supporting the mission.
- Mention price/status only when present in context.

Missing facts (critical — do not invent):
- Split questions into three buckets:
  1) **Tour-grounded** — this facility, this tour, this scene, this org, naming opportunities, prices/statuses, “what is this place”, on-site policies for *this* site → answer ONLY from the context below. If absent, say you don’t have that detail in this tour.
  2) **General knowledge** — concepts, definitions, how something usually works (e.g. what a naming gift is, what tax-efficient giving means in general), light chitchat → you may answer from general knowledge. Do NOT present general knowledge as a fact about *this* facility, *this* org, or *today here*.
  3) **Live / local-as-fact** — whether this place is open *now*, today’s temperature *here*, today’s schedule/events, staffing on site, traffic to this site, and similar “right now / at this place” claims → usually NOT in context; decline inventing them. Kindly suggest the foundation team / reception (or an appropriate external source), then offer something helpful you *do* know from the tour.
- Hours of operation, visiting hours, “is it open now”, schedules, events, admissions, and staffing are usually NOT in this tour context (bucket 3 unless explicitly present in context)
- If a tour-grounded or live fact is absent: say you don’t have that detail in this tour — kindly suggest asking the foundation team / reception, and offer something helpful you *do* know (this place, nearby areas, or naming). Do NOT invent “typically open”, “usually accessible”, or similar filler about *this* site
- When declining a missing fact: use [] for sceneLinks and namingLinks (do not attach Reception or other place cards just because you mentioned reception)
- Share what you do know for other questions. Only say you lack information for a specific missing fact — then kindly suggest reception or a related question
Do not invent prices, statuses, medical advice, policies, or hours for this tour.

Answer length & shape:
- Default to a generous, hospitable reply: usually about 4–8 sentences, or 2 short paragraphs — enough to orient, share real detail from context, and invite a next step
- Open with a warm acknowledgment, then explain with concrete place/naming/facility detail from context, then gently offer what they can explore or ask next
- Chitchat (“hello”, thanks) can stay a bit shorter but still friendly — not one clipped line
- Missing-fact refusals may be shorter, but still kind and useful (not abrupt)
- Prefer depth from the provided context over padding; never invent facts to fill length
- Match the visitor’s language (reply in Korean if they wrote in Korean)

Reply text formatting (light markdown — the chat UI renders it):
- Use **bold** or __bold__ for key place or naming names when it helps scanning
- Use *italic* / _italic_ sparingly; ~~strikethrough~~ only when contrasting a retired label
- For multi-option place/naming lists: use a single flat "-" bullet list only — never nest lists and never use indented or restarted numbered lists (no “1.” then indented “1.”)
- Use numbered lists (1. 2. 3.) only when order truly matters; keep them continuous at the same indent with no blank lines between items
- Nest with 2-space indent only for true sub-points under a bullet (rare); never for peer options
- Use > blockquote for a short aside or tip
- Use [label](https://...) only for real http(s) URLs from context — never invent links
- Do not use headings (#), images, tables, code fences, or raw HTML inside reply

Respond with ONLY valid JSON (no markdown fences around the JSON):
{"reply":"string","sceneLinks":[{"sceneId":"id-from-other-areas","label":"optional title"}],"namingLinks":[{"namingId":"id-from-tour-namings","label":"optional name"}],"followUps":["short follow-up question"]}
Rules for links (opt-in — only when this turn needs cards):
- Default to [] for both sceneLinks and namingLinks
- Include links only when the visitor asked about where they are, where else to go / directions / nearby / what to explore or enjoy on the tour, a specific place or naming, or naming interest / availability / support
- Do NOT reuse places from earlier turns for chitchat, laughter, thanks, ok/cool, or other low-intent messages — use [] even if the prior answer had cards
- sceneLinks: other areas the visitor can go to; sceneId MUST be from “Other areas” (never invent; never current scene). Include every place you mention when helpful — the UI can collapse long lists.
- namingLinks: naming opportunities to open; namingId MUST be from “Tour naming opportunities”. Include only opportunities you actually name in this reply — cards follow the reply, not every price-range match
- For interest / “express interest” / naming-availability questions: put opportunities in namingLinks (not sceneLinks); use [] for sceneLinks unless the visitor asked for directions
- For “where else” / directions / nearby / what to explore questions: use sceneLinks; use [] for namingLinks unless they also asked about naming
- For interest/purchase questions, include the relevant naming id in namingLinks when known
- For hours / schedule / “when is it open” / missing-fact refusals: use [] for both sceneLinks and namingLinks
- Prefer relevance over dumping the whole tour; skip places/namings you did not discuss (including price-range answers — do not attach every in-range id)
- Do not introduce or list the cards in the reply text (no “here are some places…” / “based on what we talked about”); the UI shows tappable cards under your reply
- Do not add place cards only because you referred visitors to reception
Rules for followUps (opt-in — only when useful):
- Default to [] — do not invent chips to fill the list
- Each followUp is the visitor’s NEXT message — written in the visitor’s voice, as if they are typing to you
- Use I/me/my questions or short asks: “Tell me about the Kitchen”, “Where else can I go?”, “What does the Pantry naming cost?”, “How can I support this naming?”
- NEVER write as the guide asking the visitor (bad: “Would you like to…”, “Are you interested in…”, “Shall we…”, “Can I help you with…”, “Let me know if…”)
- 0–6 short questions only when THIS reply discussed a place, naming, or directions (same language as the reply)
- ONLY about the current place, naming opportunities in the current place, or places/namings you explicitly named in THIS reply
- Do NOT suggest follow-ups after chitchat / laughter / thanks / low-intent turns
- Do NOT suggest unrelated rooms or areas just to fill the list (e.g. do not jump to Laundry / Entrance if this reply was about the current hub)
- Ground each follow-up in THIS reply — name a place or naming you just mentioned when possible
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
    let summary = detail.slice(0, 400).trim();
    if (summary) {
      try {
        const parsed = JSON.parse(summary);
        const message =
          parsed?.error?.message ||
          parsed?.error?.code ||
          parsed?.message ||
          null;
        if (typeof message === 'string' && message.trim()) {
          summary = message.trim();
        }
      } catch {
        /* keep raw text */
      }
    } else {
      summary = '(empty error body)';
    }
    const error = new Error(`OpenAI ${response.status}: ${summary}`);
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

/**
 * Extract a growing JSON string value for `"reply"` from incomplete model output.
 * @param {string} accumulated
 * @returns {string | null}
 */
export function extractPartialAskGuideReply(accumulated) {
  const match = accumulated.match(/"reply"\s*:\s*"/);
  if (!match || match.index == null) return null;
  let i = match.index + match[0].length;
  let out = '';
  while (i < accumulated.length) {
    const ch = accumulated[i];
    if (ch === '\\') {
      const next = accumulated[i + 1];
      if (next == null) break;
      if (next === 'n') out += '\n';
      else if (next === 'r') out += '\r';
      else if (next === 't') out += '\t';
      else if (next === '"' || next === '\\' || next === '/') out += next;
      else if (next === 'u' && i + 5 < accumulated.length) {
        const hex = accumulated.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        out += next;
      } else {
        out += next;
      }
      i += 2;
      continue;
    }
    if (ch === '"') break;
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Stream OpenAI json_object completions for Ask Guide.
 * Yields `{ type: 'delta', text }` (full reply so far) then `{ type: 'done', ...result }`.
 * @param {{ context: unknown, messages: unknown, apiKey: string, model?: string, temperature?: number, signal?: AbortSignal }} input
 */
export async function* askGuideChatCoreStream({
  context,
  messages,
  apiKey,
  model = ASK_GUIDE_DEFAULT_MODEL,
  temperature = ASK_GUIDE_DEFAULT_TEMPERATURE,
  signal,
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
      stream: true,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildAskGuideSystemPrompt(context) },
        ...history,
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    let summary = detail.slice(0, 400).trim();
    if (summary) {
      try {
        const parsed = JSON.parse(summary);
        const message =
          parsed?.error?.message ||
          parsed?.error?.code ||
          parsed?.message ||
          null;
        if (typeof message === 'string' && message.trim()) {
          summary = message.trim();
        }
      } catch {
        /* keep raw text */
      }
    } else {
      summary = '(empty error body)';
    }
    const error = new Error(`OpenAI ${response.status}: ${summary}`);
    error.statusCode = 502;
    throw error;
  }

  if (!response.body) {
    const error = new Error('OpenAI returned an empty stream');
    error.statusCode = 502;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let lastReply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      const piece = parsed?.choices?.[0]?.delta?.content;
      if (typeof piece !== 'string' || !piece) continue;
      content += piece;
      const replySoFar = extractPartialAskGuideReply(content);
      if (replySoFar != null && replySoFar !== lastReply) {
        lastReply = replySoFar;
        yield { type: 'delta', text: replySoFar };
      }
    }
  }

  const parsed = parseAskGuideModelContent(content);
  if (!parsed.reply) {
    const error = new Error('OpenAI returned an empty reply');
    error.statusCode = 502;
    throw error;
  }

  yield {
    type: 'done',
    reply: parsed.reply,
    sceneLinks: parsed.sceneLinks,
    namingLinks: parsed.namingLinks,
    followUps: parsed.followUps,
    model: resolvedModel,
  };
}

/**
 * Encode Ask Guide stream events as SSE bytes.
 * @param {AsyncIterable<{ type: string } & Record<string, unknown>>} events
 * @param {AbortSignal} [signal]
 */
export function askGuideSseResponseStream(events, signal) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        for await (const chunk of events) {
          if (signal?.aborted) break;
          if (chunk.type === 'delta') {
            send('delta', { text: chunk.text });
          } else if (chunk.type === 'done') {
            const { type: _type, ...rest } = chunk;
            send('done', { ok: true, ...rest });
          } else if (chunk.type === 'error') {
            send('error', { error: chunk.error });
          }
        }
      } catch (error) {
        if (signal?.aborted) {
          /* client cancelled */
        } else {
          send('error', {
            error:
              error instanceof Error ?
                error.message
              : 'Ask Guide stream failed',
          });
        }
      } finally {
        controller.close();
      }
    },
  });
}
