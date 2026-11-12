import React, { useState, useEffect } from 'react';
import { Eye, X, User } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { GoatIcon } from './PieceIcons';
import { generateRandomPlayerId } from '../game/rules';
import { liveLobby } from '../network/liveLobby';
import { probeRoomHasTwoPlayers } from '../network/webrtc';

interface JoinInviteModalProps {
  isOpen: boolean;
  roomCode: string | null;
  defaultName: string;
  onJoinAsPlayer: (roomCode: string, name: string) => void;
  onJoinAsSpectator: (roomCode: string, name: string) => void;
  onClose: () => void;
  theme: 'dark' | 'light';
  lang: Language;
  forceSpectator?: boolean;
}

export const JoinInviteModal: React.FC<JoinInviteModalProps> = ({
  isOpen,
  roomCode,
  defaultName,
  onJoinAsPlayer,
  onJoinAsSpectator,
  onClose,
  theme,
  lang,
  forceSpectator = false,
}) => {
  const [name, setName] = useState(defaultName);
  const [lobbyMatches, setLobbyMatches] = useState<ReturnType<typeof liveLobby.getMatches>>(() =>
    liveLobby.getMatches()
  );
  const [probedFull, setProbedFull] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !roomCode) {
      setProbedFull(false);
      return;
    }

    const unsubLobby = liveLobby.subscribe((matches) => {
      setLobbyMatches(matches);
    });

    const stopProbe = probeRoomHasTwoPlayers(roomCode, (isFull) => {
      if (isFull) {
        setProbedFull(true);
      }
    });

    return () => {
      unsubLobby();
      stopProbe();
    };
  }, [isOpen, roomCode]);

  if (!isOpen || !roomCode) return null;

  const isDark = theme === 'dark';
  const t = translations[lang];

  const existingMatch = lobbyMatches.find(
    (m) => m.roomCode.toUpperCase() === roomCode.toUpperCase()
  );

  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const urlForcesSpectator = Boolean(
    urlParams &&
      (urlParams.get('watch') === '1' ||
        urlParams.get('spectate') === '1' ||
        urlParams.get('mode') === 'bot' ||
        urlParams.get('mode') === 'pass')
  );

  const isRoomAlreadyFull = Boolean(
    forceSpectator ||
      urlForcesSpectator ||
      probedFull ||
      (existingMatch &&
        (existingMatch.mode !== 'online' ||
          existingMatch.status !== 'waiting' ||
          Boolean(existingMatch.guestName)))
  );

  const handlePlayer = () => {
    if (isRoomAlreadyFull) {
      onJoinAsSpectator(roomCode, name.trim() || generateRandomPlayerId());
      return;
    }
    onJoinAsPlayer(roomCode, name.trim() || generateRandomPlayerId());
  };

  const handleSpectator = () => {
    onJoinAsSpectator(roomCode, name.trim() || generateRandomPlayerId());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 border transition-all backdrop-blur-2xl ${
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

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 mb-2">
            <span>{t.joinModalSubtitle}</span>
            <span className="font-mono tracking-wider">{roomCode}</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">{t.joinModalTitle}</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t.chooseHowToEnter}
          </p>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label
            className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.enterYourName}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-2.5">
          {!isRoomAlreadyFull ? (
            <button
              onClick={handlePlayer}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-left flex items-center gap-3.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <GoatIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black">{t.playAsPlayer}</div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  {t.joinAsPlayerDesc}
                </div>
              </div>
            </button>
          ) : (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold text-center ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {t.watchingLiveDesc}
            </div>
          )}

          <button
            onClick={handleSpectator}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all active:scale-[0.99] ${
              isDark
                ? 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-400/30 text-purple-100'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-950'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black">{t.watchAsSpectator}</div>
              <div
                className={`text-[11px] font-medium ${
                  isDark ? 'text-purple-300/80' : 'text-purple-700'
                }`}
              >
                {t.joinAsSpectatorDesc}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
