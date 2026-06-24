import type { ViewPosition } from '../types/tour';
import { renderEquirectPreview } from './equirectPreviewRender';

const MAX_CONCURRENT_RENDERS = 1;

interface PreviewJob {
  cacheKey: string;
  panoramaUrl: string;
  view: ViewPosition;
  width: number;
  height: number;
  resolve: (objectUrl: string) => void;
  reject: (error: unknown) => void;
}

const resultCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();
const pendingJobs: PreviewJob[] = [];
let activeRenders = 0;

function previewHeight(width: number): number {
  return Math.round(width * (10 / 16));
}

function drainQueue(): void {
  while (activeRenders < MAX_CONCURRENT_RENDERS && pendingJobs.length > 0) {
    const job = pendingJobs.shift();
    if (!job) return;

    activeRenders += 1;
    void runJob(job)
      .then((objectUrl) => {
        resultCache.set(job.cacheKey, objectUrl);
        job.resolve(objectUrl);
      })
      .catch((error) => {
        job.reject(error);
      })
      .finally(() => {
        activeRenders -= 1;
        drainQueue();
      });
  }
}

async function runJob(job: PreviewJob): Promise<string> {
  const cached = resultCache.get(job.cacheKey);
  if (cached) return cached;

  return renderEquirectPreview(
    job.panoramaUrl,
    job.view,
    job.width,
    job.height,
  );
}

export interface RequestEquirectPreviewParams {
  cacheKey: string;
  panoramaUrl: string;
  view: ViewPosition;
  width: number;
}

/** Queue preview renders — dedupes by cacheKey and limits concurrent main-thread work. */
export function requestEquirectPreview({
  cacheKey,
  panoramaUrl,
  view,
  width,
}: RequestEquirectPreviewParams): Promise<string> {
  const cached = resultCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  let jobResolve!: (objectUrl: string) => void;
  let jobReject!: (error: unknown) => void;
  const promise = new Promise<string>((resolve, reject) => {
    jobResolve = resolve;
    jobReject = reject;
  });
  inFlight.set(cacheKey, promise);

  pendingJobs.push({
    cacheKey,
    panoramaUrl,
    view,
    width,
    height: previewHeight(width),
    resolve: jobResolve,
    reject: jobReject,
  });
  drainQueue();

  void promise.finally(() => {
    inFlight.delete(cacheKey);
  });

  return promise;
}

export function getCachedEquirectPreview(cacheKey: string): string | undefined {
  return resultCache.get(cacheKey);
}
