import React, { useState } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Lightbulb,
  Trash2,
  User,
  Check,
  Languages,
  Hash,
  EyeOff,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { liveLobby } from '../network/liveLobby';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lang: Language;
  onToggleLang: () => void;
  defaultPlayerName: string;
  onSaveDefaultName: (name: string) => void;
  defaultSmartHints: boolean;
  onToggleDefaultSmartHints: () => void;
  showBoardCoords: boolean;
  onToggleShowBoardCoords: () => void;
  hideSpectatorReactions?: boolean;
  onToggleHideSpectatorReactions?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  lang,
  onToggleLang,
  defaultPlayerName,
  onSaveDefaultName,
  defaultSmartHints,
  onToggleDefaultSmartHints,
  showBoardCoords,
  onToggleShowBoardCoords,
  hideSpectatorReactions = false,
  onToggleHideSpectatorReactions,
}) => {
  const [nameInput, setNameInput] = useState(defaultPlayerName);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const t = translations[lang];

  const handleClearCache = () => {
    liveLobby.clearPhoneCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleSaveAndClose = () => {
    onSaveDefaultName(nameInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 md:bg-black/65 md:backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border transition-colors md:backdrop-blur-2xl ${
          isDark
            ? 'bg-slate-900 md:bg-slate-900/90 border-white/20 text-white shadow-2xl md:shadow-[0_24px_64px_rgba(0,0,0,0.75)]'
            : 'bg-white md:bg-white/95 border-slate-200 md:border-white text-slate-900 shadow-2xl md:shadow-[0_24px_64px_rgba(15,23,42,0.25)]'
        }`}
      >
        <button
          onClick={handleSaveAndClose}
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {t.settingsTitle}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm">
          {/* Default Player Name */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
              {t.defaultNameSetting}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                maxLength={20}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t.enterYourName}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark
                    ? 'bg-slate-950/60 border-white/15 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Theme Switch */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold">
              {isDark ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{t.themeSetting}</span>
            </div>
            <button
              onClick={onToggleTheme}
              className={`h-8 px-3 rounded-xl font-bold text-xs border transition-all whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-900 text-white border-slate-900'
              }`}
            >
              {isDark ? t.themeDark : t.themeLight}
            </button>
          </div>

          {/* Sound Effects */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>{t.soundEffectsSetting}</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`h-8 px-3 rounded-xl font-bold text-xs border transition-all whitespace-nowrap shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isDark
                  ? 'bg-white/5 text-slate-400 border-white/10'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              {soundEnabled ? (lang === 'or' ? 'ଅନ୍' : 'ON') : (lang === 'or' ? 'ଅଫ୍' : 'OFF')}
            </button>
          </div>

          {/* Language Switch */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold">
              <Languages className="w-4 h-4 text-amber-500" />
              <span>{lang === 'or' ? 'ଭାଷା' : 'Language'}</span>
            </div>
            <button
              onClick={onToggleLang}
              className="h-8 px-3 rounded-xl font-bold text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0"
            >
              {lang === 'en' ? 'ଓଡ଼ିଆ' : 'English'}
            </button>
          </div>

          {/* Smart Hints Default */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{t.smartHintsSetting}</span>
              </div>
              <p className="text-[11px] opacity-70 mt-0.5">{t.smartHintsSub}</p>
            </div>
            <button
              onClick={onToggleDefaultSmartHints}
              className={`h-8 px-3 rounded-xl font-bold text-xs border transition-all whitespace-nowrap shrink-0 ${
                defaultSmartHints
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : isDark
                  ? 'bg-white/5 text-slate-400 border-white/10'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              {defaultSmartHints ? (lang === 'or' ? 'ଅନ୍' : 'ON') : (lang === 'or' ? 'ଅଫ୍' : 'OFF')}
            </button>
          </div>

          {/* Show Board Coordinate Numbers */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold">
                <Hash className="w-4 h-4 text-emerald-500" />
                <span>{t.boardCoordsSetting}</span>
              </div>
              <p className="text-[11px] opacity-70 mt-0.5">{t.boardCoordsDesc}</p>
            </div>
            <button
              onClick={onToggleShowBoardCoords}
              className={`h-8 px-3 rounded-xl font-bold text-xs border transition-all whitespace-nowrap shrink-0 ${
                showBoardCoords
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isDark
                  ? 'bg-white/5 text-slate-400 border-white/10'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              {showBoardCoords ? (lang === 'or' ? 'ଅନ୍' : 'ON') : (lang === 'or' ? 'ଅଫ୍' : 'OFF')}
            </button>
          </div>

          {/* Hide Emoji Notifications from Spectators */}
          {onToggleHideSpectatorReactions && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 font-bold">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span>{t.hideSpectatorEmojisSetting}</span>
                </div>
                <p className="text-[11px] opacity-70 mt-0.5">{t.hideSpectatorEmojisDesc}</p>
              </div>
              <button
                type="button"
                onClick={onToggleHideSpectatorReactions}
                data-testid="toggle-hide-spectator-emojis-btn"
                className={`h-8 px-3 rounded-xl font-bold text-xs border transition-all whitespace-nowrap shrink-0 ${
                  hideSpectatorReactions
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : isDark
                    ? 'bg-white/5 text-slate-400 border-white/10'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}
              >
                {hideSpectatorReactions ? (lang === 'or' ? 'ଅନ୍' : 'ON') : (lang === 'or' ? 'ଅଫ୍' : 'OFF')}
              </button>
            </div>
          )}

          {/* Clear Phone Cache */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-rose-500">
              <Trash2 className="w-4 h-4" />
              <span>{t.clearHistoryBtn}</span>
            </div>
            <button
              onClick={handleClearCache}
              className="h-8 px-3 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 transition-all whitespace-nowrap shrink-0"
            >
              {cacheCleared ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t.cacheClearedMsg}
                </span>
              ) : lang === 'or' ? (
                'ସଫା କରନ୍ତୁ'
              ) : (
                'Clear'
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveAndClose}
          className="mt-5 w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all whitespace-nowrap"
        >
          {t.saveAndClose}
        </button>
      </div>
    </div>
  );
};
