/** "Parking Lot" → `parking-lot` (matches tour scene / hotspot id convention). */
export function slugifyHotspotName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
