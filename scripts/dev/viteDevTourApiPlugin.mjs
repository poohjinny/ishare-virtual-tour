import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applySceneLanding,
  createNamingHotspot,
  createNavHotspot,
} from '../lib/tourSceneDev.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const toursDir = join(root, 'tours');
const assetsRoot = join(root, 'assets');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function validateScenePayload(body) {
  const { tourId, sceneId, defaultView } = body ?? {};
  if (!tourId || !sceneId || !defaultView) {
    throw new Error('tourId, sceneId, and defaultView are required');
  }
  if (
    typeof defaultView.yaw !== 'number' ||
    typeof defaultView.pitch !== 'number'
  ) {
    throw new Error('defaultView.yaw and defaultView.pitch must be numbers');
  }
  return { tourId, sceneId, defaultView };
}

function validateHotspotPayload(body) {
  const { tourId, sceneId, name, position } = body ?? {};
  if (!tourId || !sceneId || !name || !position) {
    throw new Error('tourId, sceneId, name, and position are required');
  }
  if (typeof position.yaw !== 'number' || typeof position.pitch !== 'number') {
    throw new Error('position.yaw and position.pitch must be numbers');
  }
  return { tourId, sceneId, name, position, targetSceneId: body.targetSceneId };
}

/** Dev-only API for writing tour JSON + baking scene thumbnails from the panel. */
export function viteDevTourApiPlugin() {
  return {
    name: 'vite-dev-tour-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__dev/api/')) {
          next();
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        try {
          const body = await readJsonBody(req);

          if (req.url === '/__dev/api/scene/default-view') {
            const { tourId, sceneId, defaultView } = validateScenePayload(body);
            const result = await applySceneLanding({
              root,
              toursDir,
              assetsRoot,
              tourId,
              sceneId,
              view: defaultView,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              defaultView: result.defaultView,
              thumbnail: result.thumbnail,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/nav') {
            const { tourId, sceneId, name, position, targetSceneId } =
              validateHotspotPayload(body);
            if (!targetSceneId) {
              throw new Error('targetSceneId is required for nav hotspots');
            }
            const result = await createNavHotspot({
              toursDir,
              tourId,
              sceneId,
              name,
              position,
              targetSceneId,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/naming') {
            const { tourId, sceneId, name, position, price, status, body } = {
              ...validateHotspotPayload(body),
              price: body.price,
              status: body.status,
              body: body.body,
            };
            const result = await createNamingHotspot({
              toursDir,
              tourId,
              sceneId,
              name,
              position,
              price,
              status,
              body,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          sendJson(res, 404, { error: 'Not found' });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown dev API error';
          sendJson(res, 400, { error: message });
        }
      });
    },
  };
}
