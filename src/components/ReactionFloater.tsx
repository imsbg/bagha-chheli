import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerSide } from '../game/rules';

export interface ActiveReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderSide: PlayerSide | 'SPECTATOR';
}

interface ReactionFloaterProps {
  reactions: ActiveReaction[];
  theme: 'dark' | 'light';
}

export const EMOJI_OPTIONS = ['🐯', '🐐', '🔥', '👏', '😂', '😱', '🎉', '😎'];

/**
 * Non-Intrusive Top-Right Corner Toast for Incoming/Outgoing Emoji Reactions
 * Never blocks the center of the board or interrupts gameplay!
 */
export const BoardReactionOverlay: React.FC<ReactionFloaterProps> = ({ reactions, theme }) => {
  const isDark = theme === 'dark';
  const latestReaction = reactions.length > 0 ? reactions[reactions.length - 1] : null;

  return (
    <div className="pointer-events-none fixed sm:absolute top-16 sm:top-3 right-3 z-40 flex flex-col items-end gap-1.5">
      <AnimatePresence mode="popLayout">
        {latestReaction && (
          <motion.div
            key={latestReaction.id}
            initial={{ opacity: 0, scale: 0.7, x: 24, y: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`px-3.5 py-2 rounded-2xl border shadow-xl md:backdrop-blur-2xl flex items-center gap-2.5 ${
              isDark
                ? 'bg-slate-900 border-amber-500/40 text-white shadow-xl md:shadow-[0_10px_30px_rgba(0,0,0,0.7)]'
                : 'bg-white border-amber-400/60 text-slate-900 shadow-xl md:shadow-[0_10px_30px_rgba(15,23,42,0.2)]'
            }`}
          >
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.4 }}
              className="text-2xl sm:text-3xl leading-none select-none"
            >
              {latestReaction.emoji}
            </motion.span>
            <div className="flex flex-col text-left leading-tight">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  latestReaction.senderSide === 'TIGER'
                    ? 'text-amber-400'
                    : latestReaction.senderSide === 'GOAT'
                    ? 'text-emerald-400'
                    : 'text-purple-400'
                }`}
              >
                {latestReaction.senderSide === 'SPECTATOR'
                  ? '👁️'
                  : latestReaction.senderSide === 'TIGER'
                  ? '🐯'
                  : '🐐'}
              </span>
              <span className="text-xs font-extrabold tracking-tight max-w-[110px] truncate">
                {latestReaction.senderName}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReactionBarProps {
  onSendReaction: (emoji: string) => void;
  theme: 'dark' | 'light';
  label: string;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ onSendReaction, theme, label }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full rounded-2xl px-3 py-2 flex items-center justify-between gap-2 md:backdrop-blur-xl border transition-colors ${
        isDark
          ? 'bg-slate-900/95 md:bg-slate-900/60 border-white/15 shadow-md md:shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
          : 'bg-white/95 md:bg-white/80 border-slate-200/90 shadow-sm md:shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
      }`}
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-wider hidden xl:inline pl-1 whitespace-nowrap ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
      <div className="flex items-center justify-between flex-1 gap-1">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            className={`h-9 flex-1 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all hover:scale-115 active:scale-90 ${
              isDark
                ? 'hover:bg-white/10 active:bg-white/20'
                : 'hover:bg-slate-200/70 active:bg-slate-300/70'
            }`}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
