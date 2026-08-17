import { useCallback, useState } from 'react';
import {
  readViewerControlsVisiblePreference,
  writeViewerControlsVisiblePreference,
} from '../utils/viewerControlsPreference';

export function useViewerControlsVisible() {
  const [controlsVisible, setControlsVisibleState] = useState(
    readViewerControlsVisiblePreference,
  );

  const setControlsVisible = useCallback((visible: boolean) => {
    setControlsVisibleState(visible);
    writeViewerControlsVisiblePreference(visible);
  }, []);

  const toggleControlsVisible = useCallback(() => {
    setControlsVisibleState((visible) => {
      const next = !visible;
      writeViewerControlsVisiblePreference(next);
      return next;
    });
  }, []);

  return { controlsVisible, setControlsVisible, toggleControlsVisible };
}
