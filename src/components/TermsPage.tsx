import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Database, Scale } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface TermsPageProps {
  onBack: () => void;
  theme: 'dark' | 'light';
  lang: Language;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack, theme, lang }) => {
  const isDark = theme === 'dark';
  const t = translations[lang];

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10 relative z-10 w-full max-w-3xl mx-auto">
      <article
        className={`w-full rounded-3xl p-5 sm:p-8 border transition-all duration-300 backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900/75 border-white/15 text-white shadow-[0_24px_64px_rgba(0,0,0,0.55)]'
            : 'bg-white/85 border-white text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.1)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                {t.termsPageTitle}
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.termsPageSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              isDark
                ? 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToGameBtn}</span>
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
          <section
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/90 border-slate-200/80'
            }`}
          >
            <h2 className="font-extrabold text-sm sm:text-base mb-1.5 flex items-center gap-2 text-amber-500">
              <Lock className="w-4 h-4" />
              <span>{t.termsSection1Title}</span>
            </h2>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {t.termsSection1Desc}
            </p>
          </section>

          <section
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/90 border-slate-200/80'
            }`}
          >
            <h2 className="font-extrabold text-sm sm:text-base mb-1.5 flex items-center gap-2 text-emerald-500">
              <Database className="w-4 h-4" />
              <span>{t.termsSection2Title}</span>
            </h2>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {t.termsSection2Desc}
            </p>
          </section>

          <section
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/90 border-slate-200/80'
            }`}
          >
            <h2 className="font-extrabold text-sm sm:text-base mb-1.5 flex items-center gap-2 text-purple-400">
              <Scale className="w-4 h-4" />
              <span>{t.termsSection3Title}</span>
            </h2>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {t.termsSection3Desc}
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToGameBtn}</span>
          </button>
        </div>
      </article>
    </main>
  );
};
