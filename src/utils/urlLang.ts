import { Language } from './translations';

export type AppViewMode = 'game' | 'terms' | 'blog';

const CANONICAL_BLOG_URL = 'https://imsbg.github.io/bagha-chheli/';

/**
 * Detects whether the current host or query should show the standalone Bagha Chheli Blog / Instructions page.
 * - Defaults to TRUE when hosted on GitHub Pages (`imsbg.github.io` or `/bagha-chheli` path) unless `?room=` or `?view=game` is present.
 * - Can also be previewed anywhere via `?view=blog`.
 */
export function isGithubBlogView(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const viewParam = (params.get('view') || '').toLowerCase();
    if (viewParam === 'blog' || viewParam === 'guide' || viewParam === 'instructions') return true;
    if (viewParam === 'game' || viewParam === 'terms') return false;
    if (params.get('room')) return false;

    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    if (host.endsWith('github.io') || path.endsWith('/bagha-chheli')) {
      return true;
    }
  } catch {
    // Ignore URL errors
  }
  return false;
}

/**
 * Always returns the canonical GitHub Pages URL for Bagha Chheli SEO consolidation.
 */
export function getCanonicalUrlForView(_lang: Language, _view: AppViewMode = 'game'): string {
  return CANONICAL_BLOG_URL;
}

/**
 * Detects the active language from the URL path (`/en`, `/odia`, `/or`),
 * query string (`?lang=en`, `?lang=odia`, `?lang=or`), or saved localStorage preference.
 * Defaults to `'or'` (Odia) when nothing is specified.
 */
export function getInitialLanguageFromUrl(): Language {
  if (typeof window === 'undefined') return 'or';

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  if (pathname === '/en' || pathname.endsWith('/en')) {
    return 'en';
  }
  if (
    pathname === '/odia' ||
    pathname === '/or' ||
    pathname.endsWith('/odia') ||
    pathname.endsWith('/or')
  ) {
    return 'or';
  }

  const params = new URLSearchParams(window.location.search);
  const langParam = (params.get('lang') || '').toLowerCase();
  if (langParam === 'en' || langParam === 'english') {
    return 'en';
  }
  if (langParam === 'or' || langParam === 'odia') {
    return 'or';
  }

  try {
    const saved = localStorage.getItem('baghachheli_lang');
    if (saved === 'en' || saved === 'or') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }

  return 'or';
}

/**
 * Detects initial view mode from URL (`/terms`, `?view=terms`, or GitHub blog view)
 */
export function getInitialViewFromUrl(): AppViewMode {
  if (typeof window === 'undefined') return 'game';
  if (isGithubBlogView()) return 'blog';
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const params = new URLSearchParams(window.location.search);
  if (pathname.endsWith('/terms') || params.get('view') === 'terms') {
    return 'terms';
  }
  return 'game';
}

/**
 * Synchronizes the browser URL and SEO tags when language or view changes.
 */
export function syncUrlWithLanguageAndView(
  lang: Language,
  view: AppViewMode = 'game',
  replace: boolean = true
) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('baghachheli_lang', lang);
  } catch {
    // Ignore
  }

  try {
    const url = new URL(window.location.href);
    const currentPath = url.pathname.replace(/\/+$/, '');
    const isGitHubPagesSubpath =
      url.hostname.toLowerCase().endsWith('github.io') ||
      currentPath.toLowerCase().startsWith('/bagha-chheli');

    if (!isGitHubPagesSubpath) {
      url.pathname = lang === 'en' ? '/en' : '/odia';
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', lang === 'en' ? 'en' : 'odia');
    }

    if (view === 'terms') {
      url.searchParams.set('view', 'terms');
    } else if (view === 'blog') {
      if (!isGitHubPagesSubpath) {
        url.searchParams.set('view', 'blog');
      } else {
        url.searchParams.delete('view');
      }
    } else {
      if (isGitHubPagesSubpath) {
        url.searchParams.set('view', 'game');
      } else {
        url.searchParams.delete('view');
      }
    }

    const nextHref = `${url.pathname}${url.search}${url.hash}`;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextHref !== currentHref) {
      if (replace) {
        window.history.replaceState({ lang, view }, '', nextHref);
      } else {
        window.history.pushState({ lang, view }, '', nextHref);
      }
    }

    document.documentElement.lang = lang === 'or' ? 'or' : 'en';
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', getCanonicalUrlForView(lang, view));
    }
  } catch {
    // Ignore history API errors inside strict sandboxed iframes
  }
}

/**
 * Builds the shareable URL for the current language (and optional room code).
 */
export function getLocalizedShareUrl(
  lang: Language,
  roomCode?: string,
  spectatorOnly: boolean = false
): string {
  if (typeof window === 'undefined') return CANONICAL_BLOG_URL;
  const origin = window.location.origin;
  const path = lang === 'en' ? '/en' : '/odia';
  if (roomCode) {
    const watchSuffix = spectatorOnly ? '&watch=1' : '';
    return `${origin}${path}?room=${encodeURIComponent(roomCode)}${watchSuffix}`;
  }
  return `${origin}${path}`;
}

/**
 * Builds a rich bilingual invite text & URL for sharing the game with a friend.
 */
export function buildFriendSharePayload(
  lang: Language,
  roomCode?: string,
  spectatorOnly: boolean = false
): {
  title: string;
  text: string;
  url: string;
} {
  const url = getLocalizedShareUrl(lang, roomCode, spectatorOnly);

  if (roomCode) {
    if (spectatorOnly) {
      if (lang === 'or') {
        return {
          title: 'ବାଘ ଛେଳି — ଲାଇଭ୍ ଖେଳ ଦେଖନ୍ତୁ',
          text: `🐯🐐 ମୋର ଲାଇଭ୍ ଓଡ଼ିଆ ବାଘ ଛେଳି ଖେଳ ଦେଖନ୍ତୁ ଏବଂ ଇମୋଜି ପଠାନ୍ତୁ!\n🔑 ରୁମ୍ କୋଡ୍: ${roomCode}\nଦର୍ଶକ ଭାବେ ଲାଇଭ୍ ଦେଖିବା ପାଇଁ ତଳ ଲିଙ୍କ୍ ରେ କ୍ଲିକ୍ କରନ୍ତୁ:`,
          url,
        };
      }
      return {
        title: 'Bagha Chheli — Watch Live Match',
        text: `🐯🐐 Watch my live Bagha Chheli (Tigers & Goats) match and send reactions!\n🔑 Room Code: ${roomCode}\nClick below to watch live as a spectator:`,
        url,
      };
    }

    if (lang === 'or') {
      return {
        title: 'ବାଘ ଛେଳି — ଅନଲାଇନ୍ ଖେଳ ନିମନ୍ତ୍ରଣ',
        text: `🐯🐐 ଆସନ୍ତୁ ମୋ ସହିତ ଓଡ଼ିଆ ବାଘ ଛେଳି ଖେଳିବା!\n🔑 ରୁମ୍ କୋଡ୍: ${roomCode}\nତଳ ଲିଙ୍କ୍ ରେ କ୍ଲିକ୍ କରି ସିଧାସଳଖ ଜଏନ୍ କରନ୍ତୁ:`,
        url,
      };
    }
    return {
      title: 'Bagha Chheli — Live Match Invite',
      text: `🐯🐐 Come play Bagha Chheli (Tigers & Goats) with me!\n🔑 Room Code: ${roomCode}\nClick below to join my live room or watch as a spectator:`,
      url,
    };
  }

  if (lang === 'or') {
    return {
      title: 'ବାଘ ଛେଳି — ଓଡ଼ିଆ ପାରମ୍ପରିକ ଖେଳ',
      text: '🐯🐐 ଆସନ୍ତୁ ଓଡ଼ିଶାର ପାରମ୍ପରିକ "ବାଘ ଛେଳି" ଅନଲାଇନ୍ ରେ ଖେଳିବା! କମ୍ପ୍ୟୁଟର କିମ୍ବା ସାଙ୍ଗମାନଙ୍କ ସହିତ ମାଗଣାରେ ଖେଳନ୍ତୁ:',
      url,
    };
  }

  return {
    title: 'Bagha Chheli — Traditional Strategy Game',
    text: '🐯🐐 Play Bagha Chheli (Tigers & Goats) online with friends or vs Computer (AI)! Free instant multiplayer:',
    url,
  };
}
