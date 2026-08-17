/** Dev QA — force viewer load-error overlay (`?loadErrorTest=1`). */
export function isLoadErrorTestEnabled(
  params: Pick<URLSearchParams, 'get'>,
): boolean {
  return (
    params.get('loadErrorTest') === '1' ||
    // First paint before `legacySearchRedirectPath` rewrites `panoramaErrorTest`.
    params.get('panoramaErrorTest') === '1'
  );
}
