import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface AppSearchParams {
  embed: boolean;
  dev: boolean;
  chatTest: boolean;
  errorTest: boolean;
  /** Nav preview mini PSV hero — false when `navPreview=0` (debug). */
  navPreview: boolean;
}

export function useAppSearchParams(): AppSearchParams {
  const [searchParams] = useSearchParams();

  return useMemo(
    () => ({
      embed: searchParams.get('embed') === '1',
      dev: searchParams.get('dev') === '1',
      chatTest: searchParams.get('chatTest') === '1',
      errorTest: searchParams.get('errorTest') === '1',
      navPreview: searchParams.get('navPreview') !== '0',
    }),
    [searchParams],
  );
}
