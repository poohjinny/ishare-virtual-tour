import { Route, Routes } from 'react-router-dom';
import { TourPage } from './pages/TourPage';

export default function App() {
  return (
    <Routes>
      {/* TourPage stays mounted across tour switches; viewer is keyed by tour.id */}
      <Route path='/' element={<TourPage />} />
      <Route path='/:tourOrScene' element={<TourPage />} />
      <Route path='/:tourId/:sceneId' element={<TourPage />} />
    </Routes>
  );
}
