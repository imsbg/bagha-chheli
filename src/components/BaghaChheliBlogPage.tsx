import React from 'react';
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  Trophy,
  Languages,
  Sun,
  Moon,
  ArrowRight,
  HelpCircle,
  Home,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '../utils/translations';
import { PromoBanner } from './PromoBanner';
import {
  TigerIcon,
  GoatIcon,
  BoardTigerPieceG,
  BoardGoatPieceG,
} from './PieceIcons';
import { ADJACENCY_MAP, POINT_COORDS } from '../game/rules';

interface BaghaChheliBlogPageProps {
  lang: Language;
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onPlayHere?: () => void;
}

const DESIGAMES_HUB_URL = 'https://imsbg.github.io/desigames/';
const DESIBINGO_URL = 'https://desibingo.netlify.app/';
const CHHAKI_SUNA_URL = 'https://imsbg.github.io/Chhaki-Suna/';

export const BaghaChheliBlogPage: React.FC<BaghaChheliBlogPageProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onPlayHere,
}) => {
  const isDark = theme === 'dark';
  const isOdia = lang === 'or';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Sticky Blog Header */}
      <header className="sticky top-0 z-50 px-3 sm:px-6 pt-2 pb-1">
        <div
          className={`max-w-5xl mx-auto rounded-2xl px-4 py-2 flex items-center justify-between border md:backdrop-blur-2xl ${
            isDark
              ? 'bg-slate-900/95 md:bg-slate-900/85 border-white/15 shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
              : 'bg-white/95 md:bg-white/90 border-slate-200/90 shadow-md md:shadow-[0_8px_32px_rgba(15,23,42,0.08)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-md shadow-orange-500/20 text-white shrink-0">
              <TigerIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-black tracking-tight block leading-none truncate">
                {isOdia ? 'ବାଘ ଛେଳି' : 'Bagha Chheli'}
              </span>
              <span
                className={`text-[10px] font-semibold block truncate mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isOdia
                  ? 'ଓଡ଼ିଆ ପାରମ୍ପରିକ ଖେଳ ନିୟମ ଓ ବ୍ଲଗ୍'
                  : 'Official Strategy Guide & Rules'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={DESIGAMES_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-orange-500/15 hover:bg-orange-500/25 text-amber-300 border-orange-500/30'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="hidden sm:inline">
                {isOdia ? 'ହୋମ୍' : 'Home'}
              </span>
            </a>

            <button
              onClick={onToggleLang}
              className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-amber-700 border-slate-300'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isOdia ? 'English' : 'ଓଡ଼ିଆ'}</span>
            </button>

            <button
              onClick={onToggleTheme}
              className={`w-9 h-9 rounded-xl border inline-flex items-center justify-center transition-all shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-amber-300 border-white/15'
                  : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300'
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {onPlayHere && (
              <button
                onClick={onPlayHere}
                className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all whitespace-nowrap shrink-0"
              >
                <span>{isOdia ? 'ଖେଳନ୍ତୁ' : 'Play Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Article Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Hero Article Banner */}
        <article
          className={`rounded-3xl p-6 sm:p-10 border relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/90 via-amber-950/35 to-slate-900/90 border-white/15 shadow-2xl'
              : 'bg-gradient-to-br from-white via-amber-50/60 to-emerald-50/60 border-slate-200/90 shadow-xl'
          }`}
        >
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isOdia
                  ? 'ଓଡ଼ିଶାର ପ୍ରାଚୀନ ବୁଦ୍ଧି ଖେଳ • ୪ଟି ବାଘ ବନାମ ୨୦ଟି ଛେଳି'
                  : 'Odisha’s Ancient Strategy Board Game • 4 Tigers vs 20 Goats'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight">
              {isOdia ? (
                <>
                  ବାଘ ଛେଳି ଖେଳ:{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500">
                    ସମ୍ପୂର୍ଣ୍ଣ ନିୟମ, କୌଶଳ ଓ ପାଣି ଘର
                  </span>
                </>
              ) : (
                <>
                  Bagha Chheli:{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500">
                    Complete Rules, Strategy & Paani Ghara Guide
                  </span>
                </>
              )}
            </h1>

            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {isOdia
                ? 'ବାଘ ଛେଳି ହେଉଛି ଓଡ଼ିଶାର ସବୁଠାରୁ ଲୋକପ୍ରିୟ ପାରମ୍ପରିକ ବୋର୍ଡ ଖେଳ। ୨୫ଟି ଗଣ୍ଠି (ଛକ) ବିଶିଷ୍ଟ ବୋର୍ଡରେ ୪ଟି ଶକ୍ତିଶାଳୀ ବାଘ ଏବଂ ୨୦ଟି ଛେଳିଙ୍କ ମଧ୍ୟରେ ଏହି ରୋମାଞ୍ଚକର ଲଢ଼େଇ ଶେଷ ପର୍ଯ୍ୟନ୍ତ ଚାଲେ। ବାଘର ଲକ୍ଷ୍ୟ ଛେଳିମାନଙ୍କୁ ଡେଇଁ ଶିକାର କରିବା, ଆଉ ଛେଳିମାନଙ୍କର ଲକ୍ଷ୍ୟ ଚାରିପଟୁ ଘେରି ସବୁ ୪ଟି ବାଘକୁ ବନ୍ଦୀ କରିବା!'
                : 'Bagha Chheli (Tigers and Goats) is Odisha’s classic asymmetric abstract strategy board game played on a 25-point Alquerque grid. Four Tigers hunt Goats by jumping over them until the end of the match, while a cooperative herd of 20 Goats works together to surround and trap all 4 Tigers.'}
            </p>

            {/* Primary CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onPlayHere && (
                <button
                  onClick={onPlayHere}
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-sm sm:text-base inline-flex items-center gap-2.5 shadow-xl shadow-orange-500/25 transition-all active:scale-[0.99] whitespace-nowrap"
                >
                  <span>
                    {isOdia
                      ? 'ଏବେ ଅନଲାଇନ୍ କିମ୍ବା କମ୍ପ୍ୟୁଟର ସହିତ ଖେଳନ୍ତୁ'
                      : 'Launch Live Bagha Chheli Game'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}

              <a
                href={DESIGAMES_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`h-12 px-5 rounded-2xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/15'
                    : 'bg-white hover:bg-slate-100 text-orange-800 border-slate-300 shadow-sm'
                }`}
              >
                <Home className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Desi Games</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
              </a>
            </div>
          </div>
        </article>

        {/* Visual SVG Board Diagram & Piece Showcase */}
        <section
          className={`rounded-3xl p-6 sm:p-8 border ${
            isDark
              ? 'bg-slate-900/70 border-white/15'
              : 'bg-white border-slate-200/90 shadow-md'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center">
              <div
                className={`w-full max-w-[300px] aspect-square p-4 rounded-3xl border ${
                  isDark
                    ? 'bg-slate-950/80 border-amber-500/30'
                    : 'bg-amber-50/90 border-amber-300'
                }`}
              >
                <svg viewBox="-10 -10 120 120" className="w-full h-full">
                  <defs>
                    <radialGradient id="boardTigerGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="55%" stopColor="#EA580C" />
                      <stop offset="100%" stopColor="#9A3412" />
                    </radialGradient>
                    <radialGradient id="boardGoatGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="55%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#064E3B" />
                    </radialGradient>
                  </defs>
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
                          stroke={isDark ? 'rgba(226,232,240,0.45)' : 'rgba(120,53,15,0.6)'}
                          strokeWidth="1.2"
                        />
                      ))
                  )}
                  {POINT_COORDS.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="1.8"
                      fill={isDark ? '#94A3B8' : '#78350F'}
                    />
                  ))}
                  {/* Capture Landing Target Rings at (0,50), (100,50), (0,100), and (100,100) */}
                  {[
                    { x: 0, y: 50 },
                    { x: 100, y: 50 },
                    { x: 0, y: 100 },
                    { x: 100, y: 100 },
                  ].map((pt, i) => (
                    <g key={`cap-${i}`}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6.2"
                        fill="rgba(244, 63, 94, 0.22)"
                        stroke="#F43F5E"
                        strokeWidth="1.2"
                        strokeDasharray="2 1.5"
                      />
                      <circle cx={pt.x} cy={pt.y} r="2.4" fill="#F43F5E" />
                    </g>
                  ))}
                  <BoardTigerPieceG cx={0} cy={0} />
                  <BoardTigerPieceG cx={50} cy={50} isSelected />
                  <BoardTigerPieceG cx={100} cy={0} />
                  <BoardTigerPieceG cx={50} cy={100} isSelected />
                  <BoardGoatPieceG cx={25} cy={25} />
                  <BoardGoatPieceG cx={75} cy={25} />
                  <BoardGoatPieceG cx={25} cy={75} isThreatened />
                  <BoardGoatPieceG cx={75} cy={75} isThreatened />
                </svg>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                  {isOdia
                    ? 'ବାଘ ଛେଳି ଖେଳିବାର ୪ଟି ପର୍ଯ୍ୟାୟ'
                    : 'The 4 Authentic Phases of Bagha Chheli'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-amber-500 mb-1">
                    <TigerIcon className="w-5 h-5" />
                    <span>
                      {isOdia ? '୧. ପ୍ରଥମେ ୪ଟି ବାଘ ବସିବା' : '1. Place All 4 Tigers First'}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {isOdia
                      ? 'ଖେଳ ଆରମ୍ଭରେ ବାଘ ଖେଳାଳି ବୋର୍ଡର ଯେକୌଣସି ୪ଟି ଖାଲି ଛକରେ ଗୋଟିଏ ପରେ ଗୋଟିଏ ୪ଟି ଯାକ ବାଘ ବସାନ୍ତି।'
                      : 'The Tiger player opens the match by placing all 4 Tigers onto any empty intersections on the 25-point board.'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-emerald-500 mb-1">
                    <GoatIcon className="w-5 h-5" />
                    <span>
                      {isOdia ? '୨. ପ୍ରଥମ ୪ଟି ଛେଳି ବସିବା' : '2. Place First 4 Goats'}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {isOdia
                      ? '୪ଟି ବାଘ ବସିବା ପରେ ଛେଳି ଖେଳାଳି ପ୍ରଥମ ୪ଟି ଛେଳି ଯେକୌଣସି ଖାଲି ଛକରେ ବସାନ୍ତି।'
                      : 'Next, the Goat player places their initial batch of 4 Goats onto any remaining empty points.'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sky-400 mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {isOdia ? '୩. ମୁଖ୍ୟ ଖେଳ (ବାକି ୧୬ ଛେଳି)' : '3. Main Play (16 Goats Left)'}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {isOdia
                      ? 'ଏବେ ପାଳି କରି ଖେଳ ଚାଲେ। ବାଘ ପାଖ ଛକକୁ ଚାଲେ ବା ଛେଳି ଡେଇଁ ଖାଏ; ଛେଳି ଖେଳାଳି ପ୍ରତି ପାଳିରେ ୧ଟି ଲେଖାଏଁ ନୂଆ ଛେଳି ବସାନ୍ତି।'
                      : 'Players alternate turns starting with Tiger. Tigers move or jump to capture Goats, while Goat places 1 new Goat per turn until all 20 are placed.'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-purple-50/70 border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-purple-400 mb-1">
                    <Crown className="w-5 h-5" />
                    <span>
                      {isOdia ? '୪. ଛେଳି ଚାଲିବା ଓ "ପାଣି ଘର"' : '4. Goat Movement & Paani Ghara'}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {isOdia
                      ? '୨୦ଟି ଛେଳି ବସିବା ପରେ ଛେଳି ପାଖ ଖାଲି ଛକକୁ ଚାଲିପାରେ। ଗୋଟିଏ ବି ଛେଳି ନ ମରି ୪ଟି ବାଘ ବନ୍ଦୀ ହେଲେ "ପାଣି ଘର" ହୁଏ!'
                      : 'Once all 20 Goats are placed, Goats move 1 step along lines. Trapping all 4 Tigers with 0 captures achieves "Paani Ghara"!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ & More Odia Games Section */}
        <section
          className={`rounded-3xl p-6 sm:p-8 border ${
            isDark
              ? 'bg-slate-900/70 border-white/15'
              : 'bg-white border-slate-200/90 shadow-md'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-2xl font-black tracking-tight">
              {isOdia
                ? 'ବାରମ୍ବାର ପଚରାଯାଉଥିବା ପ୍ରଶ୍ନ'
                : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <h3 className="font-extrabold mb-1.5 text-amber-500">
                {isOdia
                  ? 'ପ୍ରଶ୍ନ ୧: "ପାଣି ଘର" ମାନେ କ’ଣ?'
                  : 'Q1: What is "Paani Ghara" in Bagha Chheli?'}
              </h3>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {isOdia
                  ? 'ଯଦି ଛେଳି ଖେଳାଳି ଗୋଟିଏ ବି ଛେଳି ନ ହରାଇ (୦ ଶିକାର) ୨୦ଟି ଯାକ ଛେଳି ବୋର୍ଡରେ ବସାଇ ଚାରୋଟି ଯାକ ବାଘକୁ ବନ୍ଦୀ କରିଦିଅନ୍ତି, ତାହାକୁ ଓଡ଼ିଆରେ "ପାଣି ଘର" କୁହାଯାଏ।'
                  : 'When the Goat player places all 20 Goats on the board and traps all 4 Tigers without a single Goat being captured, it is celebrated as a "Paani Ghara" victory.'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <h3 className="font-extrabold mb-1.5 text-emerald-500">
                {isOdia
                  ? 'ପ୍ରଶ୍ନ ୨: ଛେଳି କେବେ ଗୋଟିଏ ଛକରୁ ଅନ୍ୟ ଛକକୁ ଚାଲିପାରିବ?'
                  : 'Q2: When can Goats start moving on the board?'}
              </h3>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {isOdia
                  ? 'ହାତରେ ଥିବା ସବୁ ୨୦ଟି ଛେଳି ବୋର୍ଡରେ ବସିସାରିବା ପରେ ହିଁ ଛେଳିମାନେ ଗାର ଧରି ପାଖ ଖାଲି ଛକକୁ ଗୋଟିଏ ପାଦ ଚାଲିପାରିବେ।'
                  : 'Goats can only move along board lines after all 20 Goats from the supply have been placed onto the board (Phase 3: Goat Movement).'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <h3 className="font-extrabold mb-1.5 text-purple-400">
                {isOdia
                  ? 'ପ୍ରଶ୍ନ ୩: ସାଙ୍ଗମାନଙ୍କ ସହିତ ଅନଲାଇନ୍ ରେ କିପରି ଖେଳିବେ?'
                  : 'Q3: How do I play online with friends or spectators?'}
              </h3>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {isOdia
                  ? '"ନୂଆ ଅନଲାଇନ୍ ରୁମ୍" ବଟନ୍ ଦବାଇ ୬-ଅକ୍ଷରର SBXXXX କୋଡ୍ ତିଆରି କରନ୍ତୁ ଏବଂ ସାଙ୍ଗଙ୍କୁ ପଠାନ୍ତୁ।'
                  : 'Click "Create Online Room" to generate an SBXXXX code. Share the link or QR code with friends so they can join as Goat or watch live as a spectator.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>
                {isOdia
                  ? 'ଅନ୍ୟାନ୍ୟ ଲୋକପ୍ରିୟ Desi Games:'
                  : 'Play More Desi Games:'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={DESIGAMES_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-amber-400 border border-orange-500/30 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Desi Games</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={DESIBINGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>DesiBingo (5×5)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={CHHAKI_SUNA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{isOdia ? 'ଛକି ଶୂନ' : 'Chhaki Suna'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <PromoBanner theme={theme} lang={lang} />
    </div>
  );
};
