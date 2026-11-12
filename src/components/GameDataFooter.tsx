import React, { useEffect, useState } from 'react';
import {
  Clock,
  History,
  ListOrdered,
  Trophy,
  Timer,
  Sparkles,
  Grid,
  ChevronDown,
  ChevronUp,
  Home,
} from 'lucide-react';
import { RoomGameState } from '../network/webrtc';
import {
  formatDuration,
  formatPointName,
  formatLocalNumber,
  RoundRecord,
  POINT_COORDS,
  ADJACENCY_MAP,
} from '../game/rules';
import { Language, translations } from '../utils/translations';
import { TigerIcon, GoatIcon } from './PieceIcons';

interface GameDataFooterProps {
  state: RoomGameState;
  theme: 'dark' | 'light';
  lang: Language;
}

const MiniAlquerqueSnapshot: React.FC<{
  round: RoundRecord;
  isDark: boolean;
}> = ({ round, isDark }) => {
  return (
    <div
      className={`p-1.5 rounded-xl border shrink-0 ${
        isDark ? 'bg-slate-950/70 border-white/10' : 'bg-amber-50/90 border-amber-200'
      }`}
      title="Final 5x5 Board Snapshot"
    >
      <svg viewBox="-8 -8 116 116" className="w-16 h-16 sm:w-20 sm:h-20">
        {ADJACENCY_MAP.map((neighbors, u) =>
          neighbors
            .filter((v) => u < v)
            .map((v) => (
              <line
                key={`${u}-${v}`}
                x1={POINT_COORDS[u].x}
                y1={POINT_COORDS[u].y}
                x2={POINT_COORDS[v].x}
                y2={POINT_COORDS[v].y}
                stroke={isDark ? 'rgba(226,232,240,0.3)' : 'rgba(120,53,15,0.4)'}
                strokeWidth="1.2"
              />
            ))
        )}
        {round.finalBoard.map((cell, idx) => {
          const pt = POINT_COORDS[idx];
          const isFinalDest = round.finalMove?.to === idx;
          return (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={cell ? '5.2' : '1.5'}
                fill={
                  cell === 'TIGER'
                    ? '#EA580C'
                    : cell === 'GOAT'
                    ? '#059669'
                    : isDark
                    ? '#475569'
                    : '#92400E'
                }
                stroke={isFinalDest ? '#FACC15' : '#FFFFFF'}
                strokeWidth={isFinalDest ? '1.8' : cell ? '0.8' : '0'}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const GameDataFooter: React.FC<GameDataFooterProps> = ({ state, theme, lang }) => {
  const [now, setNow] = useState(() => Date.now());
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const isDark = theme === 'dark';
  const t = translations[lang];

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const matchElapsedSec = Math.max(
    0,
    Math.floor((now - (state.matchStartedAt || now)) / 1000)
  );
  const currentRoundElapsedSec =
    state.status === 'playing'
      ? Math.max(0, Math.floor((now - (state.roundStartedAt || now)) / 1000))
      : state.roundHistory[0]?.round === state.round
      ? state.roundHistory[0].durationSeconds
      : Math.max(0, Math.floor((now - (state.roundStartedAt || now)) / 1000));

  return (
    <footer className="w-full max-w-5xl mx-auto px-2.5 sm:px-4 pb-6 pt-2 z-10">
      <div
        className={`rounded-3xl p-3.5 sm:p-5 border backdrop-blur-2xl transition-all ${
          isDark
            ? 'bg-slate-900/65 border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
            : 'bg-white/75 border-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)]'
        }`}
      >
        {/* Header & Live Timers Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`text-xs sm:text-sm font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.gameDataFooterTitle}
              </h3>
              <p
                className={`text-[10px] sm:text-[11px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {t.round} {formatLocalNumber(state.round, lang)} • 🐯{' '}
                {formatLocalNumber(state.scores.TIGER, lang)} -{' '}
                {formatLocalNumber(state.scores.GOAT, lang)} 🐐
              </p>
            </div>
          </div>

          {/* Live Stat Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <div
                  className={`text-[9px] uppercase font-bold truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {t.currentMatchTime}
                </div>
                <div
                  className={`font-mono text-xs font-black ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatDuration(matchElapsedSec)}
                </div>
              </div>
            </div>

            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <div
                  className={`text-[9px] uppercase font-bold truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {t.currentRoundTime}
                </div>
                <div
                  className={`font-mono text-xs font-black ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatDuration(currentRoundElapsedSec)}
                </div>
              </div>
            </div>

            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div
                  className={`text-[9px] uppercase font-bold truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {t.movesInRound}
                </div>
                <div
                  className={`font-mono text-xs font-black ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatLocalNumber(state.currentRoundMoves.length, lang)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Details: Current Round Move Trail + Completed Rounds History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3.5">
          {/* Left: Current Round Move Sequence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5 text-amber-500" />
                {t.moveHistoryLabel}
              </span>
            </div>

            {state.currentRoundMoves.length === 0 ? (
              <div
                className={`rounded-2xl p-3.5 text-xs border border-dashed text-center ${
                  isDark
                    ? 'bg-white/[0.02] border-white/10 text-slate-400'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}
              >
                {t.noMovesYet}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {state.currentRoundMoves.map((mv, idx) => {
                  const isLast = idx === state.currentRoundMoves.length - 1;
                  const moveDesc =
                    mv.actionType === 'place'
                      ? `${formatPointName(mv.to, lang)}`
                      : mv.actionType === 'capture'
                      ? `${formatPointName(mv.from ?? 0, lang)}×${formatPointName(
                          mv.capturedIndex ?? 0,
                          lang
                        )}→${formatPointName(mv.to, lang)}`
                      : `${formatPointName(mv.from ?? 0, lang)}→${formatPointName(
                          mv.to,
                          lang
                        )}`;

                  return (
                    <div
                      key={`${mv.moveNumber}-${mv.to}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        isLast
                          ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 ring-1 ring-yellow-400/50'
                          : mv.actionType === 'capture'
                          ? isDark
                            ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                          : mv.player === 'TIGER'
                          ? isDark
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                          : isDark
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      <span className="opacity-60 font-mono">
                        #{formatLocalNumber(mv.moveNumber, lang)}
                      </span>
                      {mv.player === 'TIGER' ? (
                        <TigerIcon className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <GoatIcon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate max-w-[80px]">{mv.playerName}</span>
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-black/20">
                        {moveDesc}
                      </span>
                      <span className="text-[9px] font-mono opacity-60">
                        {formatDuration(mv.elapsedSeconds)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Completed Rounds Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {t.roundHistoryLabel}
              </span>
            </div>

            {state.roundHistory.length === 0 ? (
              <div
                className={`rounded-2xl p-3.5 text-xs border border-dashed text-center ${
                  isDark
                    ? 'bg-white/[0.02] border-white/10 text-slate-400'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}
              >
                {t.noRoundsCompleted}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {state.roundHistory.map((r) => {
                  const isExpanded = expandedRound === r.round;
                  return (
                    <div
                      key={r.round}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-slate-200'
                          : 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        {/* Mini Board Snapshot */}
                        {r.finalBoard && r.finalBoard.length === 25 && (
                          <MiniAlquerqueSnapshot round={r} isDark={isDark} />
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              {t.round} {formatLocalNumber(r.round, lang)}
                            </span>
                            <span
                              className={`text-xs font-extrabold truncate flex items-center gap-1 ${
                                r.winner === 'TIGER'
                                  ? 'text-amber-500'
                                  : 'text-emerald-500'
                              }`}
                            >
                              {r.winner === 'TIGER' ? (
                                <TigerIcon className="w-3.5 h-3.5 inline" />
                              ) : (
                                <GoatIcon className="w-3.5 h-3.5 inline" />
                              )}
                              {t.winnerLabel} {r.winnerName}
                            </span>
                            {r.winReason === 'paani_ghara' && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                                PAANI GHARA 👑
                              </span>
                            )}
                          </div>

                          <div
                            className={`text-[10px] font-semibold flex items-center gap-2 flex-wrap ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            <span>
                              {t.durationLabel}{' '}
                              <strong className="font-mono">
                                {formatDuration(r.durationSeconds)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              {t.totalMovesLabel}{' '}
                              <strong className="font-mono">
                                {formatLocalNumber(r.moves.length, lang)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              {t.goatsCapturedLabel}:{' '}
                              <strong className="text-rose-500">
                                {formatLocalNumber(r.goatsCaptured, lang)}
                              </strong>
                            </span>
                          </div>

                          {r.finalMove && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-yellow-400/20 text-yellow-500 border border-yellow-400/40">
                                <Sparkles className="w-2.5 h-2.5" />
                                {t.winningMoveLabel}{' '}
                                {formatPointName(r.finalMove.to, lang)}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRound(isExpanded ? null : r.round)
                          }
                          className={`p-1.5 rounded-xl border text-xs transition-colors ${
                            isDark
                              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                          title="Toggle Move Sequence"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Expandable Full Move Trail for this Completed Round */}
                      {isExpanded && r.moves.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-75">
                            <Grid className="w-3 h-3 text-amber-500" />
                            <span>
                              {t.moveHistoryLabel} ({formatLocalNumber(r.moves.length, lang)})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {r.moves.map((m) => (
                              <span
                                key={`${r.round}-${m.moveNumber}`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                  m.player === 'TIGER'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                <span className="opacity-60 font-mono">
                                  #{formatLocalNumber(m.moveNumber, lang)}
                                </span>
                                <span>{m.player === 'TIGER' ? '🐯' : '🐐'}</span>
                                <span className="font-mono">
                                  {formatPointName(m.to, lang)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick DesiGames Home Link in Footer */}
        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            {t.footerText}
          </span>
          <a
            href="https://imsbg.github.io/desigames/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-amber-500 hover:underline"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t.homeMenuBtn}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
