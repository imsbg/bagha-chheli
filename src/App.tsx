/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';
import {
  WebRTCNetworkRoom,
  RoomGameState,
  ConnectionStatus,
  NetworkRole,
  PlayerInfo,
} from './network/webrtc';
import {
  generateRoomCode,
  generateRandomPlayerId,
  normalizeRoomCode,
  isValidRoomCode,
  getBestBotAction,
  PlayerSide,
} from './game/rules';
import { RoomHeader } from './components/RoomHeader';
import { RoomLobby } from './components/RoomLobby';
import { GameBoard } from './components/GameBoard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { QrModal } from './components/QrModal';
import { JoinInviteModal } from './components/JoinInviteModal';
import { GameDataFooter } from './components/GameDataFooter';
import { SettingsModal } from './components/SettingsModal';
import { TermsPage } from './components/TermsPage';
import { ShareFriendModal } from './components/ShareFriendModal';
import { PromoBanner } from './components/PromoBanner';
import { BaghaChheliBlogPage } from './components/BaghaChheliBlogPage';
import { ActiveReaction } from './components/ReactionFloater';
import { sound } from './utils/sound';
import { Language, translations } from './utils/translations';
import { liveLobby } from './network/liveLobby';
import {
  AppViewMode,
  getInitialLanguageFromUrl,
  getInitialViewFromUrl,
  syncUrlWithLanguageAndView,
} from './utils/urlLang';

export default function App() {
  const [gameState, setGameState] = useState<RoomGameState | null>(null);
  const [localRole, setLocalRole] = useState<NetworkRole>('host');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [inviteModalCode, setInviteModalCode] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'online' | 'bot' | 'pass' | null>(null);
  const [isPublicRoom, setIsPublicRoom] = useState<boolean>(true);
  const [reactions, setReactions] = useState<ActiveReaction[]>([]);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('baghachheli_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore
    }
    return 'dark';
  });

  const [lang, setLang] = useState<Language>(() => getInitialLanguageFromUrl());
  const [viewMode, setViewMode] = useState<AppViewMode>(() => getInitialViewFromUrl());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.enabled);

  const [defaultPlayerName, setDefaultPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('baghachheli_default_name_v2');
      if (saved && saved.trim() && !saved.toLowerCase().includes('subham')) {
        return saved.trim();
      }
      const randomId = generateRandomPlayerId();
      localStorage.setItem('baghachheli_default_name_v2', randomId);
      return randomId;
    } catch {
      return generateRandomPlayerId();
    }
  });

  // Smart Strategy Hints disabled by default
  const [defaultSmartHints, setDefaultSmartHints] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('baghachheli_default_smart_hints_v2');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [showBoardCoords, setShowBoardCoords] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('baghachheli_show_coords');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareFriendOpen, setIsShareFriendOpen] = useState<boolean>(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState<boolean>(false);

  const networkRef = useRef<WebRTCNetworkRoom | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());
  const lastTrackedMoveCountRef = useRef<number>(0);
  const gameStateRef = useRef<RoomGameState | null>(null);
  gameStateRef.current = gameState;

  // Sync URL path & SEO tags on initial load and when language or viewMode changes
  useEffect(() => {
    syncUrlWithLanguageAndView(lang, viewMode, true);
  }, [lang, viewMode]);

  // Listen to browser Back/Forward navigation and prevent accidental exit during active game
  useEffect(() => {
    const handlePopState = () => {
      if (gameStateRef.current) {
        try {
          window.history.pushState({ inGame: true }, '');
        } catch {
          // Ignore
        }
        setIsLeaveConfirmOpen(true);
        return;
      }
      setLang(getInitialLanguageFromUrl());
      setViewMode(getInitialViewFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Warn before closing/reloading tab when a match is actively playing
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState?.status]);

  // Check URL query parameter `?room=SBXXXX` on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const normalized = normalizeRoomCode(roomParam);
      if (isValidRoomCode(normalized)) {
        setInitialRoomCode(normalized);
        setInviteModalCode(normalized);
      }
    }
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    sound.playClick();
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('baghachheli_theme', next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleLang = () => {
    sound.playClick();
    setLang((prev) => (prev === 'en' ? 'or' : 'en'));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  const handleSaveDefaultName = (name: string) => {
    const finalName = name.trim() || generateRandomPlayerId();
    setDefaultPlayerName(finalName);
    try {
      localStorage.setItem('baghachheli_default_name_v2', finalName);
    } catch {
      // Ignore
    }
  };

  const toggleDefaultSmartHints = () => {
    sound.playClick();
    setDefaultSmartHints((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('baghachheli_default_smart_hints_v2', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleShowBoardCoords = () => {
    sound.playClick();
    setShowBoardCoords((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('baghachheli_show_coords', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const pushReaction = useCallback(
    (emoji: string, senderName: string, senderSide: PlayerSide | 'SPECTATOR') => {
      sound.playReaction();
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setReactions((prev) => [...prev.slice(-8), { id, emoji, senderName, senderSide }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2800);
    },
    []
  );

  // Track board move activity
  useEffect(() => {
    if (!gameState) {
      lastTrackedMoveCountRef.current = 0;
      return;
    }
    if (gameState.currentRoundMoves.length !== lastTrackedMoveCountRef.current) {
      lastTrackedMoveCountRef.current = gameState.currentRoundMoves.length;
      lastActivityAtRef.current = Date.now();
    }
  }, [gameState?.currentRoundMoves.length, gameState?.round]);

  // Announce or update public match in LiveLobbyRegistry when hosting
  useEffect(() => {
    if (!gameState || localRole !== 'host' || !isPublicRoom) return;

    const publish = () => {
      const status =
        gameMode === 'online' && !gameState.players.guest?.connected
          ? 'waiting'
          : gameState.status;

      liveLobby.announceMatch({
        roomCode: gameState.roomCode,
        hostName: gameState.players.host.name,
        guestName: gameState.players.guest?.name || null,
        status,
        mode: gameMode === 'bot' ? 'bot' : gameMode === 'pass' ? 'pass' : 'online',
        spectatorsCount: gameState.spectators.length,
        scores: gameState.scores,
        round: gameState.round,
        goatsCaptured: gameState.goatsCaptured,
        goatsPlacedTotal: gameState.goatsPlacedTotal,
        updatedAt: Date.now(),
        lastActivityAt: lastActivityAtRef.current,
      });
    };

    publish();
    const interval = setInterval(publish, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [gameState, localRole, isPublicRoom, gameMode]);

  const startNetworkRoom = useCallback(
    (
      code: string,
      role: NetworkRole,
      playerName: string,
      mode: 'online' | 'bot' | 'pass',
      makePublic: boolean,
      initialGuestOverride?: PlayerInfo | null,
      smartHintsEnabled: boolean = false,
      hostSide: PlayerSide = 'TIGER'
    ) => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      setErrorMsg(null);
      setLocalRole(role);
      setGameMode(mode);
      setIsPublicRoom(makePublic);
      setInviteModalCode(null);
      setIsLeaveConfirmOpen(false);
      lastActivityAtRef.current = Date.now();
      lastTrackedMoveCountRef.current = 0;

      const room = new WebRTCNetworkRoom(
        code,
        role,
        playerName,
        {
          onStateChange: (newState) => {
            setGameState({ ...newState });
          },
          onStatusChange: (status, err) => {
            setConnectionStatus(status);
            if (err) setErrorMsg(err);
          },
          onRoleChange: (newRole) => {
            setLocalRole(newRole);
          },
          onReaction: (emoji, senderName, senderSide) => {
            pushReaction(emoji, senderName, senderSide);
          },
          onActionSound: (actionType, side) => {
            if (actionType === 'capture') {
              sound.playCapture();
            } else {
              sound.playMove(side);
            }
          },
        },
        initialGuestOverride,
        smartHintsEnabled,
        hostSide
      );

      networkRef.current = room;
      setGameState({ ...room.getState() });

      try {
        const url = new URL(window.location.href);
        url.searchParams.set('room', code);
        if (role === 'host' && (mode === 'bot' || mode === 'pass')) {
          url.searchParams.set('watch', '1');
        } else if (role === 'host') {
          url.searchParams.delete('watch');
        }
        window.history.pushState({ inGame: true }, '', url.toString());
      } catch {
        // Ignore URL update errors
      }
    },
    [pushReaction]
  );

  // Keep browser URL bar `watch=1` synced when hosting so copying the address bar URL directly
  // during Solo AI, Local Friend, or a full 2-player match automatically forces Spectator mode
  useEffect(() => {
    if (!gameState || localRole !== 'host') return;
    try {
      const url = new URL(window.location.href);
      const shouldForceSpectatorLink =
        gameMode === 'bot' ||
        gameMode === 'pass' ||
        Boolean(gameState.players.guest?.connected);
      if (shouldForceSpectatorLink) {
        url.searchParams.set('watch', '1');
      } else {
        url.searchParams.delete('watch');
      }
      window.history.replaceState({ inGame: true }, '', url.toString());
    } catch {
      // Ignore URL update errors
    }
  }, [gameState?.players.guest?.connected, gameMode, localRole]);

  const handleCreateRoom = (
    playerName: string,
    makePublic: boolean,
    smartHints: boolean
  ) => {
    sound.playClick();
    if (playerName.trim()) {
      handleSaveDefaultName(playerName.trim());
    }
    const newCode = generateRoomCode();
    startNetworkRoom(newCode, 'host', playerName, 'online', makePublic, null, smartHints, 'TIGER');
  };

  const handleJoinRoom = (code: string, playerName: string) => {
    sound.playClick();
    if (playerName.trim()) {
      handleSaveDefaultName(playerName.trim());
    }
    startNetworkRoom(code, 'guest', playerName, 'online', false);
  };

  const handleSpectateRoom = (code: string, spectatorName: string) => {
    sound.playClick();
    if (spectatorName.trim()) {
      handleSaveDefaultName(spectatorName.trim());
    }
    startNetworkRoom(code, 'spectator', spectatorName, 'online', false);
  };

  const handlePlaySolo = (
    playerName: string,
    playerSide: PlayerSide,
    makePublic: boolean,
    smartHints: boolean
  ) => {
    sound.playClick();
    if (playerName.trim()) {
      handleSaveDefaultName(playerName.trim());
    }
    const newCode = generateRoomCode();
    const botSide: PlayerSide = playerSide === 'TIGER' ? 'GOAT' : 'TIGER';
    const botGuest: PlayerInfo = {
      id: 'bot',
      name: translations[lang].botName,
      role: 'guest',
      side: botSide,
      connected: true,
    };
    startNetworkRoom(
      newCode,
      'host',
      playerName,
      'bot',
      makePublic,
      botGuest,
      smartHints,
      playerSide
    );
  };

  const handlePassAndPlay = (playerName: string, smartHints: boolean) => {
    sound.playClick();
    if (playerName.trim()) {
      handleSaveDefaultName(playerName.trim());
    }
    const newCode = generateRoomCode();
    const localPlayer2: PlayerInfo = {
      id: 'local-guest',
      name: lang === 'or' ? 'ଖେଳାଳି ୨ (ଛେଳି)' : 'Player 2 (Goat)',
      role: 'guest',
      side: 'GOAT',
      connected: true,
    };
    startNetworkRoom(
      newCode,
      'host',
      playerName.trim() || (lang === 'or' ? 'ଖେଳାଳି ୧ (ବାଘ)' : 'Player 1 (Tiger)'),
      'pass',
      true,
      localPlayer2,
      smartHints,
      'TIGER'
    );
  };

  // Trigger AI Bot Move when it's Bot's turn in Solo Mode
  useEffect(() => {
    if (gameMode !== 'bot' || !gameState) return;
    const botSide = gameState.players.guest?.side;
    if (
      gameState.status === 'playing' &&
      botSide &&
      gameState.currentTurn === botSide
    ) {
      botTimeoutRef.current = setTimeout(() => {
        const botMove = getBestBotAction(gameState);
        if (botMove && networkRef.current) {
          networkRef.current.performBoardAction(botMove.from, botMove.to, botSide);
        }
      }, 480);
    }
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [
    gameMode,
    gameState?.status,
    gameState?.currentTurn,
    gameState?.board,
    gameState?.phase,
  ]);

  const handleBoardAction = (
    from: number | null,
    to: number,
    overrideSide?: PlayerSide
  ) => {
    if (!networkRef.current || !gameState) return;
    lastActivityAtRef.current = Date.now();
    networkRef.current.performBoardAction(from, to, overrideSide);
  };

  const handleRequestRematch = () => {
    sound.playRematch();
    lastActivityAtRef.current = Date.now();
    if ((gameMode === 'bot' || gameMode === 'pass') && networkRef.current) {
      networkRef.current.forceBotRematch();
      return;
    }
    networkRef.current?.requestRematch();
  };

  const handleSendReaction = (emoji: string) => {
    if (!gameState || !networkRef.current) return;
    const senderSide: PlayerSide | 'SPECTATOR' =
      localRole === 'host'
        ? gameState.players.host.side
        : localRole === 'guest'
        ? gameState.players.guest?.side || 'GOAT'
        : 'SPECTATOR';

    const senderName = networkRef.current.localName;
    pushReaction(emoji, senderName, senderSide);
    networkRef.current.sendReaction(emoji);
  };

  // Actually leaves the room after user confirms
  const executeLeaveRoom = () => {
    sound.playClick();
    setIsLeaveConfirmOpen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    if (gameState && localRole === 'host' && isPublicRoom) {
      liveLobby.removeMatch(gameState.roomCode);
    }
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }
    setGameState(null);
    setGameMode(null);
    setConnectionStatus('disconnected');
    setErrorMsg(null);
    setReactions([]);
    setIsQrModalOpen(false);
    setViewMode('game');

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('watch');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore URL update errors
    }
  };

  // Asks for confirmation before leaving an active game room
  const handleRequestLeaveRoom = () => {
    sound.playClick();
    if (gameState) {
      setIsLeaveConfirmOpen(true);
    } else {
      executeLeaveRoom();
    }
  };

  const isDark = theme === 'dark';
  const t = translations[lang];

  if (viewMode === 'blog') {
    return (
      <BaghaChheliBlogPage
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPlayHere={() => setViewMode('game')}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-white relative transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Ambient Liquid Glass Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-28 -left-28 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-amber-600/20 opacity-90' : 'bg-amber-400/25 opacity-80'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-28 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-emerald-600/20 opacity-85' : 'bg-emerald-400/25 opacity-75'
          }`}
        />
        <div
          className={`absolute -bottom-28 left-1/4 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-orange-600/15 opacity-80' : 'bg-orange-300/25 opacity-70'
          }`}
        />
      </div>

      <RoomHeader
        roomCode={gameState?.roomCode || null}
        status={connectionStatus}
        onLeave={handleRequestLeaveRoom}
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenHowToPlay={() => {
          sound.playClick();
          setIsHowToPlayOpen(true);
        }}
        onOpenQr={() => {
          sound.playClick();
          setIsQrModalOpen(true);
        }}
        onOpenSettings={() => {
          sound.playClick();
          setIsSettingsOpen(true);
        }}
        onOpenShareFriend={() => {
          sound.playClick();
          setIsShareFriendOpen(true);
        }}
        lang={lang}
        onToggleLang={toggleLang}
        spectatorsCount={gameState?.spectators.length || 0}
        isSpectator={localRole === 'spectator'}
      />

      {viewMode === 'terms' ? (
        <TermsPage
          onBack={() => {
            sound.playClick();
            setViewMode('game');
          }}
          theme={theme}
          lang={lang}
        />
      ) : !gameState ? (
        <RoomLobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSpectateRoom={handleSpectateRoom}
          onPlaySolo={handlePlaySolo}
          onPassAndPlay={handlePassAndPlay}
          onOpenTerms={() => {
            sound.playClick();
            setViewMode('terms');
          }}
          onOpenBlog={() => {
            sound.playClick();
            setViewMode('blog');
          }}
          onOpenShareFriend={() => {
            sound.playClick();
            setIsShareFriendOpen(true);
          }}
          initialRoomCode={initialRoomCode}
          errorMsg={errorMsg}
          theme={theme}
          lang={lang}
          defaultPlayerName={defaultPlayerName}
          defaultSmartHints={defaultSmartHints}
        />
      ) : (
        <>
          <GameBoard
            state={gameState}
            localRole={localRole}
            connectionStatus={connectionStatus}
            onBoardAction={handleBoardAction}
            onRequestRematch={handleRequestRematch}
            onLeaveRoom={handleRequestLeaveRoom}
            onSendReaction={handleSendReaction}
            reactions={reactions}
            isBotMatch={gameMode === 'bot' || gameState.players.guest?.id === 'bot'}
            isPassAndPlay={
              localRole === 'host' &&
              (gameMode === 'pass' || gameState.players.guest?.id === 'local-guest')
            }
            theme={theme}
            lang={lang}
            showBoardCoords={showBoardCoords}
            localClientId={networkRef.current?.localClientId}
          />
          <GameDataFooter state={gameState} theme={theme} lang={lang} />
        </>
      )}

      {/* Sticky Sponsored Odia Bhasa App Promo Banner */}
      <PromoBanner theme={theme} lang={lang} />

      {/* Accidental Back / Leave Room Confirmation Modal */}
      {isLeaveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-confirm-title"
        >
          <div
            className={`relative w-full max-w-sm rounded-3xl p-6 border transition-all backdrop-blur-2xl ${
              isDark
                ? 'bg-slate-900/95 border-white/20 text-white shadow-[0_24px_64px_rgba(0,0,0,0.85)]'
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_24px_64px_rgba(15,23,42,0.25)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsLeaveConfirmOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 id="leave-confirm-title" className="text-lg font-black tracking-tight">
                {t.leaveConfirmTitle}
              </h3>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.leaveConfirmDesc}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsLeaveConfirmOpen(false);
                }}
                className={`h-11 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                }`}
              >
                {t.stayInGameBtn}
              </button>
              <button
                type="button"
                onClick={executeLeaveRoom}
                className="h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 transition-all whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{t.confirmLeaveBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => {
          sound.playClick();
          setIsHowToPlayOpen(false);
        }}
        theme={theme}
        lang={lang}
        onOpenBlog={() => setViewMode('blog')}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => {
          sound.playClick();
          setIsQrModalOpen(false);
        }}
        roomCode={gameState?.roomCode || null}
        theme={theme}
        lang={lang}
        spectatorOnly={Boolean(
          gameState &&
            (gameMode === 'bot' ||
              gameMode === 'pass' ||
              gameState.players.guest?.connected)
        )}
      />

      <JoinInviteModal
        isOpen={Boolean(inviteModalCode) && !gameState}
        roomCode={inviteModalCode}
        defaultName={defaultPlayerName}
        onJoinAsPlayer={(code, name) => handleJoinRoom(code, name)}
        onJoinAsSpectator={(code, name) => handleSpectateRoom(code, name)}
        onClose={() => setInviteModalCode(null)}
        theme={theme}
        lang={lang}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          sound.playClick();
          setIsSettingsOpen(false);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        lang={lang}
        onToggleLang={toggleLang}
        defaultPlayerName={defaultPlayerName}
        onSaveDefaultName={handleSaveDefaultName}
        defaultSmartHints={defaultSmartHints}
        onToggleDefaultSmartHints={toggleDefaultSmartHints}
        showBoardCoords={showBoardCoords}
        onToggleShowBoardCoords={toggleShowBoardCoords}
      />

      <ShareFriendModal
        isOpen={isShareFriendOpen}
        onClose={() => {
          sound.playClick();
          setIsShareFriendOpen(false);
        }}
        roomCode={gameState?.roomCode || null}
        theme={theme}
        lang={lang}
        onToggleLang={toggleLang}
        spectatorOnly={Boolean(
          gameState &&
            (gameMode === 'bot' ||
              gameMode === 'pass' ||
              gameState.players.guest?.connected)
        )}
      />
    </div>
  );
}
