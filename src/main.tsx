import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/tailwind.css';
import './styles/layout.css';
import './styles/hotspots.css';
import './components/TourGlassPanel.css';
import './components/ui/Accordion.css';
import './components/ui/PreviewHeroSkeleton.css';
import './components/ui/SegmentedTabs.css';
import './components/NavPreviewPanel.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
);
