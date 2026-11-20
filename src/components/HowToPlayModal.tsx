import React from 'react';
import {
  X,
  Crown,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { TigerIcon, GoatIcon, BaghaChheliLogoSvg } from './PieceIcons';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  lang: Language;
  onOpenBlog?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  theme,
  lang,
  onOpenBlog,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const t = translations[lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 md:bg-black/70 md:backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border transition-colors md:backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900 md:bg-slate-900/95 border-white/20 text-white shadow-2xl md:shadow-[0_24px_64px_rgba(0,0,0,0.8)]'
            : 'bg-white md:bg-white/95 border-slate-200 text-slate-900 shadow-2xl md:shadow-[0_24px_64px_rgba(15,23,42,0.25)]'
        }`}
      >
        {/* Modal Header + Quick Overview Badges + Close Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 mb-5 pb-4 border-b border-white/10">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white shrink-0">
                <BaghaChheliLogoSvg className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h2
                  id="how-to-play-title"
                  className="text-lg sm:text-2xl font-black tracking-tight"
                >
                  {t.howToPlayTitle}
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.howToPlaySubtitle}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`lg:hidden p-2.5 rounded-xl border transition-colors shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Fact Chips + Desktop Close Button */}
          <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 whitespace-nowrap shrink-0">
                <TigerIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.compulsoryTigersBadge}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 whitespace-nowrap shrink-0">
                <GoatIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'or' ? '୨୦ ଛେଳି (୪ / ୬ / ୮ ପ୍ରଥମ)' : '20 Goats (4 / 6 / 8 Initial)'}</span>
              </span>
              <span
                className={`hidden xl:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{lang === 'or' ? '୫×୫ ଓଡ଼ିଆ ବୋର୍ଡ' : '5×5 Odia Board'}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 ml-1 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Widescreen 2x2 Grid on Desktop / Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs sm:text-sm leading-relaxed items-stretch">
          {/* Step 1 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-white/[0.04] border-white/12' : 'bg-amber-50/75 border-amber-200/80'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-2 text-amber-500">
                <TigerIcon className="w-5 h-5 shrink-0" />
                <span>{t.step1Title}</span>
              </div>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step1Desc}</p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-white/[0.04] border-white/12' : 'bg-emerald-50/75 border-emerald-200/80'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-2 text-emerald-500">
                <GoatIcon className="w-5 h-5 shrink-0" />
                <span>{t.step2Title}</span>
              </div>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step2Desc}</p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-white/[0.04] border-white/12' : 'bg-slate-50 border-slate-200/90'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-2 text-sky-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{t.step3Title}</span>
              </div>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step3Desc}</p>
            </div>
          </div>

          {/* Step 4: Win Conditions & Paani Ghara */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
              isDark
                ? 'bg-gradient-to-br from-amber-500/12 to-emerald-500/12 border-amber-500/30'
                : 'bg-gradient-to-br from-amber-50 to-emerald-50 border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-2 text-amber-500">
                <Crown className="w-5 h-5 shrink-0" />
                <span>{t.step4Title}</span>
              </div>
              <p
                className={`whitespace-pre-line ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                {t.step4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action Bar: Strictly Single-Line Buttons Side-by-Side */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onOpenBlog && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBlog();
              }}
              className={`h-11 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 border transition-all whitespace-nowrap ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/15'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{t.readFullGuideBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all whitespace-nowrap ${
              !onOpenBlog ? 'sm:col-span-2' : ''
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t.gotItBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

