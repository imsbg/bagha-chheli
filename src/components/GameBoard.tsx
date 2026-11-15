import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Bot,
  Eye,
  Lightbulb,
  ShieldAlert,
  Crosshair,
  Gamepad2,
  Maximize2,
  Minimize2,
  LogOut,
  EyeOff,
  FastForward,
} from 'lucide-react';
import { RoomGameState, ConnectionStatus, NetworkRole } from '../network/webrtc';
import {
  POINT_COORDS,
  ADJACENCY_MAP,
  TOTAL_GOATS,
  TOTAL_TIGERS,
  PlayerSide,
  getValidMovesForPiece,
  getTrappedTigerIndices,
  getThreatenedGoatIndices,
  formatLocalNumber,
} from '../game/rules';
import { sound } from '../utils/sound';
import { Language, translations } from '../utils/translations';
import { ActiveReaction, BoardReactionOverlay, ReactionBar } from './ReactionFloater';
import {
  TigerIcon,
  GoatIcon,
  BoardTigerPieceG,
  BoardGoatPieceG,
} from './PieceIcons';

interface GameBoardProps {
  state: RoomGameState;
  localRole: NetworkRole;
  connectionStatus: ConnectionStatus;
  onBoardAction: (from: number | null, to: number, overrideSide?: PlayerSide) => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
  onSendReaction: (emoji: string) => void;
  reactions: ActiveReaction[];
  isBotMatch?: boolean;
  isPassAndPlay?: boolean;
  theme: 'dark' | 'light';
  lang: Language;
  showBoardCoords?: boolean;
  localClientId?: string;
  hideSpectatorReactions?: boolean;
  onToggleHideSpectatorReactions?: () => void;
}

/**
 * Precompute unique undirected edges from ADJACENCY_MAP so every board line is drawn once
 */
const BOARD_EDGES: ReadonlyArray<{ u: number; v: number; isDiagonal: boolean }> = (() => {
  const edges: Array<{ u: number; v: number; isDiagonal: boolean }> = [];
  for (let u = 0; u < ADJACENCY_MAP.length; u++) {
    for (const v of ADJACENCY_MAP[u]) {
      if (u < v) {
        const dx = Math.abs((u % 5) - (v % 5));
        const dy = Math.abs(Math.floor(u / 5) - Math.floor(v / 5));
        edges.push({ u, v, isDiagonal: dx === 1 && dy === 1 });
      }
    }
  }
  return edges;
})();

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  localRole,
  connectionStatus,
  onBoardAction,
  onRequestRematch,
  onLeaveRoom,
  onSendReaction,
  reactions,
  isBotMatch = false,
  isPassAndPlay = false,
  theme,
  lang,
  showBoardCoords = true,
  localClientId,
  hideSpectatorReactions = false,
  onToggleHideSpectatorReactions,
}) => {
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showTurnNudge, setShowTurnNudge] = useState<boolean>(false);
  const isDark = theme === 'dark';
  const t = translations[lang];

  const isAssignedGuestPlayer =
    localRole === 'guest' &&
    Boolean(localClientId) &&
    state.players.guest?.id === localClientId &&
    state.players.guest?.id !== 'bot' &&
    state.players.guest?.id !== 'local-guest';

  const isSpectator =
    localRole === 'spectator' ||
    (localRole !== 'host' && !isAssignedGuestPlayer);

  // Players in Solo vs AI or 1-Phone Pass & Play have emojis hidden/disabled;
  // Spectators (and online 2-player participants) can send emojis.
  const canSendReactions = isSpectator || (!isBotMatch && !isPassAndPlay);

  // Filter out spectator emoji notifications if the player muted spectator emojis
  const visibleReactions = useMemo(
    () =>
      hideSpectatorReactions
        ? reactions.filter((r) => r.senderSide !== 'SPECTATOR')
        : reactions,
    [reactions, hideSpectatorReactions]
  );

  const hostSide: PlayerSide = state.players.host.side;
  const guestSide: PlayerSide =
    state.players.guest?.side || (hostSide === 'TIGER' ? 'GOAT' : 'TIGER');

  const tigerPlayer = hostSide === 'TIGER' ? state.players.host : state.players.guest;
  const goatPlayer = hostSide === 'GOAT' ? state.players.host : state.players.guest;

  const mySide: PlayerSide | null = isSpectator
    ? null
    : isPassAndPlay
    ? state.currentTurn
    : localRole === 'host'
    ? hostSide
    : guestSide;

  const isMyTurn =
    !isSpectator &&
    state.status === 'playing' &&
    state.currentTurn === mySide &&
    Boolean(state.players.guest?.connected);

  const isChainCaptureActive =
    state.status === 'playing' &&
    state.currentTurn === 'TIGER' &&
    state.chainCaptureTigerIndex !== null &&
    state.chainCaptureTigerIndex !== undefined;

  const hasRequestedRematch =
    !isSpectator &&
    (localRole === 'host' ? state.rematchRequests.host : state.rematchRequests.guest);
  const opponentRequestedRematch =
    !isSpectator &&
    (localRole === 'host' ? state.rematchRequests.guest : state.rematchRequests.host);

  // Clear selection whenever turn, phase, or round changes — or auto-select chain-capturing Tiger
  useEffect(() => {
    if (
      state.chainCaptureTigerIndex !== null &&
      state.chainCaptureTigerIndex !== undefined
    ) {
      setSelectedPiece(state.chainCaptureTigerIndex);
    } else {
      setSelectedPiece(null);
    }
  }, [
    state.currentTurn,
    state.phase,
    state.round,
    state.currentRoundMoves.length,
    state.chainCaptureTigerIndex,
  ]);

  // 10-Second Idle Turn Indicator on Board:
  // If it's the local player's turn and they wait more than 10 seconds without acting,
  // display a clear visual indicator directly on the board so they know it's their turn.
  useEffect(() => {
    setShowTurnNudge(false);
    if (!isMyTurn || state.status !== 'playing') return;

    const timer = setTimeout(() => {
      setShowTurnNudge(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [
    isMyTurn,
    state.status,
    state.currentTurn,
    state.phase,
    state.round,
    state.currentRoundMoves.length,
    selectedPiece,
  ]);

  // Sync native fullscreen exit
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        // Keep CSS fullscreen if browser blocked native fullscreen, otherwise sync
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    sound.playClick();
    const next = !isFullScreen;
    setIsFullScreen(next);
    try {
      if (next && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Fallback to CSS full-viewport mode
    }
  };

  // Play victory sound and confetti when round ends
  useEffect(() => {
    if (state.status === 'won' && state.winInfo) {
      sound.playWin();
      if (isSpectator || isPassAndPlay || state.winInfo.winner === mySide) {
        try {
          confetti({
            particleCount: state.winInfo.reason === 'paani_ghara' ? 140 : 85,
            spread: 75,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore confetti errors
        }
      }
    } else if (state.status === 'draw') {
      sound.playDraw();
    }
  }, [state.status, state.round, state.winInfo, mySide, isSpectator, isPassAndPlay]);

  // Compute valid moves for currently selected piece (respecting active multi-jump chain capture)
  const validMovesForSelected = useMemo(() => {
    if (selectedPiece === null) return [];
    return getValidMovesForPiece(
      state.board,
      selectedPiece,
      state.phase,
      state.chainCaptureTigerIndex ?? null
    );
  }, [state.board, selectedPiece, state.phase, state.chainCaptureTigerIndex]);

  const validDestMap = useMemo(() => {
    const map = new Map<number, { isCapture: boolean; capturedIndex: number | null }>();
    for (const m of validMovesForSelected) {
      map.set(m.to, { isCapture: m.isCapture, capturedIndex: m.capturedIndex });
    }
    return map;
  }, [validMovesForSelected]);

  const trappedTigers = useMemo(() => getTrappedTigerIndices(state.board), [state.board]);
  const threatenedGoats = useMemo(
    () => (state.smartHintsEnabled ? getThreatenedGoatIndices(state.board) : []),
    [state.board, state.smartHintsEnabled]
  );

  // Determine whether the current turn is a direct placement turn (no piece selection needed)
  const isPlacementTurn =
    state.phase === 'TIGER_PLACEMENT' ||
    state.phase === 'GOAT_INITIAL_PLACEMENT' ||
    (state.phase === 'MAIN_PLAY' && state.currentTurn === 'GOAT');

  const handlePointClick = (index: number) => {
    if (!isMyTurn || !mySide) return;
    setShowTurnNudge(false);

    const clickedPiece = state.board[index];

    if (isPlacementTurn) {
      if (clickedPiece === null) {
        onBoardAction(null, index, mySide);
      }
      return;
    }

    // If in a multi-jump chain capture, lock selection to the chain-capturing Tiger
    if (isChainCaptureActive && state.chainCaptureTigerIndex !== null && state.chainCaptureTigerIndex !== undefined) {
      if (clickedPiece === null && validDestMap.has(index)) {
        onBoardAction(state.chainCaptureTigerIndex, index, mySide);
      }
      return;
    }

    if (clickedPiece === mySide) {
      sound.playClick();
      setSelectedPiece((prev) => (prev === index ? null : index));
      return;
    }

    if (selectedPiece !== null && clickedPiece === null && validDestMap.has(index)) {
      onBoardAction(selectedPiece, index, mySide);
      setSelectedPiece(null);
    }
  };

  // Phase Title & Instruction Banner Text
  const phaseBanner = useMemo(() => {
    if (state.phase === 'TIGER_PLACEMENT') {
      return {
        badge: t.phase1ATitle,
        desc: `${t.phase1ADesc} (${t.tigersRemainingToPlace} ${formatLocalNumber(
          state.tigersToPlace,
          lang
        )})`,
        color: 'amber',
      };
    }
    if (state.phase === 'GOAT_INITIAL_PLACEMENT') {
      return {
        badge: t.phase1BTitle,
        desc: `${t.phase1BDesc} (${t.initialGoatsRemaining} ${formatLocalNumber(
          state.goatsToPlaceInitially,
          lang
        )})`,
        color: 'emerald',
      };
    }
    if (state.phase === 'MAIN_PLAY') {
      return {
        badge: t.phase2Title,
        desc: state.currentTurn === 'TIGER' ? t.phase2TigerDesc : t.phase2GoatDesc,
        color: state.currentTurn === 'TIGER' ? 'amber' : 'emerald',
      };
    }
    return {
      badge: t.phase3Title,
      desc: state.currentTurn === 'TIGER' ? t.phase3TigerDesc : t.phase3GoatDesc,
      color: state.currentTurn === 'TIGER' ? 'amber' : 'emerald',
    };
  }, [state.phase, state.currentTurn, state.tigersToPlace, state.goatsToPlaceInitially, t, lang]);

  const goatsRemainingInSupply = Math.max(0, TOTAL_GOATS - state.goatsPlacedTotal);
  const goatsAliveTotal = Math.max(0, TOTAL_GOATS - state.goatsCaptured);

  return (
    <div
      className={
        isFullScreen
          ? `fixed inset-0 z-[60] overflow-y-auto px-2.5 sm:px-6 py-2 sm:py-3 flex flex-col justify-center ${
              isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
            }`
          : 'flex-1 flex flex-col items-center justify-center px-2.5 sm:px-4 py-2 sm:py-4 w-full max-w-6xl mx-auto relative z-10'
      }
    >
      {/* Non-Intrusive Top-Right Corner Emoji Reaction Toast */}
      <BoardReactionOverlay reactions={visibleReactions} theme={theme} />

      <div className="w-full max-w-6xl mx-auto">
        {/* Spectator Mode Banner (Hidden in mobile full screen to keep view minimal) */}
        {isSpectator && (
          <div
            className={`${
              isFullScreen ? 'hidden lg:flex' : 'flex'
            } w-full mb-3 p-2.5 px-3.5 rounded-2xl border items-center justify-between gap-2 backdrop-blur-xl ${
              isDark
                ? 'bg-purple-500/15 border-purple-400/30 text-purple-200'
                : 'bg-purple-100/90 border-purple-300 text-purple-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold truncate">
              <Eye className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
              <span className="truncate">{t.watchingLiveDesc}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-500 text-white shrink-0 whitespace-nowrap">
              {t.spectatingBadge}
            </span>
          </div>
        )}

        {/* Connection / Waiting Banner for Online Mode */}
        {!isBotMatch && !isPassAndPlay && !state.players.guest?.connected && (
          <div
            className={`${
              isFullScreen ? 'hidden lg:flex' : 'flex'
            } w-full mb-3 p-3 sm:p-3.5 rounded-2xl border flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left backdrop-blur-xl ${
              isDark
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200 shadow-lg'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {connectionStatus === 'reconnecting'
                    ? t.reconnectingWait
                    : state.players.guest
                    ? t.reconnectingWait
                    : t.waitingForOpponent}
                </p>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-amber-300/80' : 'text-amber-700'
                  }`}
                >
                  {t.roomCodeLabel}{' '}
                  <span className="font-mono font-black tracking-wider">
                    {state.roomCode}
                  </span>{' '}
                  — {t.shareCodePrompt}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            2-SIDED DESKTOP LAYOUT / COMPACT MOBILE HUD + BOARD
            Left Side (lg:col-span-7): Mobile Live HUD Bar + Large SVG Board
            Right Side (lg:col-span-5): Full Game Details, Captures, Turn & Reactions
           ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start">
          {/* LEFT COLUMN: Mobile Pinned Live Stats Bar + Large 5x5 Alquerque Board */}
          <div className="lg:col-span-7 flex flex-col items-center w-full">
            {/* MOBILE TOP BAR:
                - In Full Screen on Mobile: Ultra-minimal bar showing ONLY Round + Exit FullScreen
                - In Normal Mode on Mobile: Live HUD showing Captures, Round, Supply & FullScreen */}
            {isFullScreen ? (
              <div
                data-testid="mobile-fullscreen-minimal-bar"
                className={`lg:hidden w-full max-w-[540px] mb-2 rounded-2xl px-3 py-2 border backdrop-blur-xl flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-slate-900/90 border-white/15 shadow-lg'
                    : 'bg-white/95 border-slate-200/90 shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                    {t.round} {formatLocalNumber(state.round, lang)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-xl border whitespace-nowrap ${
                      state.currentTurn === 'TIGER'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {state.currentTurn === 'TIGER' ? (
                      <TigerIcon className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <GoatIcon className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {state.currentTurn === 'TIGER' ? t.tigerLabel : t.goatLabel}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onToggleHideSpectatorReactions && !isSpectator && (
                    <button
                      type="button"
                      onClick={onToggleHideSpectatorReactions}
                      title={t.hideSpectatorEmojisSetting}
                      className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 whitespace-nowrap ${
                        hideSpectatorReactions
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : isDark
                          ? 'bg-white/5 text-slate-300 border-white/15'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleFullScreen}
                    title={t.exitFullScreenBtn}
                    aria-label={t.exitFullScreenBtn}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 border-white/20 text-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.exitFullScreenBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`lg:hidden w-full max-w-[480px] mb-2 rounded-2xl p-2 border backdrop-blur-xl transition-all ${
                  isDark
                    ? 'bg-slate-900/85 border-white/15 shadow-lg'
                    : 'bg-white/90 border-slate-200/90 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  {/* Tiger Captures Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border shrink-0 ${
                      state.currentTurn === 'TIGER' && state.status === 'playing'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-slate-200'
                        : 'bg-amber-50 border-amber-200 text-slate-800'
                    }`}
                  >
                    <TigerIcon className="w-4 h-4 shrink-0" />
                    <div className="leading-none">
                      <div className="text-[9px] font-bold uppercase opacity-75 whitespace-nowrap">
                        {t.goatsCapturedLabel}
                      </div>
                      <div className="text-xs font-black text-amber-500 whitespace-nowrap mt-0.5">
                        {formatLocalNumber(state.goatsCaptured, lang)}
                      </div>
                    </div>
                  </div>

                  {/* Turn & Supply Center Pill */}
                  <div className="flex flex-col items-center justify-center text-center min-w-0 flex-1 overflow-hidden px-1">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap truncate max-w-full ${
                        state.currentTurn === 'TIGER'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {state.currentTurn === 'TIGER' ? t.tigerLabel : t.goatLabel} •{' '}
                      {t.round} {formatLocalNumber(state.round, lang)}
                    </span>
                    <span
                      className={`text-[10px] font-bold mt-0.5 truncate w-full whitespace-nowrap ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {t.goatsInSupply}: {formatLocalNumber(goatsRemainingInSupply, lang)}
                    </span>
                  </div>

                  {/* Goat On Board / Alive Pill + Fullscreen Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border shrink-0 ${
                        state.currentTurn === 'GOAT' && state.status === 'playing'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-200'
                          : 'bg-emerald-50 border-emerald-200 text-slate-800'
                      }`}
                    >
                      <GoatIcon className="w-4 h-4 shrink-0" />
                      <div className="leading-none">
                        <div className="text-[9px] font-bold uppercase opacity-75 whitespace-nowrap">
                          {t.goatsOnBoardLabel}
                        </div>
                        <div className="text-xs font-black text-emerald-500 whitespace-nowrap mt-0.5">
                          {formatLocalNumber(state.goatsOnBoard, lang)} /{' '}
                          {formatLocalNumber(goatsAliveTotal, lang)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleFullScreen}
                      title={isFullScreen ? t.exitFullScreenBtn : t.fullScreenBtn}
                      aria-label={isFullScreen ? t.exitFullScreenBtn : t.fullScreenBtn}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/15 text-amber-400'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5x5 ALQUERQUE BAGHA CHHELI SVG BOARD */}
            <div
              className={`relative w-full ${
                isFullScreen ? 'max-w-[540px] lg:max-w-[580px]' : 'max-w-[480px] lg:max-w-[540px]'
              } p-3 sm:p-5 rounded-3xl border backdrop-blur-2xl transition-all select-none ${
                showTurnNudge && isMyTurn
                  ? mySide === 'TIGER'
                    ? 'ring-2 ring-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.35)]'
                    : 'ring-2 ring-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                  : ''
              } ${
                isDark
                  ? 'bg-slate-900/80 border-white/20 shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.2)]'
                  : 'bg-amber-50/90 border-amber-200/90 shadow-[0_24px_64px_rgba(120,53,15,0.14),inset_0_1px_2px_rgba(255,255,255,0.95)]'
              }`}
            >
              {/* MULTI-JUMP CHAIN CAPTURE BANNER ON BOARD */}
              {isChainCaptureActive && isMyTurn && (
                <div
                  data-testid="chain-capture-banner"
                  className="mb-2.5 w-full flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-rose-500/95 border border-rose-200 text-white shadow-lg"
                >
                  <div className="flex items-center gap-2 text-xs font-black">
                    <TigerIcon className="w-4 h-4 shrink-0" />
                    <span>{t.multiCaptureChainNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBoardAction(-1, -1, 'TIGER')}
                    data-testid="end-chain-capture-btn"
                    className="h-7 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-amber-300 border border-white/20 text-[11px] font-black inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <FastForward className="w-3 h-3 shrink-0" />
                    <span>{t.endChainCaptureBtn}</span>
                  </button>
                </div>
              )}

              {/* 10-SECOND IDLE TURN INDICATOR BANNER ON BOARD (Docked above grid so it never covers intersections) */}
              {showTurnNudge && isMyTurn && state.status === 'playing' && !isChainCaptureActive && (
                <div
                  data-testid="turn-nudge-banner"
                  className="mb-2.5 w-full animate-pulse"
                >
                  <div
                    className={`px-3.5 py-2 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center gap-2 text-center ${
                      mySide === 'TIGER'
                        ? 'bg-amber-500/95 border-amber-200 text-slate-950 shadow-amber-500/30'
                        : 'bg-emerald-500/95 border-emerald-200 text-slate-950 shadow-emerald-500/30'
                    }`}
                  >
                    {mySide === 'TIGER' ? (
                      <TigerIcon className="w-5 h-5 shrink-0" />
                    ) : (
                      <GoatIcon className="w-5 h-5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black leading-tight whitespace-nowrap truncate">
                        {t.turnNudgeTitle} ({mySide === 'TIGER' ? t.tigerLabel : t.goatLabel})
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold opacity-90 leading-tight whitespace-nowrap truncate">
                        {isPlacementTurn ? t.turnNudgePlacement : t.turnNudgeMove}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full aspect-square">
                <svg
                  viewBox="-11 -11 122 122"
                  className="w-full h-full overflow-visible"
                  role="grid"
                  aria-label="Bagha Chheli 5x5 Alquerque Strategy Board"
                >
                <defs>
                  {/* Tiger Piece Radial Gradient */}
                  <radialGradient id="boardTigerGrad" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="55%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#9A3412" />
                  </radialGradient>

                  {/* Goat Piece Radial Gradient */}
                  <radialGradient id="boardGoatGrad" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="55%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#064E3B" />
                  </radialGradient>

                  {/* Board Surface Frame Gradient */}
                  <linearGradient id="alquerqueSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop
                      offset="0%"
                      stopColor={isDark ? '#1E293B' : '#FEF3C7'}
                      stopOpacity="0.65"
                    />
                    <stop
                      offset="100%"
                      stopColor={isDark ? '#0F172A' : '#FDE68A'}
                      stopOpacity="0.45"
                    />
                  </linearGradient>
                </defs>

                {/* Outer Decorative Carved Temple Frame */}
                <rect
                  x="-7"
                  y="-7"
                  width="114"
                  height="114"
                  rx="7"
                  fill="url(#alquerqueSurfaceGrad)"
                  stroke={isDark ? 'rgba(251, 191, 36, 0.28)' : 'rgba(180, 83, 9, 0.32)'}
                  strokeWidth="0.9"
                />

                {/* Subtle Diamond Watermark on the 4 Sub-Quadrants */}
                {[
                  { cx: 25, cy: 25 },
                  { cx: 75, cy: 25 },
                  { cx: 25, cy: 75 },
                  { cx: 75, cy: 75 },
                ].map((hub, idx) => (
                  <circle
                    key={idx}
                    cx={hub.cx}
                    cy={hub.cy}
                    r="3.6"
                    fill="none"
                    stroke={isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(180, 83, 9, 0.22)'}
                    strokeWidth="0.5"
                    strokeDasharray="1.2 1"
                  />
                ))}

                {/* All Connected Alquerque Grid Lines */}
                {BOARD_EDGES.map(({ u, v, isDiagonal }) => {
                  const p1 = POINT_COORDS[u];
                  const p2 = POINT_COORDS[v];
                  const isHighlightedMoveEdge =
                    selectedPiece !== null &&
                    ((selectedPiece === u && validDestMap.has(v)) ||
                      (selectedPiece === v && validDestMap.has(u)));

                  return (
                    <line
                      key={`${u}-${v}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={
                        isHighlightedMoveEdge
                          ? '#10B981'
                          : isDark
                          ? isDiagonal
                            ? 'rgba(226, 232, 240, 0.42)'
                            : 'rgba(226, 232, 240, 0.58)'
                          : isDiagonal
                          ? 'rgba(120, 53, 15, 0.52)'
                          : 'rgba(120, 53, 15, 0.72)'
                      }
                      strokeWidth={
                        isHighlightedMoveEdge ? '1.6' : isDiagonal ? '1.05' : '1.35'
                      }
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Last Move Trajectory Line (From -> To) */}
                {state.lastMove && state.lastMove.from !== null && (
                  <line
                    x1={POINT_COORDS[state.lastMove.from].x}
                    y1={POINT_COORDS[state.lastMove.from].y}
                    x2={POINT_COORDS[state.lastMove.to].x}
                    y2={POINT_COORDS[state.lastMove.to].y}
                    stroke={state.lastMove.actionType === 'capture' ? '#F43F5E' : '#FACC15'}
                    strokeWidth="1.7"
                    strokeDasharray="2.4 1.6"
                    strokeLinecap="round"
                  />
                )}

                {/* Render All 25 Intersections, Valid Targets, and Custom SVG Pieces */}
                {POINT_COORDS.map((pt, index) => {
                  const piece = state.board[index];
                  const isSelected = selectedPiece === index;
                  const isLastMoveDest = state.lastMove?.to === index;
                  const isLastMoveFrom = state.lastMove?.from === index;
                  const isLastCapturedSpot = state.lastMove?.capturedIndex === index;
                  const moveOption = validDestMap.get(index);
                  const isValidDestination = Boolean(moveOption);
                  const isCaptureDestination = Boolean(moveOption?.isCapture);
                  const isMajorHub = ADJACENCY_MAP[index].length === 8;

                  const canClickPoint =
                    isMyTurn &&
                    ((isPlacementTurn && piece === null) ||
                      (!isPlacementTurn && piece === mySide) ||
                      (!isPlacementTurn && piece === null && isValidDestination));

                  return (
                    <g
                      key={index}
                      onClick={() => handlePointClick(index)}
                      className={canClickPoint ? 'cursor-pointer' : 'cursor-default'}
                      data-testid={`board-point-${index}`}
                      role="gridcell"
                      aria-label={`Point ${index + 1} ${piece || 'Empty'}`}
                    >
                      {/* Invisible generous hit area for touch/mouse accuracy */}
                      <circle cx={pt.x} cy={pt.y} r="9.5" fill="transparent" />

                      {/* Base Intersection Node */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isMajorHub ? '2.4' : '1.8'}
                        fill={
                          isDark
                            ? isMajorHub
                              ? '#FBBF24'
                              : '#94A3B8'
                            : isMajorHub
                            ? '#B45309'
                            : '#78350F'
                        }
                        stroke={isDark ? '#0F172A' : '#FFFBEB'}
                        strokeWidth="0.6"
                      />

                      {/* Origin Ghost Ring for Last Move */}
                      {isLastMoveFrom && piece === null && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3.8"
                          fill="none"
                          stroke="#FACC15"
                          strokeOpacity="0.65"
                          strokeWidth="0.9"
                          strokeDasharray="1.5 1.2"
                        />
                      )}

                      {/* Captured Goat Ghost Crosshair */}
                      {isLastCapturedSpot && piece === null && (
                        <g transform={`translate(${pt.x}, ${pt.y})`}>
                          <circle
                            cx={0}
                            cy={0}
                            r="4.2"
                            fill="#F43F5E"
                            fillOpacity="0.18"
                            stroke="#F43F5E"
                            strokeWidth="0.8"
                            strokeDasharray="1.4 1"
                          />
                          <path
                            d="M-1.8 -1.8L1.8 1.8M1.8 -1.8L-1.8 1.8"
                            stroke="#F43F5E"
                            strokeWidth="0.9"
                            strokeLinecap="round"
                          />
                        </g>
                      )}

                      {/* Placement Hover Ring during Phase 1A, 1B, or Phase 2 Goat Placement */}
                      {isMyTurn && isPlacementTurn && piece === null && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5.2"
                          fill={mySide === 'TIGER' ? '#F59E0B' : '#10B981'}
                          fillOpacity={state.smartHintsEnabled ? '0.16' : '0.08'}
                          stroke={mySide === 'TIGER' ? '#F59E0B' : '#10B981'}
                          strokeOpacity={state.smartHintsEnabled ? '0.55' : '0.3'}
                          strokeWidth="0.7"
                          strokeDasharray="1.8 1.4"
                        />
                      )}

                      {/* Valid Move / Capture Destination Indicator when a Piece is Selected */}
                      {isValidDestination && piece === null && (
                        <g transform={`translate(${pt.x}, ${pt.y})`}>
                          <circle
                            cx={0}
                            cy={0}
                            r="6.6"
                            fill={isCaptureDestination ? '#F43F5E' : '#10B981'}
                            fillOpacity="0.25"
                            stroke={isCaptureDestination ? '#F43F5E' : '#10B981'}
                            strokeWidth="1.2"
                          />
                          <circle
                            cx={0}
                            cy={0}
                            r="2.8"
                            fill={isCaptureDestination ? '#F43F5E' : '#10B981'}
                          />
                        </g>
                      )}

                      {/* Coordinate Number Label (#1..#25) */}
                      {showBoardCoords && piece === null && !isValidDestination && (
                        <text
                          x={pt.x + (pt.col === 4 ? -4.2 : 4.2)}
                          y={pt.y + (pt.row === 4 ? -3.2 : 4.2)}
                          textAnchor="middle"
                          fill={
                            isDark
                              ? 'rgba(203, 213, 225, 0.72)'
                              : 'rgba(120, 53, 15, 0.72)'
                          }
                          fontSize="2.6"
                          fontWeight="800"
                          className="pointer-events-none select-none"
                        >
                          {formatLocalNumber(index + 1, lang)}
                        </text>
                      )}

                      {/* Last Move Destination Yellow Ring Highlight */}
                      {isLastMoveDest && (
                        <g transform={`translate(${pt.x}, ${pt.y})`}>
                          <circle
                            cx={0}
                            cy={0}
                            r={piece === 'TIGER' ? '9.2' : '8.2'}
                            fill="none"
                            stroke="#FACC15"
                            strokeWidth="1.35"
                          />
                        </g>
                      )}

                      {/* Custom SVG Tiger Piece */}
                      {piece === 'TIGER' && (
                        <BoardTigerPieceG
                          cx={pt.x}
                          cy={pt.y}
                          isSelected={isSelected}
                          isLastMove={isLastMoveDest}
                          isTrapped={trappedTigers.includes(index)}
                        />
                      )}

                      {/* Custom SVG Goat Piece */}
                      {piece === 'GOAT' && (
                        <BoardGoatPieceG
                          cx={pt.x}
                          cy={pt.y}
                          isSelected={isSelected}
                          isLastMove={isLastMoveDest}
                          isThreatened={threatenedGoats.includes(index)}
                        />
                      )}

                      {/* Last Move Floating Tag */}
                      {isLastMoveDest && (
                        <g transform={`translate(${pt.x}, ${pt.y - 9.4})`}>
                          <rect
                            x="-6.5"
                            y="-2.4"
                            width="13"
                            height="4"
                            rx="1.5"
                            fill="#FACC15"
                            stroke="#78350F"
                            strokeWidth="0.35"
                          />
                          <text
                            x="0"
                            y="0.35"
                            textAnchor="middle"
                            fill="#0F172A"
                            fontSize="2.3"
                            fontWeight="900"
                          >
                            {t.lastMoveBadge}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Game Details, Scoreboard, Captures, Phase Guidance & Reactions */}
          <div className="lg:col-span-5 flex flex-col gap-3 w-full">
            {/* Top Action Bar: Round Info + Spectator Emoji Mute + Full Screen Toggle + Leave Button */}
            <div
              className={`${
                isFullScreen ? 'hidden lg:flex' : 'flex'
              } rounded-2xl p-3 border items-center justify-between gap-2 backdrop-blur-xl ${
                isDark
                  ? 'bg-slate-900/70 border-white/15'
                  : 'bg-white/85 border-slate-200/90 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 whitespace-nowrap">
                  {t.round} {formatLocalNumber(state.round, lang)}
                </span>
                {isBotMatch && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 whitespace-nowrap">
                    <Bot className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.botName}</span>
                  </span>
                )}
                {isPassAndPlay && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 whitespace-nowrap">
                    <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.passAndPlayBadge}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onToggleHideSpectatorReactions && !isSpectator && (
                  <button
                    type="button"
                    onClick={onToggleHideSpectatorReactions}
                    data-testid="board-mute-spectator-emojis-btn"
                    title={t.hideSpectatorEmojisSetting}
                    className={`h-10 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      hideSpectatorReactions
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/15'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">
                      {hideSpectatorReactions
                        ? t.spectatorEmojisMutedBadge
                        : t.hideSpectatorEmojisSetting}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {isFullScreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{t.exitFullScreenBtn}</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{t.fullScreenBtn}</span>
                    </>
                  )}
                </button>

                {isFullScreen && (
                  <button
                    type="button"
                    onClick={onLeaveRoom}
                    title={t.leaveRoom}
                    className="h-10 w-10 rounded-xl border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 flex items-center justify-center shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Player Cards: Tiger vs Goat (Hidden on Mobile Fullscreen to keep view minimal) */}
            <div className={`${isFullScreen ? 'hidden lg:grid' : 'grid'} grid-cols-2 gap-2.5`}>
              {/* TIGER PLAYER CARD */}
              <div
                className={`rounded-2xl p-3.5 border transition-all backdrop-blur-xl ${
                  state.currentTurn === 'TIGER' && state.status === 'playing'
                    ? isDark
                      ? 'bg-amber-500/20 border-amber-400/60 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/40'
                      : 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : isDark
                    ? 'bg-slate-900/65 border-white/15'
                    : 'bg-white/85 border-slate-200/90 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap">
                    <TigerIcon className="w-4 h-4 shrink-0" />
                    <span>{t.tigerLabel}</span>
                  </span>
                  {!isSpectator && !isPassAndPlay && mySide === 'TIGER' && (
                    <span
                      className={`text-[10px] font-bold whitespace-nowrap ${
                        isDark ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      {t.youTag}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm font-black truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {tigerPlayer?.name || t.tigerLabel}
                </p>

                {/* Tiger Captures & Trapped Count */}
                <div className="mt-2 pt-2 border-t border-amber-500/20">
                  <div className="space-y-0.5 text-[11px] font-bold">
                    <div className={isDark ? 'text-amber-200' : 'text-amber-900'}>
                      {t.goatsCapturedLabel}:{' '}
                      <span className="text-rose-500 font-black">
                        {formatLocalNumber(state.goatsCaptured, lang)}
                      </span>
                    </div>
                    <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {t.trappedTigersLabel}:{' '}
                      <span className="font-black">
                        {formatLocalNumber(trappedTigers.length, lang)}/
                        {formatLocalNumber(TOTAL_TIGERS, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GOAT PLAYER CARD */}
              <div
                className={`rounded-2xl p-3.5 border transition-all backdrop-blur-xl ${
                  state.currentTurn === 'GOAT' && state.status === 'playing'
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-400/60 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/40'
                      : 'bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                    : isDark
                    ? 'bg-slate-900/65 border-white/15'
                    : 'bg-white/85 border-slate-200/90 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 whitespace-nowrap">
                    <GoatIcon className="w-4 h-4 shrink-0" />
                    <span>{t.goatLabel}</span>
                  </span>
                  {!isSpectator && !isPassAndPlay && mySide === 'GOAT' && (
                    <span
                      className={`text-[10px] font-bold whitespace-nowrap ${
                        isDark ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    >
                      {t.youTag}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm font-black truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {goatPlayer?.connected
                    ? goatPlayer.name
                    : goatPlayer
                    ? goatPlayer.name
                    : t.waitingTag}
                </p>

                {/* Goat Total, On Board & Supply Count */}
                <div className="mt-2 pt-2 border-t border-emerald-500/20">
                  <div className="space-y-0.5 text-[11px] font-bold">
                    <div className={isDark ? 'text-emerald-300' : 'text-emerald-950'}>
                      {t.totalGoatsLabel}:{' '}
                      <span className="font-black">
                        {formatLocalNumber(TOTAL_GOATS, lang)}
                      </span>
                    </div>
                    <div className={isDark ? 'text-emerald-200' : 'text-emerald-900'}>
                      {t.goatsOnBoardLabel}:{' '}
                      <span className="font-black">
                        {formatLocalNumber(state.goatsOnBoard, lang)}
                      </span>
                    </div>
                    <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {t.goatsInSupply}:{' '}
                      <span className="font-black">
                        {formatLocalNumber(goatsRemainingInSupply, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Turn & Phase Instruction Card (Hidden on Mobile Fullscreen) */}
            {state.status === 'playing' && (
              <div
                className={`${
                  isFullScreen ? 'hidden lg:block' : 'block'
                } rounded-2xl p-3.5 border transition-all backdrop-blur-xl space-y-2 ${
                  state.currentTurn === 'TIGER'
                    ? isDark
                      ? 'bg-amber-500/15 border-amber-400/35 text-amber-100'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : isDark
                    ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-100'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    {state.currentTurn === 'TIGER' ? (
                      <TigerIcon className="w-5 h-5 shrink-0" />
                    ) : (
                      <GoatIcon className="w-5 h-5 shrink-0" />
                    )}
                    <span>
                      {isSpectator
                        ? `${
                            state.currentTurn === 'TIGER'
                              ? tigerPlayer?.name || t.tigerLabel
                              : goatPlayer?.name || t.goatLabel
                          } (${state.currentTurn === 'TIGER' ? t.tigerLabel : t.goatLabel})`
                        : isPassAndPlay
                        ? `${
                            state.currentTurn === 'TIGER'
                              ? `${t.tigerLabel} — ${tigerPlayer?.name}`
                              : `${t.goatLabel} — ${goatPlayer?.name}`
                          }`
                        : isMyTurn
                        ? `${t.itsYourTurn} (${
                            mySide === 'TIGER' ? t.tigerLabel : t.goatLabel
                          })`
                        : isBotMatch
                        ? t.botThinking
                        : `${t.waitingForTurn} ${
                            state.currentTurn === 'TIGER'
                              ? tigerPlayer?.name || t.tigerLabel
                              : goatPlayer?.name || t.goatLabel
                          } ${t.toPlay}`}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      phaseBanner.color === 'amber'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {phaseBanner.badge}
                  </span>
                </div>

                <p
                  className={`text-xs font-medium leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {phaseBanner.desc}
                </p>

                {state.smartHintsEnabled && threatenedGoats.length > 0 && (
                  <div className="pt-1 flex items-center gap-1.5 text-xs font-extrabold text-rose-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{t.smartHintsTipThreat}</span>
                  </div>
                )}
              </div>
            )}

            {/* Board Legend & Smart Hints Status (Hidden on Mobile Fullscreen) */}
            <div
              className={`${
                isFullScreen ? 'hidden lg:flex' : 'flex'
              } w-full px-3.5 py-2.5 rounded-2xl border flex-wrap items-center justify-between gap-2 text-xs font-bold backdrop-blur-xl ${
                isDark
                  ? 'bg-slate-900/60 border-white/15 text-slate-300'
                  : 'bg-white/80 border-slate-200/90 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <TigerIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {t.tigersTeam} ({formatLocalNumber(4, lang)})
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <GoatIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {t.goatsTeam} ({formatLocalNumber(20, lang)})
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-500 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  {lang === 'or' ? 'ସଠିକ୍ ଘର' : 'Valid Move'}
                </span>
                <span className="inline-flex items-center gap-1 text-rose-500 whitespace-nowrap">
                  <Crosshair className="w-3.5 h-3.5 shrink-0" />
                  {lang === 'or' ? 'ଛେଳି ଶିକାର' : 'Capture Jump'}
                </span>
              </div>
            </div>

            {/* Emoji Reaction Bar (Disabled/Hidden for Solo AI & 1-Phone Pass & Play players; enabled for Spectators & 2-Player Online) */}
            {canSendReactions && (
              <div className="w-full max-w-[540px] lg:max-w-none mx-auto">
                <ReactionBar
                  onSendReaction={onSendReaction}
                  theme={theme}
                  label={t.sendReaction}
                />
              </div>
            )}

            {/* Game Over / Paani Ghara / Rematch Banner */}
            {state.status !== 'playing' && state.winInfo && (
              <div
                className={`w-full p-4 sm:p-5 rounded-3xl border text-center backdrop-blur-2xl animate-fade-in ${
                  state.winInfo.reason === 'paani_ghara'
                    ? isDark
                      ? 'bg-gradient-to-br from-emerald-950/90 via-teal-900/80 to-amber-950/80 border-amber-400/50 shadow-2xl'
                      : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 border-amber-400 shadow-xl'
                    : isDark
                    ? 'bg-slate-900/85 border-white/20 shadow-2xl'
                    : 'bg-white/95 border-slate-200 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Trophy className="w-6 h-6 text-amber-400 animate-bounce shrink-0" />
                  <h3
                    className={`text-lg sm:text-xl font-black ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {state.winInfo.reason === 'paani_ghara'
                      ? t.paaniGharaTitle
                      : state.winInfo.winner === 'TIGER'
                      ? t.tigersWinTitle
                      : t.goatsWinTitle}
                  </h3>
                </div>

                <p
                  className={`text-xs sm:text-sm font-semibold mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {state.winInfo.reason === 'paani_ghara'
                    ? t.winByPaaniGharaDesc
                    : state.winInfo.reason === 'captures'
                    ? t.winByCapturesDesc
                    : t.winByTrappedDesc}
                </p>

                {!isSpectator ? (
                  <>
                    {opponentRequestedRematch && !hasRequestedRematch && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {localRole === 'host'
                            ? state.players.guest?.name
                            : state.players.host.name}{' '}
                          {t.rematchRequested}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-2">
                      {state.players.guest?.connected ? (
                        <button
                          type="button"
                          onClick={onRequestRematch}
                          disabled={hasRequestedRematch}
                          className={`h-11 w-full sm:w-auto px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                            hasRequestedRematch
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 cursor-default'
                              : 'bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-lg shadow-orange-500/25 active:scale-[0.99]'
                          }`}
                        >
                          {hasRequestedRematch ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>{t.waitingForOpponentAccept}</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 shrink-0" />
                              <span>
                                {opponentRequestedRematch ? t.acceptPlayAgain : t.playAgain}
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                          <Users className="w-4 h-4 shrink-0" />
                          <span>{t.opponentLeft}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={onLeaveRoom}
                        className={`h-11 w-full sm:w-auto px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                            : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
                        }`}
                      >
                        {t.backToLobby}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={onLeaveRoom}
                      className={`h-10 px-4 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                          : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300/80'
                      }`}
                    >
                      {t.backToLobby}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
