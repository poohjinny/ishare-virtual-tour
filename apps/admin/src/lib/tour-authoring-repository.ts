/**
 * Authoring persistence boundary for the visual editor and related panels.
 * Today this delegates to the local Dev API (`/api/dev/**`). Later swap the
 * implementations for a draft/publish API without rewriting editor UI.
 */

import {
  applyLocalSceneDefaultView,
  createLocalHotspot,
  createLocalScene,
  deleteLocalHotspot,
  deleteLocalScene,
  duplicateLocalScene,
  reorderLocalScenes,
  replaceLocalScenePanorama,
  updateLocalHotspot,
  updateLocalHotspotPosition,
  updateLocalScene,
  type AdminHotspotCreate,
  type AdminHotspotPosition,
  type AdminHotspotUpdate,
  type AdminSceneCreate,
  type AdminSceneDuplicate,
  type AdminSceneUpdate,
} from '@/lib/admin-dev-api';

export type AuthoringHotspotCreate = AdminHotspotCreate;
export type AuthoringHotspotPosition = AdminHotspotPosition;
export type AuthoringHotspotUpdate = AdminHotspotUpdate;
export type AuthoringSceneCreate = AdminSceneCreate;
export type AuthoringSceneDuplicate = AdminSceneDuplicate;
export type AuthoringSceneUpdate = AdminSceneUpdate;

export const tourAuthoringRepository = {
  createScene(tourId: string, payload: AuthoringSceneCreate) {
    return createLocalScene(tourId, payload);
  },
  updateScene(tourId: string, sceneId: string, update: AuthoringSceneUpdate) {
    return updateLocalScene(tourId, sceneId, update);
  },
  deleteScene(tourId: string, sceneId: string) {
    return deleteLocalScene(tourId, sceneId);
  },
  duplicateScene(
    tourId: string,
    sceneId: string,
    options: AuthoringSceneDuplicate,
  ) {
    return duplicateLocalScene(tourId, sceneId, options);
  },
  reorderScenes(tourId: string, sceneOrder: string[]) {
    return reorderLocalScenes(tourId, sceneOrder);
  },
  applyDefaultView(
    tourId: string,
    sceneId: string,
    defaultView: Record<string, number>,
  ) {
    return applyLocalSceneDefaultView(tourId, sceneId, defaultView);
  },
  replacePanorama(tourId: string, sceneId: string, file: File) {
    return replaceLocalScenePanorama(tourId, sceneId, file);
  },
  createHotspot(
    tourId: string,
    sceneId: string,
    payload: AuthoringHotspotCreate,
  ) {
    return createLocalHotspot(tourId, sceneId, payload);
  },
  updateHotspot(
    tourId: string,
    sceneId: string,
    hotspotId: string,
    payload: AuthoringHotspotUpdate,
  ) {
    return updateLocalHotspot(tourId, sceneId, hotspotId, payload);
  },
  deleteHotspot(tourId: string, sceneId: string, hotspotId: string) {
    return deleteLocalHotspot(tourId, sceneId, hotspotId);
  },
  updateHotspotPosition(
    tourId: string,
    sceneId: string,
    hotspotId: string,
    position: AuthoringHotspotPosition,
  ) {
    return updateLocalHotspotPosition(tourId, sceneId, hotspotId, position);
  },
};
