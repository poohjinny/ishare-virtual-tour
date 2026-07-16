/**
 * One-off tour content migration:
 * 1. Bake resolved naming inheritance onto each NO hotspot (title, body, name, video).
 * 2. Move scene.previewVideoUrl → NO popup.videoUrl (when NO has no video yet).
 * 3. Move scene.videoUrl (body) → scene.previewVideoUrl; clear scene.videoUrl.
 *
 * Usage: node scripts/bake-naming-and-move-videos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toursDir = path.join(__dirname, '..', 'tours');

function inheritedNamingOpportunityName(sceneTitle) {
  return sceneTitle.trim();
}

function resolveNamingPopup(popup, scene) {
  if (!popup?.namingOpportunity) return popup;

  const sceneTitle = scene?.title?.trim() ?? '';
  const inheritedName = inheritedNamingOpportunityName(sceneTitle);

  const title = popup.title?.trim() || sceneTitle;
  const body = popup.body?.trim() || scene?.description?.trim() || '';
  const videoUrl =
    popup.videoUrl?.trim() || scene?.previewVideoUrl?.trim() || undefined;
  const namingName = popup.namingOpportunity.name?.trim() || inheritedName;

  const next = {
    ...popup,
    title: title || popup.title || '',
    body: body || popup.body || '',
    namingOpportunity: {
      ...popup.namingOpportunity,
      name: namingName || popup.namingOpportunity.name || inheritedName,
    },
  };

  if (videoUrl) {
    next.videoUrl = videoUrl;
    if (!popup.videoUrl?.trim() && scene?.videoPoster?.trim()) {
      next.videoPoster = scene.videoPoster.trim();
    }
  }

  return next;
}

function migrateTour(tour) {
  const stats = {
    bakedNos: 0,
    previewToNo: 0,
    bodyToPreview: 0,
    previewCleared: 0,
  };

  const scenes = tour.scenes ?? {};

  for (const scene of Object.values(scenes)) {
    const previewVideo = scene.previewVideoUrl?.trim() || '';
    const bodyVideo = scene.videoUrl?.trim() || '';
    const poster = scene.videoPoster?.trim() || '';
    let copiedPreviewToNo = false;

    for (const hotspot of scene.hotspots ?? []) {
      if (!hotspot.popup?.namingOpportunity) continue;

      const before = JSON.stringify(hotspot.popup);
      hotspot.popup = resolveNamingPopup(hotspot.popup, scene);

      // Explicit bake of preview → NO when still empty after resolve
      // (resolve already copies preview; this also covers clear order below).
      if (!hotspot.popup.videoUrl?.trim() && previewVideo) {
        hotspot.popup.videoUrl = previewVideo;
        if (poster && !hotspot.popup.videoPoster?.trim()) {
          hotspot.popup.videoPoster = poster;
        }
      }

      if (previewVideo && hotspot.popup.videoUrl?.trim() === previewVideo) {
        copiedPreviewToNo = true;
        stats.previewToNo += 1;
      }

      if (JSON.stringify(hotspot.popup) !== before) {
        stats.bakedNos += 1;
      }
    }

    // Tour-level NOs linked to this scene (model3d)
    for (const hotspot of tour.hotspots ?? []) {
      if (!hotspot.popup?.namingOpportunity) continue;
      if (hotspot.sceneId?.trim() !== scene.id) continue;

      const before = JSON.stringify(hotspot.popup);
      hotspot.popup = resolveNamingPopup(hotspot.popup, scene);
      if (!hotspot.popup.videoUrl?.trim() && previewVideo) {
        hotspot.popup.videoUrl = previewVideo;
        if (poster && !hotspot.popup.videoPoster?.trim()) {
          hotspot.popup.videoPoster = poster;
        }
      }
      if (previewVideo && hotspot.popup.videoUrl?.trim() === previewVideo) {
        copiedPreviewToNo = true;
        stats.previewToNo += 1;
      }
      if (JSON.stringify(hotspot.popup) !== before) {
        stats.bakedNos += 1;
      }
    }

    if (previewVideo && copiedPreviewToNo) {
      delete scene.previewVideoUrl;
      if (poster) delete scene.videoPoster;
      stats.previewCleared += 1;
    }

    // Promote body → preview only after preview slot is free (moved to NO or empty).
    if (bodyVideo && !scene.previewVideoUrl?.trim()) {
      scene.previewVideoUrl = bodyVideo;
      delete scene.videoUrl;
      stats.bodyToPreview += 1;
    }
  }

  // Tour-level NOs without a matching sceneId — bake with no scene (no-op inherit)
  for (const hotspot of tour.hotspots ?? []) {
    if (!hotspot.popup?.namingOpportunity) continue;
    const linked = hotspot.sceneId?.trim();
    if (linked && scenes[linked]) continue;
    const host = linked ? scenes[linked] : undefined;
    const before = JSON.stringify(hotspot.popup);
    hotspot.popup = resolveNamingPopup(hotspot.popup, host);
    if (JSON.stringify(hotspot.popup) !== before) stats.bakedNos += 1;
  }

  return stats;
}

const files = fs
  .readdirSync(toursDir)
  .filter(
    (name) =>
      name.endsWith('.json') &&
      name !== 'catalog.json' &&
      !name.includes('knowledge'),
  )
  .sort();

for (const file of files) {
  const filePath = path.join(toursDir, file);
  const tour = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = migrateTour(tour);
  fs.writeFileSync(filePath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
  console.log(
    `${file}: bakedNos=${stats.bakedNos} preview→NO=${stats.previewToNo} previewCleared=${stats.previewCleared} body→preview=${stats.bodyToPreview}`,
  );
}
