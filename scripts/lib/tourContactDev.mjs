const FETCH_USER_AGENT = 'ishare-dev-tour/1.0';

const IGNORED_EMAIL_PATTERNS =
  /^(noreply|no-reply|donotreply|mailer-daemon|example@|test@)/i;
const IGNORED_EMAIL_DOMAINS =
  /(example\.com|wixpress\.com|sentry\.io|facebook\.com|twitter\.com)$/i;

function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEmail(raw) {
  const value = raw?.trim().toLowerCase();
  if (!value || !value.includes('@')) return null;
  if (IGNORED_EMAIL_PATTERNS.test(value)) return null;
  if (IGNORED_EMAIL_DOMAINS.test(value.split('@')[1] ?? '')) return null;
  return value;
}

function normalizePhone(raw) {
  const value = raw?.trim();
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length < 7) return null;
  return value;
}

function formatPostalAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') {
    const trimmed = address.replace(/\s+/g, ' ').trim();
    return trimmed.length >= 8 ? trimmed : null;
  }
  if (typeof address !== 'object') return null;

  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);

  const formatted = parts.join(', ');
  return formatted.length >= 8 ? formatted : null;
}

function flattenJsonLd(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (Array.isArray(node['@graph'])) return flattenJsonLd(node['@graph']);
  return [node];
}

function organizationTypes(typeValue) {
  const values = Array.isArray(typeValue) ? typeValue : [typeValue];
  return values
    .filter((value) => typeof value === 'string')
    .map((value) => value.toLowerCase());
}

function isOrganizationNode(node) {
  const types = organizationTypes(node?.['@type']);
  return types.some((type) =>
    /organization|localbusiness|ngo|foundation|hospital|medical|nonprofit|educational|government/.test(
      type,
    ),
  );
}

function extractJsonLdNodes(html) {
  const nodes = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(html);
  while (match) {
    try {
      nodes.push(...flattenJsonLd(JSON.parse(match[1])));
    } catch {
      /* ignore invalid JSON-LD */
    }
    match = pattern.exec(html);
  }
  return nodes;
}

function extractMailtoEmails(html) {
  const emails = [];
  const pattern = /href=["']mailto:([^"'?#]+)/gi;
  let match = pattern.exec(html);
  while (match) {
    const email = normalizeEmail(decodeURIComponent(match[1]));
    if (email) emails.push(email);
    match = pattern.exec(html);
  }
  return emails;
}

function extractTelLinks(html) {
  const entries = [];
  const pattern = /<a[^>]+href=["']tel:([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = pattern.exec(html);
  while (match) {
    const phone = normalizePhone(decodeURIComponent(match[1]));
    if (!phone) {
      match = pattern.exec(html);
      continue;
    }
    const label = stripHtml(match[2]);
    entries.push({
      phone,
      phoneLabel: label && label !== phone ? label : null,
    });
    match = pattern.exec(html);
  }
  return entries;
}

function extractAddressTags(html) {
  const addresses = [];
  const pattern = /<address[^>]*>([\s\S]*?)<\/address>/gi;
  let match = pattern.exec(html);
  while (match) {
    const value = stripHtml(match[1]);
    if (value.length >= 8) addresses.push(value);
    match = pattern.exec(html);
  }
  return addresses;
}

function pickContactFromJsonLd(nodes) {
  for (const node of nodes) {
    if (!isOrganizationNode(node)) continue;

    const email =
      normalizeEmail(node.email) ??
      (Array.isArray(node.contactPoint) ?
        normalizeEmail(
          node.contactPoint.find((entry) => entry?.email)?.email ?? '',
        )
      : normalizeEmail(node.contactPoint?.email));

    const phone =
      normalizePhone(node.telephone) ??
      (Array.isArray(node.contactPoint) ?
        normalizePhone(
          node.contactPoint.find((entry) => entry?.telephone)?.telephone ?? '',
        )
      : normalizePhone(node.contactPoint?.telephone));

    const address = formatPostalAddress(node.address);

    if (email || phone || address) {
      return { email, phone, phoneLabel: null, address, source: 'JSON-LD' };
    }
  }
  return null;
}

export async function suggestContactFromWebsite(websiteUrl) {
  const trimmed = websiteUrl?.trim();
  if (!trimmed) {
    throw new Error('websiteUrl is required');
  }

  let pageUrl;
  try {
    pageUrl = new URL(trimmed);
  } catch {
    throw new Error('websiteUrl must be a valid URL');
  }

  const response = await fetch(pageUrl.href, {
    headers: { 'User-Agent': FETCH_USER_AGENT },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch website (${response.status})`);
  }

  const html = await response.text();
  const notes = [];

  const jsonLdContact = pickContactFromJsonLd(extractJsonLdNodes(html));
  const mailtoEmails = extractMailtoEmails(html);
  const telLinks = extractTelLinks(html);
  const addressTags = extractAddressTags(html);

  const email = jsonLdContact?.email ?? mailtoEmails[0] ?? null;
  const phone = jsonLdContact?.phone ?? telLinks[0]?.phone ?? null;
  const phoneLabel =
    jsonLdContact?.phoneLabel ?? telLinks[0]?.phoneLabel ?? null;
  const address = jsonLdContact?.address ?? addressTags[0] ?? null;

  if (email) {
    notes.push(
      jsonLdContact?.email ?
        `Email from JSON-LD (${email})`
      : `Email from mailto link (${email})`,
    );
  } else {
    notes.push('No email found — add manually if needed');
  }

  if (phone) {
    notes.push(
      jsonLdContact?.phone ?
        `Phone from JSON-LD (${phone})`
      : `Phone from tel link (${phone})`,
    );
  } else {
    notes.push('No phone found — add manually if needed');
  }

  if (address) {
    notes.push(
      jsonLdContact?.address ?
        'Address from JSON-LD — verify before saving'
      : 'Address from <address> tag — verify before saving',
    );
  } else {
    notes.push('No address found — add manually if needed');
  }

  return {
    email,
    phone,
    phoneLabel: phoneLabel || (phone ? 'Telephone' : null),
    address,
    notes,
  };
}
