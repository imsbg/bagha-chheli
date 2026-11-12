import React from 'react';
import {
  X,
  Trophy,
  Crown,
  BookOpen,
  ExternalLink,
  ShieldCheck,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border transition-all backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900/90 border-white/20 text-white shadow-[0_24px_64px_rgba(0,0,0,0.75)]'
            : 'bg-white/95 border-white text-slate-900 shadow-[0_24px_64px_rgba(15,23,42,0.25)]'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl border transition-colors ${
            isDark
              ? 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white shrink-0">
            <BaghaChheliLogoSvg className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {t.howToPlayTitle}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.howToPlaySubtitle}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
          {/* Step 1 */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-amber-50/70 border-amber-200/80'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-500">
              <TigerIcon className="w-4 h-4" />
              <span>{t.step1Title}</span>
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step1Desc}</p>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-emerald-50/70 border-emerald-200/80'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-emerald-500">
              <GoatIcon className="w-4 h-4" />
              <span>{t.step2Title}</span>
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step2Desc}</p>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.step3Title}</span>
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{t.step3Desc}</p>
          </div>

          {/* Step 4: Win Conditions & Paani Ghara */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark
                ? 'bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border-amber-500/30'
                : 'bg-gradient-to-br from-amber-50 to-emerald-50 border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-500">
              <Crown className="w-4 h-4" />
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

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          {onOpenBlog && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBlog();
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/15'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.readFullGuideBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
          >
            {t.gotItBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
