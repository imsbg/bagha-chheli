import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Only mount the React game app when NOT in pure static GitHub Pages blog mode
const isStaticBlog = Boolean(
  (window as unknown as { __IS_GITHUB_BLOG_VIEW__?: boolean }).__IS_GITHUB_BLOG_VIEW__
);

if (!isStaticBlog) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
