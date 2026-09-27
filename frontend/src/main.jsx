import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically route /api and /uploads requests to the Render backend when VITE_API_URL is configured
if (import.meta.env.VITE_API_URL) {
  const originalFetch = window.fetch;
  const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  window.fetch = function (url, options) {
    if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith('/uploads'))) {
      const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
      url = `${baseUrl}${normalizedUrl}`;
    }
    return originalFetch(url, options);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
