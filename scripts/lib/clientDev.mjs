import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { slugifyHotspotName } from './tourSceneDev.mjs';
import {
  normalizePrimaryColor,
  saveClientBrandAssets,
} from './tourBrandDev.mjs';
import {
  applyCatalogClientBranding,
  applyCatalogClientContact,
  findCatalogClientRecord,
  readCatalogJson,
  writeCatalogJson,
} from './tourCatalogDev.mjs';

const DEFAULT_PRIMARY_COLOR = '#007078';

function assertSlug(value, label) {
  const slug = slugifyHotspotName(value);
  if (!slug) {
    throw new Error(`${label} must contain letters or numbers`);
  }
  return slug;
}

function assertGoogleFontSourceUrl(url) {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  const parsed = new URL(trimmed);
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'fonts.googleapis.com'
  ) {
    throw new Error(
      'fontSourceUrl must be an https://fonts.googleapis.com/ URL',
    );
  }
  return trimmed;
}

export async function createClient({
  root,
  toursDir,
  assetsRoot,
  clientId: rawClientId,
  clientName,
  websiteUrl,
  clientEmail,
  clientPhone,
  clientPhoneLabel,
  clientFax,
  clientFaxLabel,
  clientAddress,
  primaryColor,
  clientLogoAlt,
  logoFileBuffer,
  faviconFileBuffer,
  fontFamily,
  fontSourceUrl,
}) {
  if (!clientName?.trim()) {
    throw new Error('clientName is required');
  }

  const clientId = assertSlug(rawClientId ?? clientName, 'Client id');
  const catalog = readCatalogJson(toursDir);

  if (findCatalogClientRecord(catalog, clientId)) {
    throw new Error(`Client id already exists: ${clientId}`);
  }

  const client = { id: clientId, name: clientName.trim(), tours: [] };

  applyCatalogClientContact(client, {
    website: websiteUrl,
    email: clientEmail,
    phone: clientPhone,
    phoneLabel: clientPhoneLabel,
    fax: clientFax,
    faxLabel: clientFaxLabel,
    address: clientAddress,
  });

  mkdirSync(join(assetsRoot, clientId, 'brand'), { recursive: true });

  const color = normalizePrimaryColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const logoAlt = clientLogoAlt?.trim() || client.name;
  const normalizedFontSourceUrl =
    fontSourceUrl !== undefined ?
      assertGoogleFontSourceUrl(fontSourceUrl)
    : undefined;

  const brandAssets = await saveClientBrandAssets({
    root,
    assetsRoot,
    clientId,
    logoFileBuffer,
    faviconFileBuffer,
  });

  const brandingPatch = {
    primaryColor: color,
    logoAlt,
    ...(brandAssets.savedLogo ? { logo: brandAssets.logoWebPath } : {}),
    ...(brandAssets.savedFavicon ?
      { favicon: brandAssets.faviconWebPath }
    : {}),
    ...(fontFamily !== undefined ? { fontFamily } : {}),
    ...(fontSourceUrl !== undefined ?
      { fontSourceUrl: normalizedFontSourceUrl ?? '' }
    : {}),
  };

  applyCatalogClientBranding(client, brandingPatch);

  if (!catalog.clients) {
    catalog.clients = [];
  }
  catalog.clients.push(client);
  writeCatalogJson(toursDir, catalog);

  return { clientId, client };
}

export async function updateClient({
  root,
  toursDir,
  assetsRoot,
  clientId: rawClientId,
  clientName,
  websiteUrl,
  clientEmail,
  clientPhone,
  clientPhoneLabel,
  clientFax,
  clientFaxLabel,
  clientAddress,
  primaryColor,
  clientLogoAlt,
  logoFileBuffer,
  faviconFileBuffer,
  fontFamily,
  fontSourceUrl,
  clearFontFamily,
  clearFontSourceUrl,
}) {
  const clientId = rawClientId?.trim();
  if (!clientId) {
    throw new Error('clientId is required');
  }

  const catalog = readCatalogJson(toursDir);
  const client = findCatalogClientRecord(catalog, clientId);
  if (!client) {
    throw new Error(`Client not found in catalog: ${clientId}`);
  }

  if (clientName !== undefined) {
    applyCatalogClientContact(client, { name: clientName });
  }

  const hasContactPatch =
    websiteUrl !== undefined ||
    clientEmail !== undefined ||
    clientPhone !== undefined ||
    clientPhoneLabel !== undefined ||
    clientFax !== undefined ||
    clientFaxLabel !== undefined ||
    clientAddress !== undefined;

  if (hasContactPatch) {
    applyCatalogClientContact(client, {
      ...(websiteUrl !== undefined ? { website: websiteUrl } : {}),
      ...(clientEmail !== undefined ? { email: clientEmail } : {}),
      ...(clientPhone !== undefined ? { phone: clientPhone } : {}),
      ...(clientPhoneLabel !== undefined ?
        { phoneLabel: clientPhoneLabel }
      : {}),
      ...(clientFax !== undefined ? { fax: clientFax } : {}),
      ...(clientFaxLabel !== undefined ? { faxLabel: clientFaxLabel } : {}),
      ...(clientAddress !== undefined ? { address: clientAddress } : {}),
    });
  }

  const normalizedColor =
    primaryColor?.trim() ? normalizePrimaryColor(primaryColor) : undefined;
  if (primaryColor?.trim() && !normalizedColor) {
    throw new Error('primaryColor must be a valid hex color');
  }

  const nextLogoAlt = clientLogoAlt?.trim();
  const normalizedFontSourceUrl =
    fontSourceUrl !== undefined ?
      assertGoogleFontSourceUrl(fontSourceUrl)
    : undefined;

  const brandAssets = await saveClientBrandAssets({
    root,
    assetsRoot,
    clientId,
    logoFileBuffer,
    faviconFileBuffer,
  });

  applyCatalogClientBranding(client, {
    ...(normalizedColor ? { primaryColor: normalizedColor } : {}),
    ...(nextLogoAlt ? { logoAlt: nextLogoAlt } : {}),
    ...(brandAssets.savedLogo ? { logo: brandAssets.logoWebPath } : {}),
    ...(brandAssets.savedFavicon ?
      { favicon: brandAssets.faviconWebPath }
    : {}),
    ...(fontFamily !== undefined ? { fontFamily } : {}),
    ...(fontSourceUrl !== undefined ?
      { fontSourceUrl: normalizedFontSourceUrl ?? '' }
    : {}),
    clearFontFamily,
    clearFontSourceUrl,
  });

  writeCatalogJson(toursDir, catalog);

  return { clientId, client };
}
