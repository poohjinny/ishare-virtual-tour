/** Dev QA — force viewer load-error overlay (`?loadErrorTest=1`). */
export function isLoadErrorTestEnabled(
  params: Pick<URLSearchParams, 'get'>,
): boolean {
  return (
    params.get('loadErrorTest') === '1' ||
    params.get('panoramaErrorTest') === '1'
  );
}
