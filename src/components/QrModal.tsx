import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Share2 } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { getLocalizedShareUrl } from '../utils/urlLang';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  theme: 'dark' | 'light';
  lang: Language;
  spectatorOnly?: boolean;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  theme,
  lang,
  spectatorOnly = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !roomCode) return null;

  const isDark = theme === 'dark';
  const t = translations[lang];
  const joinUrl = getLocalizedShareUrl(lang, roomCode, spectatorOnly);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    joinUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my Bagha Chheli Room (${roomCode})`,
          text: `Come play Odia Bagha Chheli with me! Room Code: ${roomCode}`,
          url: joinUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 md:bg-black/65 md:backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border text-center transition-colors md:backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900 md:bg-slate-900/90 border-white/20 text-white shadow-2xl md:shadow-[0_24px_64px_rgba(0,0,0,0.75)]'
            : 'bg-white md:bg-white/95 border-slate-200 md:border-white text-slate-900 shadow-2xl md:shadow-[0_24px_64px_rgba(15,23,42,0.25)]'
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

        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
          <QrCode className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-black tracking-tight">{t.scanToJoin}</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.scanQrDesc}{' '}
          <span className="font-mono font-bold text-amber-500">{roomCode}</span>
        </p>

        {/* QR Code Box */}
        <div className="my-5 inline-block p-3 rounded-2xl bg-white shadow-inner border border-slate-200">
          <img
            src={qrImageUrl}
            alt={`QR Code for room ${roomCode}`}
            className="w-48 h-48 rounded-lg mx-auto"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.shareLink}</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareLink}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
