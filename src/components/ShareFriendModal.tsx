import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { buildFriendSharePayload } from '../utils/urlLang';

interface ShareFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  theme: 'dark' | 'light';
  lang: Language;
  onToggleLang: () => void;
  spectatorOnly?: boolean;
}

export const ShareFriendModal: React.FC<ShareFriendModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  theme,
  lang,
  onToggleLang,
  spectatorOnly = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const t = translations[lang];
  const payload = buildFriendSharePayload(lang, roomCode || undefined, spectatorOnly);
  const fullShareMessage = `${payload.text}\n${payload.url}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullShareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
      payload.url
    )}&text=${encodeURIComponent(payload.text)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 border transition-all backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900/95 border-white/20 text-white shadow-[0_24px_64px_rgba(0,0,0,0.8)]'
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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">{t.shareModalTitle}</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.shareModalSubtitle}
            </p>
          </div>
        </div>

        {/* Language URL Path Selector Pill */}
        <div
          className={`p-3 rounded-2xl border mb-4 flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-white/[0.04] border-white/10'
              : 'bg-slate-50 border-slate-200/90'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {t.languagePathBadge}
              </div>
              <div className="font-mono text-xs font-extrabold text-amber-500 truncate">
                {lang === 'or' ? '/odia' : '/en'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleLang}
            className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/30'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
            }`}
          >
            {lang === 'en' ? 'ଓଡ଼ିଆ' : 'English'}
          </button>
        </div>

        {/* Share Preview Box */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 text-left space-y-1.5 ${
            isDark
              ? 'bg-slate-950/60 border-white/10 text-slate-200'
              : 'bg-slate-100/90 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
              <Sparkles className="w-3 h-3" />
              {roomCode ? (lang === 'or' ? `ରୁମ୍ ${roomCode}` : `Room ${roomCode}`) : t.appTitle}
            </span>
          </div>
          <p className="text-xs whitespace-pre-line leading-relaxed font-medium">
            {payload.text}
          </p>
          <p className="text-xs font-mono font-bold text-amber-500 break-all pt-1">
            {payload.url}
          </p>
        </div>

        <p
          className={`text-[11px] mb-4 text-center ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {roomCode ? t.shareRoomHint : t.shareAppHint}
        </p>

        {/* Quick Share Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.shareWhatsApp}</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>{t.shareTelegram}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-100'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">{t.copiedShareLink}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.copyShareLink}</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareNative}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
