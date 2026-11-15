import React from 'react';
import { Sparkles, ExternalLink, Download } from 'lucide-react';
import { Language } from '../utils/translations';

interface PromoBannerProps {
  theme: 'dark' | 'light';
  lang: Language;
}

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.odiabhasa.app&pcampaignid=web_share';
const APP_ICON_URL =
  'https://play-lh.googleusercontent.com/3W1bP-a17mB3H8B-W-s1fR2l7y7-V3E8p2z-aK1j7B6M8X8q2w1v7C0x3Z9y2A1b4C=w240-h480-rw';
const FALLBACK_ICON_URL =
  'https://ui-avatars.com/api/?name=%E0%AC%93&background=EA580C&color=fff&size=128&font-size=0.6&bold=true';

/**
 * Sticky Footer Ad Banner for Odia Bhasa App
 */
export const PromoBanner: React.FC<PromoBannerProps> = ({ theme, lang }) => {
  const isDark = theme === 'dark';

  return (
    <div className="w-full sticky bottom-0 z-40 mt-auto px-2.5 sm:px-4 pb-2 pt-1 backdrop-blur-md">
      <div className="max-w-6xl mx-auto">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`group block rounded-2xl px-3.5 py-2.5 border transition-all duration-300 backdrop-blur-2xl relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-r from-slate-900/95 via-orange-950/85 to-amber-950/85 border-orange-500/35 hover:border-orange-400/60 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]'
              : 'bg-gradient-to-r from-orange-50/95 via-amber-50/95 to-white/95 border-orange-300/90 hover:border-orange-400 shadow-[0_-8px_24px_rgba(234,88,12,0.12)]'
          }`}
        >
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* App Icon */}
              <div className="relative shrink-0">
                <img
                  src={APP_ICON_URL}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_ICON_URL;
                  }}
                  alt={lang === 'or' ? 'ଓଡ଼ିଆ ଭାଷା ଆପ୍' : 'Odia Bhasa App'}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-md border border-orange-400/40 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded text-[8px] font-black uppercase bg-orange-500 text-white shadow">
                  {lang === 'or' ? 'ବିଜ୍ଞାପନ' : 'AD'}
                </span>
              </div>

              {/* Text Copy */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500/15 text-orange-500 border border-orange-500/30 whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {lang === 'or' ? 'ପ୍ରାୟୋଜିତ • ଓଡ଼ିଆ ଭାଷା ଆପ୍' : 'Sponsored • Odia Bhasa App'}
                    </span>
                  </span>
                </div>

                <h4
                  className={`text-xs sm:text-sm font-black tracking-tight truncate mt-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {lang === 'or'
                    ? 'ଓଡ଼ିଆ ଭାଷା ଓ ସାହିତ୍ୟ ଶିଖିବା ପାଇଁ ଡାଉନଲୋଡ୍ କରନ୍ତୁ "ଓଡ଼ିଆ ଭାଷା" ଆପ୍!'
                    : 'Explore & Learn Odia Language with the Official Odia Bhasa App!'}
                </h4>
              </div>
            </div>

            {/* Single-Line CTA Button */}
            <div className="shrink-0">
              <div className="h-9 sm:h-10 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 group-hover:from-orange-400 group-hover:to-amber-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition-all whitespace-nowrap">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {lang === 'or' ? 'ଡାଉନଲୋଡ୍ କରନ୍ତୁ' : 'Get on Google Play'}
                </span>
                <span className="sm:hidden">
                  {lang === 'or' ? 'ଡାଉନଲୋଡ୍' : 'Install'}
                </span>
                <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
