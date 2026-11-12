import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  LogIn,
  Sparkles,
  User,
  Bot,
  Eye,
  Radio,
  Users,
  RefreshCw,
  Globe,
  Lightbulb,
  BookOpen,
  ShieldCheck,
  Share2,
  ExternalLink,
  Gamepad2,
  Home,
} from 'lucide-react';
import { isValidRoomCode, normalizeRoomCode, PlayerSide, formatLocalNumber } from '../game/rules';
import { Language, translations } from '../utils/translations';
import { liveLobby, PublicLiveMatch } from '../network/liveLobby';
import { TigerIcon, GoatIcon } from './PieceIcons';

interface RoomLobbyProps {
  onCreateRoom: (
    playerName: string,
    isPublic: boolean,
    smartHints: boolean
  ) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onSpectateRoom: (roomCode: string, spectatorName: string) => void;
  onPlaySolo: (
    playerName: string,
    playerSide: PlayerSide,
    isPublic: boolean,
    smartHints: boolean
  ) => void;
  onPassAndPlay: (playerName: string, smartHints: boolean) => void;
  onOpenTerms: () => void;
  onOpenBlog?: () => void;
  onOpenShareFriend: () => void;
  initialRoomCode?: string;
  errorMsg?: string | null;
  theme: 'dark' | 'light';
  lang: Language;
  defaultPlayerName: string;
  defaultSmartHints: boolean;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onSpectateRoom,
  onPlaySolo,
  onPassAndPlay,
  onOpenTerms,
  onOpenBlog,
  onOpenShareFriend,
  initialRoomCode = '',
  errorMsg,
  theme,
  lang,
  defaultPlayerName,
  defaultSmartHints,
}) => {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [localError, setLocalError] = useState<string | null>(null);
  const [makeOnlinePublic, setMakeOnlinePublic] = useState(true);
  const [makeSoloPublic, setMakeSoloPublic] = useState(true);
  const [onlineSmartHints, setOnlineSmartHints] = useState(defaultSmartHints);
  const [soloSmartHints, setSoloSmartHints] = useState(defaultSmartHints);
  const [soloSide, setSoloSide] = useState<PlayerSide>('TIGER');
  const [liveMatches, setLiveMatches] = useState<PublicLiveMatch[]>([]);

  useEffect(() => {
    if (defaultPlayerName && !playerName) {
      setPlayerName(defaultPlayerName);
    }
  }, [defaultPlayerName]);

  useEffect(() => {
    setOnlineSmartHints(defaultSmartHints);
    setSoloSmartHints(defaultSmartHints);
  }, [defaultSmartHints]);

  useEffect(() => {
    const unsub = liveLobby.subscribe((matches) => {
      setLiveMatches(matches);
    });
    return () => unsub();
  }, []);

  const isDark = theme === 'dark';
  const t = translations[lang];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerName.trim() || defaultPlayerName || 'sb-1a0a';
    onCreateRoom(name, makeOnlinePublic, onlineSmartHints);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeRoomCode(roomCodeInput);
    if (!isValidRoomCode(normalized)) {
      setLocalError(
        lang === 'or'
          ? 'ଦୟାକରି ଏକ ବୈଧ SBXXXX ରୁମ୍ କୋଡ୍ ଲେଖନ୍ତୁ (ଯଥା SB4829)'
          : 'Please enter a valid 6-character room code starting with SB (e.g. SB4829).'
      );
      return;
    }
    setLocalError(null);
    const name = playerName.trim() || defaultPlayerName || 'sb-2b0b';
    onJoinRoom(normalized, name);
  };

  const handleSpectate = () => {
    const normalized = normalizeRoomCode(roomCodeInput);
    if (!isValidRoomCode(normalized)) {
      setLocalError(
        lang === 'or'
          ? 'ଦର୍ଶକ ଭାବେ ଦେଖିବାକୁ ଏକ ବୈଧ SBXXXX ରୁମ୍ କୋଡ୍ ଲେଖନ୍ତୁ'
          : 'Please enter a valid SBXXXX room code to watch.'
      );
      return;
    }
    setLocalError(null);
    const name = playerName.trim() || defaultPlayerName || 'sb-3c0c';
    onSpectateRoom(normalized, name);
  };

  const handleSolo = () => {
    const name = playerName.trim() || defaultPlayerName || 'sb-1a0a';
    onPlaySolo(name, soloSide, makeSoloPublic, soloSmartHints);
  };

  const handlePassAndPlay = () => {
    const name = playerName.trim() || defaultPlayerName || 'sb-1a0a';
    onPassAndPlay(name, soloSmartHints);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-6 relative z-10 w-full max-w-6xl mx-auto">
      <div className="w-full">
        {/* Main Liquid Glass Card */}
        <div
          className={`rounded-3xl p-4 sm:p-7 transition-all duration-300 backdrop-blur-2xl border ${
            isDark
              ? 'bg-slate-900/65 border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.2)]'
              : 'bg-white/80 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)]'
          }`}
        >
          {/* Desktop 2-Column Layout / Mobile Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT SIDE (Desktop): Hero Title, Player Name, Solo vs Computer (AI) & Pass & Play */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
              {/* Hero Badge & Title */}
              <div className="text-center lg:text-left">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border backdrop-blur-md whitespace-nowrap ${
                    isDark
                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.onlineP2p}</span>
                </div>
                <h2
                  className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.heroTitle1}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500">
                    {t.heroTitle2}
                  </span>
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {t.heroDesc}
                </p>
              </div>

              {(errorMsg || localError) && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-semibold text-center lg:text-left backdrop-blur-md">
                  {errorMsg || localError}
                </div>
              )}

              {/* Player Name / Random ID Input */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {t.yourPlayerName}
                </label>
                <div className="relative">
                  <User
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  />
                  <input
                    type="text"
                    maxLength={20}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder={t.enterYourName}
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all backdrop-blur-md ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300/90 text-slate-900 placeholder-slate-400 shadow-inner'
                    }`}
                  />
                </div>
              </div>

              {/* Solo Mode vs Computer (AI) Card */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-emerald-50/80 border-emerald-200/90'
                }`}
              >
                {/* Choose Side vs Computer (AI) (Tiger vs Goat) */}
                <div className="mb-3">
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                  >
                    {t.chooseYourSide}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSoloSide('TIGER')}
                      className={`h-11 flex items-center justify-center gap-2 px-3 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        soloSide === 'TIGER'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-300/50 shadow-md shadow-orange-500/20'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <TigerIcon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{t.playAsTigerSide}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSoloSide('GOAT')}
                      className={`h-11 flex items-center justify-center gap-2 px-3 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        soloSide === 'GOAT'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300/50 shadow-md shadow-emerald-500/20'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GoatIcon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{t.playAsGoatSide}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSolo}
                  type="button"
                  className={`w-full h-12 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] border backdrop-blur-md whitespace-nowrap ${
                    isDark
                      ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-100 border-emerald-400/35 shadow-lg shadow-emerald-500/10'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <Bot className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-black truncate">{t.playSoloBot}</span>
                </button>

                <div className="mt-3 pt-2.5 border-t border-emerald-500/20 space-y-2">
                  {/* Make Solo Match Public Toggle */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={makeSoloPublic}
                      onChange={(e) => setMakeSoloPublic(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <div className="text-left">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isDark ? 'text-emerald-200' : 'text-emerald-900'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        {t.makeRoomPublic}
                      </span>
                      <p
                        className={`text-[11px] leading-snug ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {t.makeRoomPublicSub}
                      </p>
                    </div>
                  </label>

                  {/* Smart Hints Toggle (Disabled by default) */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={soloSmartHints}
                      onChange={(e) => setSoloSmartHints(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="text-left">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isDark ? 'text-amber-300' : 'text-amber-800'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {t.smartHintsMode}
                      </span>
                      <p
                        className={`text-[11px] leading-snug ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {t.smartHintsSub}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Pass & Play (2 Players on 1 Device) + Share with Friend (Uniform h-11 single-line buttons) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePassAndPlay}
                  className={`h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border whitespace-nowrap ${
                    isDark
                      ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border-indigo-500/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{t.passAndPlayBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenShareFriend}
                  className={`h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border whitespace-nowrap ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-emerald-300 border-white/15'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-emerald-700 border-slate-200'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{t.shareWithFriend}</span>
                </button>
              </div>
            </div>

            {/* RIGHT SIDE (Desktop): Create Online Room + Join/Watch Room */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
              {/* Create Online Room Box */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25'
                    : 'bg-amber-50/75 border-amber-200/80'
                }`}
              >
                <button
                  onClick={handleCreate}
                  type="button"
                  className="w-full h-12 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:via-orange-500 hover:to-rose-500 text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99] border border-white/20 whitespace-nowrap"
                >
                  <PlusCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-black truncate">{t.createNewRoom}</span>
                </button>

                <div className="mt-3 pt-2.5 border-t border-amber-500/20 space-y-2">
                  {/* Make Online Room Public Toggle */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={makeOnlinePublic}
                      onChange={(e) => setMakeOnlinePublic(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="text-left">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isDark ? 'text-amber-200' : 'text-amber-950'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        {t.makeRoomPublic}
                      </span>
                      <p
                        className={`text-[11px] leading-snug ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {t.makeRoomPublicSub}
                      </p>
                    </div>
                  </label>

                  {/* Smart Hints Mode for Online Room (Disabled by default) */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlineSmartHints}
                      onChange={(e) => setOnlineSmartHints(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="text-left">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isDark ? 'text-amber-300' : 'text-amber-800'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {t.smartHintsMode}
                      </span>
                      <p
                        className={`text-[11px] leading-snug ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {t.smartHintsSub}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center">
                <div
                  className={`flex-grow border-t ${
                    isDark ? 'border-white/10' : 'border-slate-300/80'
                  }`}
                ></div>
                <span
                  className={`flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {t.orJoinCode}
                </span>
                <div
                  className={`flex-grow border-t ${
                    isDark ? 'border-white/10' : 'border-slate-300/80'
                  }`}
                ></div>
              </div>

              {/* Join or Watch Existing Room Form */}
              <form
                onSubmit={handleJoin}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <label
                  className={`block text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {t.joinExistingRoom}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    value={roomCodeInput}
                    onChange={(e) => {
                      setRoomCodeInput(e.target.value.toUpperCase());
                      if (localError) setLocalError(null);
                    }}
                    placeholder={t.enterRoomCodePlaceholder}
                    className={`flex-1 h-11 px-3.5 rounded-xl border font-mono text-sm font-bold uppercase tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all backdrop-blur-md ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-amber-300 placeholder-slate-500'
                        : 'bg-white border-slate-300/90 text-amber-700 placeholder-slate-400 shadow-inner'
                    }`}
                  />
                  <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                    <button
                      type="submit"
                      className={`h-11 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] border backdrop-blur-md whitespace-nowrap ${
                        isDark
                          ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/30 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-md'
                      }`}
                    >
                      <LogIn className="w-4 h-4 shrink-0" />
                      <span>{t.joinBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSpectate}
                      title={t.watchAsSpectator}
                      className={`h-11 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] border backdrop-blur-md whitespace-nowrap ${
                        isDark
                          ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-400/30'
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
                      }`}
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>{t.watchBtn}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* SEE LIVE MATCHES SECTION */}
        <div
          className={`mt-5 rounded-3xl p-4 sm:p-6 transition-all duration-300 backdrop-blur-2xl border ${
            isDark
              ? 'bg-slate-900/60 border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
              : 'bg-white/80 border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm sm:text-base font-black tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {t.liveMatchesTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    {formatLocalNumber(liveMatches.length, lang)}
                  </span>
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {t.liveMatchesSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => liveLobby.requestRefresh()}
              title={t.refreshMatches}
              className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.refreshMatches}</span>
            </button>
          </div>

          {liveMatches.length === 0 ? (
            <div
              className={`rounded-2xl p-5 text-center border border-dashed ${
                isDark
                  ? 'bg-white/[0.02] border-white/10 text-slate-400'
                  : 'bg-slate-50/70 border-slate-200 text-slate-500'
              }`}
            >
              <p className="text-xs sm:text-sm font-medium">{t.noLiveMatches}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveMatches.map((m) => {
                const isWaiting =
                  m.status === 'waiting' && m.mode === 'online' && !m.guestName;
                return (
                  <div
                    key={m.roomCode}
                    className={`rounded-2xl p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/[0.08] border-white/10'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 whitespace-nowrap">
                          {m.roomCode}
                        </span>
                        {m.mode === 'bot' ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            {t.soloVsAiBadge}
                          </span>
                        ) : m.mode === 'pass' ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 whitespace-nowrap">
                            {t.passAndPlayBadge}
                          </span>
                        ) : isWaiting ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            {t.waitingForOpponentBadge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            {t.inProgressBadge}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <Eye className="w-3 h-3 text-purple-400" />
                          {formatLocalNumber(m.spectatorsCount, lang)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold truncate">
                        <span className="text-amber-500 truncate flex items-center gap-1">
                          <TigerIcon className="w-3.5 h-3.5 inline shrink-0" /> {m.hostName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${
                            isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {t.vs}
                        </span>
                        <span
                          className={`truncate flex items-center gap-1 ${
                            m.guestName
                              ? 'text-emerald-500'
                              : isDark
                              ? 'text-slate-500 italic'
                              : 'text-slate-400 italic'
                          }`}
                        >
                          <GoatIcon className="w-3.5 h-3.5 inline shrink-0" />{' '}
                          {m.guestName || t.waitingTag}
                        </span>
                      </div>

                      <div
                        className={`text-[10px] font-semibold flex items-center gap-3 whitespace-nowrap ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        <span>
                          {t.round} {formatLocalNumber(m.round, lang)}
                        </span>
                        <span>•</span>
                        <span>
                          🐯 {formatLocalNumber(m.scores.TIGER, lang)} -{' '}
                          {formatLocalNumber(m.scores.GOAT, lang)} 🐐
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      {isWaiting && (
                        <button
                          type="button"
                          onClick={() => {
                            const name = playerName.trim() || defaultPlayerName || 'sb-2b0b';
                            onJoinRoom(m.roomCode, name);
                          }}
                          className="h-10 flex-1 sm:flex-initial px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.joinMatchBtn}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const name = playerName.trim() || defaultPlayerName || 'sb-3c0c';
                          onSpectateRoom(m.roomCode, name);
                        }}
                        className={`h-10 flex-1 sm:flex-initial px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
                          isDark
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-400/30'
                            : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.watchMatchBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ABOUT BAGHA CHHELI SECTION */}
        <section
          aria-label="About Bagha Chheli"
          className={`mt-5 rounded-3xl p-4 sm:p-6 transition-all duration-300 backdrop-blur-2xl border ${
            isDark
              ? 'bg-slate-900/55 border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.4)]'
              : 'bg-white/80 border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                className={`text-sm sm:text-base font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.aboutGameSectionTitle}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.aboutGameSectionSub}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200/80'
              }`}
            >
              <h3
                className={`text-xs font-extrabold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-700'
                }`}
              >
                <TigerIcon className="w-4 h-4 shrink-0" />
                {t.aboutCard1Title}
              </h3>
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.aboutCard1Desc}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200/80'
              }`}
            >
              <h3
                className={`text-xs font-extrabold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                <GoatIcon className="w-4 h-4 shrink-0" />
                {t.aboutCard2Title}
              </h3>
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.aboutCard2Desc}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200/80'
              }`}
            >
              <h3
                className={`text-xs font-extrabold mb-1 ${
                  isDark ? 'text-purple-300' : 'text-purple-700'
                }`}
              >
                {t.aboutCard3Title}
              </h3>
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.aboutCard3Desc}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200/80'
              }`}
            >
              <h3
                className={`text-xs font-extrabold mb-1 ${
                  isDark ? 'text-sky-300' : 'text-sky-700'
                }`}
              >
                {t.aboutCard4Title}
              </h3>
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.aboutCard4Desc}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px]">
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.footerText}</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <a
                href="https://imsbg.github.io/desigames/"
                target="_blank"
                rel="noopener noreferrer"
                className={`h-9 inline-flex items-center gap-1.5 font-bold px-3 rounded-xl border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-orange-500/15 hover:bg-orange-500/25 text-amber-300 border-orange-500/30'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{t.homeMenuBtn}</span>
                <ExternalLink className="w-3 h-3 opacity-75 shrink-0" />
              </a>

              <a
                href="https://desibingo.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`h-9 inline-flex items-center gap-1.5 font-bold px-3 rounded-xl border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                <span>{t.playDesiBingoBtn}</span>
                <ExternalLink className="w-3 h-3 opacity-75 shrink-0" />
              </a>

              {onOpenBlog && (
                <button
                  type="button"
                  onClick={onOpenBlog}
                  className={`h-9 inline-flex items-center gap-1.5 font-bold px-3 rounded-xl border transition-all whitespace-nowrap ${
                    isDark
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t.readFullGuideBtn}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenTerms}
                className={`h-9 inline-flex items-center gap-1.5 font-bold px-3 rounded-xl border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{t.termsAndConditions}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
