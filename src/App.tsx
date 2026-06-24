import { useMemo } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { TourPage } from './pages/TourPage';
import { resolveTourRoute } from './utils/tourPaths';

function TourRoute() {
  const { tourOrScene, tourId, sceneId } = useParams<{
    tourOrScene?: string;
    tourId?: string;
    sceneId?: string;
  }>();

  // Key by tour only — scene changes sync inside TourPage (splash + BGM must persist).
  const routeKey = useMemo(() => {
    const route = resolveTourRoute(tourOrScene ?? tourId, sceneId);
    if (route.routeError === 'unknown_tour') {
      return `missing:${route.requestedTourId ?? tourOrScene ?? tourId}`;
    }
    return route.tourId;
  }, [sceneId, tourId, tourOrScene]);

  return <TourPage key={routeKey} />;
}

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<TourRoute />} />
      <Route path='/:tourOrScene' element={<TourRoute />} />
      <Route path='/:tourId/:sceneId' element={<TourRoute />} />
    </Routes>
  );
}
