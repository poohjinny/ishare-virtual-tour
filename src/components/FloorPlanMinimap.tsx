import type { FloorPlan, Tour, ViewerOrientation } from '../types/tour';
import {
  buildFovWedgePath,
  getMappedScenes,
  mapBearing,
  tourZoomToHFov,
} from '../utils/minimap';
import {
  floorPlanMinimapDotVariants,
  floorPlanMinimapFrameClassName,
  floorPlanMinimapFovClassName,
  floorPlanMinimapImageClassName,
  floorPlanMinimapMapClassName,
  floorPlanMinimapOverlayClassName,
  floorPlanMinimapPulseClassName,
  floorPlanMinimapRootClassName,
} from './floorPlanMinimapVariants';

interface FloorPlanMinimapProps {
  floorPlan: FloorPlan;
  tour: Tour;
  currentSceneId: string;
  view: ViewerOrientation | null;
  disabled?: boolean;
  onSelectScene?: (sceneId: string) => void;
}

export function FloorPlanMinimap({
  floorPlan,
  tour,
  currentSceneId,
  view,
  disabled = false,
  onSelectScene,
}: FloorPlanMinimapProps) {
  const scene = tour.scenes[currentSceneId];
  const mapPoints = getMappedScenes(tour.scenes);

  if (!scene?.map || mapPoints.length === 0) {
    return null;
  }

  const { width, height } = floorPlan;
  const yaw = view?.yaw ?? scene.defaultView.yaw;
  const hFov = view?.hFov ?? tourZoomToHFov(scene.defaultView.zoom);
  const bearing = mapBearing(scene, yaw);

  const cx = scene.map.x * width;
  const cy = scene.map.y * height;
  const wedgeRadius = Math.min(width, height) * 0.38;
  const wedgePath =
    bearing !== null ?
      buildFovWedgePath(cx, cy, wedgeRadius, bearing, hFov)
    : null;

  return (
    <div
      className={floorPlanMinimapRootClassName}
      aria-label='Floor plan mini-map'
    >
      <div className={floorPlanMinimapFrameClassName}>
        <div className={floorPlanMinimapMapClassName}>
          <img
            className={floorPlanMinimapImageClassName}
            src={floorPlan.image}
            alt=''
            width={width}
            height={height}
            draggable={false}
          />

          <svg
            className={floorPlanMinimapOverlayClassName}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden='true'
          >
            {wedgePath && (
              <path className={floorPlanMinimapFovClassName} d={wedgePath} />
            )}

            {mapPoints.map((point) => {
              const px = point.x * width;
              const py = point.y * height;
              const isCurrent = point.sceneId === currentSceneId;

              return (
                <g key={point.sceneId}>
                  {isCurrent && (
                    <circle
                      className={floorPlanMinimapPulseClassName}
                      cx={px}
                      cy={py}
                      r={22}
                    />
                  )}
                  <circle
                    className={floorPlanMinimapDotVariants({
                      current: isCurrent,
                    })}
                    cx={px}
                    cy={py}
                    r={isCurrent ? 14 : 10}
                    role={onSelectScene ? 'button' : undefined}
                    tabIndex={onSelectScene && !disabled ? 0 : undefined}
                    aria-label={
                      isCurrent ?
                        `${point.title}, current location`
                      : point.title
                    }
                    onClick={() => {
                      if (disabled || !onSelectScene || isCurrent) return;
                      onSelectScene(point.sceneId);
                    }}
                    onKeyDown={(event) => {
                      if (
                        disabled ||
                        !onSelectScene ||
                        isCurrent ||
                        (event.key !== 'Enter' && event.key !== ' ')
                      ) {
                        return;
                      }
                      event.preventDefault();
                      onSelectScene(point.sceneId);
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
