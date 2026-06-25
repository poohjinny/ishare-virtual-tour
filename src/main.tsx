import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { bootstrapMaterialSymbols } from './utils/bootstrapMaterialSymbols';
import './styles/globals.css';

bootstrapMaterialSymbols();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
);
