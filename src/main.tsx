import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __IS_GITHUB_BLOG_VIEW__?: boolean;
  }
}

const rootEl = document.getElementById('root');
if (rootEl && !window.__IS_GITHUB_BLOG_VIEW__) {
  createRoot(rootEl).render(<App />);
}
