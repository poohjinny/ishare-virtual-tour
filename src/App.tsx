import { useMemo } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { TourPage } from './pages/TourPage';
import { resolveTourRoute } from './utils/tourPaths';

function TourRoute() {
  const { tourOrScene, tourId } = useParams<{
    tourOrScene?: string;
    tourId?: string;
    sceneId?: string;
  }>();

  const routeKey = useMemo(
    () => resolveTourRoute(tourOrScene ?? tourId, undefined).tourId,
    [tourId, tourOrScene],
  );

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
