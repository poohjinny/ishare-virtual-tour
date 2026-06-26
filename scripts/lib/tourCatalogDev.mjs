import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function readCatalogJson(toursDir) {
  const catalogPath = join(toursDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    throw new Error('catalog.json not found');
  }
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

export function tryReadCatalogJson(toursDir) {
  const catalogPath = join(toursDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    return null;
  }
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

export function writeCatalogJson(toursDir, catalog) {
  const catalogPath = join(toursDir, 'catalog.json');
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

export function findCatalogClientRecord(catalog, clientId) {
  return catalog.clients?.find((entry) => entry.id === clientId) ?? null;
}

function applyOptionalCatalogClientField(client, key, value) {
  if (value === undefined) return;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (!trimmed) {
    delete client[key];
    return;
  }
  client[key] = trimmed;
}

/** Patch catalog client contact fields (website, email, phone, address, …). */
export function applyCatalogClientContact(
  client,
  { name, website, email, phone, phoneLabel, phones, fax, faxLabel, address },
) {
  if (name !== undefined) {
    applyOptionalCatalogClientField(client, 'name', name);
  }
  if (website !== undefined) {
    applyOptionalCatalogClientField(client, 'website', website);
  }
  if (email !== undefined) {
    applyOptionalCatalogClientField(client, 'email', email);
  }
  if (phone !== undefined) {
    applyOptionalCatalogClientField(client, 'phone', phone);
  }
  if (phoneLabel !== undefined) {
    applyOptionalCatalogClientField(client, 'phoneLabel', phoneLabel);
  }
  if (phones !== undefined) {
    if (Array.isArray(phones) && phones.length > 0) {
      client.phones = phones;
      delete client.phone;
      delete client.phoneLabel;
    } else {
      delete client.phones;
    }
  }
  if (fax !== undefined) {
    applyOptionalCatalogClientField(client, 'fax', fax);
  }
  if (faxLabel !== undefined) {
    applyOptionalCatalogClientField(client, 'faxLabel', faxLabel);
  }
  if (address !== undefined) {
    applyOptionalCatalogClientField(client, 'address', address);
  }
}

export function resolveClientWebsite(client, fallback = 'https://example.com') {
  return client?.website?.trim() || fallback;
}
