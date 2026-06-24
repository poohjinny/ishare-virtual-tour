/**
 * @deprecated Use React Router path + `useAppSearchParams()` for flags.
 * Kept for legacy redirects via `legacyQueryRedirectPath()`.
 */
export interface AppUrlParams {
  embed: boolean;
  dev: boolean;
  chatTest: boolean;
  panoramaErrorTest: boolean;
  notFoundTest: boolean;
  scene: string | null;
  tour: string | null;
}

export function parseUrlParams(): AppUrlParams {
  const params = new URLSearchParams(window.location.search);
  return {
    embed: params.get('embed') === '1',
    dev: params.get('dev') === '1',
    chatTest: params.get('chatTest') === '1',
    panoramaErrorTest: params.get('panoramaErrorTest') === '1',
    notFoundTest: params.get('notFoundTest') === '1',
    scene: params.get('scene'),
    tour: params.get('tour'),
  };
}
