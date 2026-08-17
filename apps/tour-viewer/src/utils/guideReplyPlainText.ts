import type { ChatGuideLink, ChatMessage, TourClient } from '../types/tour';
import { getClientPhones, hasClientContact } from './tourClientContact';

function formatGuideLinkPlain(link: ChatGuideLink): string {
  if (link.kind === 'naming') {
    const meta = [link.priceLabel?.trim(), link.statusLabel?.trim()].filter(
      Boolean,
    );
    const head =
      meta.length > 0 ?
        `Naming opportunity: ${link.title} (${meta.join(', ')})`
      : `Naming opportunity: ${link.title}`;
    const desc = link.description?.trim();
    return desc ? `${head}\n${desc}` : head;
  }

  const head = `Place: ${link.title}`;
  const desc = link.description?.trim();
  return desc ? `${head}\n${desc}` : head;
}

function formatClientContactPlain(client: TourClient): string {
  const lines: string[] = [];
  if (client.name?.trim()) {
    lines.push(`Organization: ${client.name.trim()}`);
  }
  if (client.email?.trim()) {
    lines.push(`Email: ${client.email.trim()}`);
  }
  for (const phone of getClientPhones(client)) {
    lines.push(`${phone.label}: ${phone.number}`);
  }
  if (client.fax?.trim()) {
    lines.push(`${client.faxLabel?.trim() || 'Fax'}: ${client.fax.trim()}`);
  }
  if (client.address?.trim()) {
    lines.push(`Address: ${client.address.trim()}`);
  }
  if (client.website?.trim() && client.website !== 'https://example.com') {
    try {
      const host = new URL(client.website).hostname.replace(/^www\./, '');
      lines.push(`Website: ${host}`);
    } catch {
      lines.push(`Website: ${client.website.trim()}`);
    }
  }
  return lines.join('\n');
}

/**
 * Plain text for copy / read-aloud — reply body plus place/naming cards and
 * catalog contact when those extras are on the message.
 */
export function formatAssistantReplyPlainText(
  message: Pick<ChatMessage, 'content' | 'guideLinks' | 'guideCtas'>,
  options?: { client?: TourClient },
): string {
  const parts: string[] = [];
  const body = message.content.trim();
  if (body) parts.push(body);

  for (const link of message.guideLinks ?? []) {
    const block = formatGuideLinkPlain(link).trim();
    if (block) parts.push(block);
  }

  const showContact = (message.guideCtas ?? []).some(
    (cta) => cta.kind === 'contact' || cta.kind === 'website',
  );
  if (showContact && hasClientContact(options?.client) && options?.client) {
    const contact = formatClientContactPlain(options.client).trim();
    if (contact) parts.push(contact);
  }

  for (const cta of message.guideCtas ?? []) {
    if (
      cta.kind === 'open-help' ||
      cta.kind === 'open-explore' ||
      cta.kind === 'open-ask-guide'
    ) {
      const label = cta.label?.trim();
      if (label) parts.push(label);
    }
  }

  return parts.join('\n\n').trim();
}
