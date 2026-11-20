import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Wifi,
  WifiOff,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  HelpCircle,
  QrCode,
  Languages,
  Eye,
  Settings,
  Menu,
  X,
  Share2,
  Home,
} from 'lucide-react';
import { ConnectionStatus } from '../network/webrtc';
import { Language, translations } from '../utils/translations';
import { TigerIcon } from './PieceIcons';

interface RoomHeaderProps {
  roomCode: string | null;
  status: ConnectionStatus;
  onLeave: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHowToPlay: () => void;
  onOpenQr: () => void;
  onOpenSettings: () => void;
  onOpenShareFriend: () => void;
  lang: Language;
  onToggleLang: () => void;
  spectatorsCount?: number;
  isSpectator?: boolean;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomCode,
  status,
  onLeave,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenHowToPlay,
  onOpenQr,
  onOpenSettings,
  onOpenShareFriend,
  lang,
  onToggleLang,
  spectatorsCount = 0,
  isSpectator = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const t = translations[lang];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full sticky top-0 z-50 px-2.5 sm:px-4 pt-2 pb-1.5 md:backdrop-blur-md">
      <div
        className={`max-w-6xl mx-auto rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 transition-colors duration-300 md:backdrop-blur-2xl border ${
          isDark
            ? 'bg-slate-900/95 md:bg-slate-900/85 border-white/15 shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]'
            : 'bg-white/95 md:bg-white/90 border-slate-200/90 shadow-md md:shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)]'
        }`}
      >
        {/* Brand Logo (Tiger Face SVG) & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
            title={t.appTitle}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center shadow-md shadow-orange-500/15 border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <TigerIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="shrink-0">
              <h1
                className={`text-sm sm:text-base font-black tracking-tight leading-none whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.appTitle}
              </h1>
              <p
                className={`text-[10px] font-medium mt-0.5 whitespace-nowrap ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {t.appSubtitle}
              </p>
            </div>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {roomCode && (
            <>
              {/* Room Code Pill + QR Button */}
              <div
                className={`h-9 sm:h-10 flex items-center gap-1 border rounded-xl pl-2.5 pr-1 md:backdrop-blur-md transition-colors shrink-0 ${
                  isDark
                    ? 'bg-white/5 border-white/15'
                    : 'bg-slate-900/5 border-slate-300/80'
                }`}
              >
                <button
                  type="button"
                  onClick={copyCode}
                  title={t.copyRoomCode}
                  className="flex items-center gap-1.5 pr-1 hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-500 tracking-wider">
                    {roomCode}
                  </span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />
                  )}
                </button>
                <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
                <button
                  type="button"
                  onClick={onOpenQr}
                  title={t.showQr}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Spectator Count Pill */}
              {(spectatorsCount > 0 || isSpectator) && (
                <div
                  className={`hidden sm:flex h-10 items-center gap-1.5 px-2.5 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 ${
                    isSpectator
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : isDark
                      ? 'bg-white/5 text-slate-300 border-white/15'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title={`${t.spectatorsCount}: ${spectatorsCount}`}
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{spectatorsCount}</span>
                </div>
              )}

              {/* Connection Status Pill */}
              <div
                className={`hidden lg:flex h-10 items-center gap-1.5 px-3 rounded-xl text-xs font-bold border backdrop-blur-md whitespace-nowrap shrink-0 ${
                  status === 'connected'
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : status === 'waiting_for_peer' ||
                      status === 'connecting' ||
                      status === 'reconnecting'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                }`}
              >
                {status === 'connected' && <Wifi className="w-3.5 h-3.5 shrink-0" />}
                {(status === 'waiting_for_peer' ||
                  status === 'connecting' ||
                  status === 'reconnecting') && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                )}
                {(status === 'disconnected' || status === 'error') && (
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {lang === 'or'
                    ? status === 'connected'
                      ? 'ସଂଯୁକ୍ତ'
                      : 'ଅପେକ୍ଷା'
                    : status === 'waiting_for_peer'
                    ? 'Waiting'
                    : status === 'connected'
                    ? 'Connected'
                    : status}
                </span>
              </div>
            </>
          )}

          {/* Desktop Controls (Uniform height h-10, whitespace-nowrap, no multi-line wrapping) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {/* Home Button to DesiGames Hub */}
            <a
              href="https://imsbg.github.io/desigames/"
              target="_blank"
              rel="noopener noreferrer"
              title={t.homeMenuBtn}
              className={`h-10 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all backdrop-blur-md whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-orange-500/15 hover:bg-orange-500/25 text-amber-300 border-orange-500/30'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
              }`}
            >
              <Home className="w-4 h-4 text-orange-500 shrink-0" />
              <span>{t.homeMenuBtn}</span>
            </a>

            {/* Share with Friend Button */}
            <button
              type="button"
              onClick={onOpenShareFriend}
              title={t.shareWithFriend}
              className={`h-10 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all backdrop-blur-md whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="hidden lg:inline">{t.shareWithFriend}</span>
            </button>

            {/* Language Switcher (English / ଓଡ଼ିଆ) */}
            <button
              type="button"
              onClick={onToggleLang}
              title={lang === 'en' ? 'ଓଡ଼ିଆ' : 'English'}
              className={`h-10 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all backdrop-blur-md whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-amber-700 border-slate-300/80'
              }`}
            >
              <Languages className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{lang === 'en' ? 'ଓଡ଼ିଆ' : 'EN'}</span>
            </button>

            {/* How to Play Guide Button */}
            <button
              type="button"
              onClick={onOpenHowToPlay}
              title={t.howToPlay}
              className={`h-10 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all backdrop-blur-md whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t.howToPlay}</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? t.soundOn : t.soundOff}
              className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all backdrop-blur-md shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? t.lightMode : t.darkMode}
              className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all backdrop-blur-md shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title={t.settingsTitle}
              className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all backdrop-blur-md shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>

            {roomCode && (
              <button
                type="button"
                onClick={onLeave}
                title={t.leaveRoom}
                className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-colors backdrop-blur-md shrink-0 ${
                  isDark
                    ? 'bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-white/15 hover:border-rose-500/30'
                    : 'bg-slate-900/5 hover:bg-rose-500/15 text-slate-600 hover:text-rose-600 border-slate-300/80 hover:border-rose-400/40'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile 3-Line Menu Button */}
          <div className="relative md:hidden shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open Menu"
              className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-white border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 border-slate-300/80'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {mobileMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-60 rounded-2xl p-2 border shadow-2xl z-50 flex flex-col gap-1 ${
                  isDark
                    ? 'bg-slate-900 border-white/15 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {/* Home Link to DesiGames Hub */}
                <a
                  href="https://imsbg.github.io/desigames/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10 text-amber-300' : 'hover:bg-slate-100 text-orange-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-orange-500 shrink-0" />
                    {t.homeMenuBtn}
                  </span>
                </a>

                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleLang();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Languages className="w-4 h-4 text-amber-500 shrink-0" />
                    {lang === 'or' ? 'ଭାଷା ବଦଳାନ୍ତୁ' : 'Switch Language'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-black">
                    {lang === 'en' ? 'ଓଡ଼ିଆ' : 'EN'}
                  </span>
                </button>

                {/* Share with Friend */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenShareFriend();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10 text-emerald-300' : 'hover:bg-slate-100 text-emerald-700'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t.shareWithFriend}</span>
                </button>

                {/* How to Play */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenHowToPlay();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.howToPlay}</span>
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleSound();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    {soundEnabled ? t.soundOn : t.soundOff}
                  </span>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  }`}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  )}
                  <span>{isDark ? t.lightMode : t.darkMode}</span>
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t.settingsTitle}</span>
                </button>

                {/* Leave Room (if in room) */}
                {roomCode && (
                  <>
                    <div className={`my-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <button
                      type="button"
                      onClick={() => {
                        onLeave();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/15 transition-colors whitespace-nowrap"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{t.leaveRoom}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
