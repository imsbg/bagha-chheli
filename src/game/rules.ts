/**
 * Bagha Chheli (ବାଘ ଛେଳି) — Core Game Rules, Board Topology, Move Validation & Smart AI
 * Preserves the exact traditional Odia Bagha Chheli rules:
 * - 25 points (5x5 Alquerque grid with 8-way & 4-way intersections)
 * - Phase 1A (TIGER_PLACEMENT): Tiger places all 4 tigers on any empty points
 * - Phase 1B (GOAT_INITIAL_PLACEMENT): Goat places first 4 goats on any empty points
 * - Phase 2 (MAIN_PLAY): Tigers move/capture; Goats place 1 new goat per turn until 20 placed
 * - Phase 3 (GOAT_MOVEMENT): Once all 20 goats are placed, Goats move 1 adjacent step per turn
 * - Win Conditions:
 *   1. Tigers win by capturing 5 goats (GOATS_TO_CAPTURE_FOR_WIN = 5)
 *   2. Goats win by trapping all 4 tigers so none can move
 *   3. Special "Paani Ghara" (ପାଣି ଘର) Win: All 20 goats placed and tigers trapped with 0 captures!
 */

export type PieceType = 'TIGER' | 'GOAT';
export type PlayerSide = 'TIGER' | 'GOAT';
export type BoardPoint = PieceType | null;
export type BaghaBoard = BoardPoint[];

export type GamePhase =
  | 'TIGER_PLACEMENT'
  | 'GOAT_INITIAL_PLACEMENT'
  | 'MAIN_PLAY'
  | 'GOAT_MOVEMENT';

export type GameStatus = 'playing' | 'won' | 'draw';

export type WinReason = 'captures' | 'trapped' | 'paani_ghara';

export interface WinInfo {
  winner: PlayerSide;
  reason: WinReason;
  finalMoveText: string;
}

export interface ValidMoveOption {
  from: number | null; // null when placing a piece from supply
  to: number;
  isCapture: boolean;
  capturedIndex: number | null;
}

export interface MoveRecord {
  moveNumber: number;
  player: PlayerSide;
  playerName: string;
  phase: GamePhase;
  actionType: 'place' | 'move' | 'capture';
  from: number | null;
  to: number;
  capturedIndex: number | null;
  elapsedSeconds: number;
  goatsCapturedAfter: number;
  goatsOnBoardAfter: number;
  trappedTigersAfter: number;
}

export interface RoundRecord {
  round: number;
  winner: PlayerSide | 'draw';
  winnerName: string;
  winReason: WinReason;
  durationSeconds: number;
  moves: MoveRecord[];
  finalMove: MoveRecord | null;
  finalBoard: BaghaBoard;
  goatsCaptured: number;
  goatsOnBoard: number;
  goatsPlacedTotal: number;
  trappedTigers: number;
  tigerPlayerName: string;
  goatPlayerName: string;
  completedAt: number;
}

export interface BaghaCoreState {
  board: BaghaBoard;
  currentTurn: PlayerSide;
  phase: GamePhase;
  tigersToPlace: number;
  goatsToPlaceInitially: number;
  goatsPlacedTotal: number;
  goatsOnBoard: number;
  goatsCaptured: number;
  selectedPieceIndex: number | null;
  status: GameStatus;
  winInfo: WinInfo | null;
}

export const NUM_POINTS = 25;
export const TOTAL_TIGERS = 4;
export const TOTAL_GOATS = 20;
export const INITIAL_GOATS_BATCH = 4;
export const GOATS_TO_CAPTURE_FOR_WIN = 20;

/**
 * Generates a random player ID in the range sb-1a0a to sb-9z9z
 */
export function generateRandomPlayerId(): string {
  const digits1to9 = '123456789';
  const digits0to9 = '0123456789';
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const d1 = digits1to9.charAt(Math.floor(Math.random() * digits1to9.length));
  const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const d2 = digits0to9.charAt(Math.floor(Math.random() * digits0to9.length));
  const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
  return `sb-${d1}${l1}${d2}${l2}`;
}

/**
 * Exact 25-point adjacency map from traditional Odia Bagha Chheli
 */
export const ADJACENCY_MAP: readonly number[][] = [
  [1, 5, 6],
  [0, 2, 6],
  [1, 3, 6, 7, 8],
  [2, 4, 8],
  [3, 8, 9],
  [0, 6, 10],
  [0, 1, 2, 5, 7, 10, 11, 12],
  [2, 6, 8, 12],
  [2, 3, 4, 7, 9, 12, 13, 14],
  [4, 8, 14],
  [5, 6, 11, 15, 16],
  [6, 10, 12, 16],
  [6, 7, 8, 11, 13, 16, 17, 18],
  [8, 12, 14, 18],
  [8, 9, 13, 18, 19],
  [10, 16, 20],
  [10, 11, 12, 15, 17, 20, 21, 22],
  [12, 16, 18, 22],
  [12, 13, 14, 17, 19, 22, 23, 24],
  [14, 18, 24],
  [15, 16, 21],
  [16, 20, 22],
  [16, 17, 18, 21, 23],
  [18, 22, 24],
  [18, 19, 23],
];

/**
 * SVG coordinate positions for all 25 intersections (0..100 x 0..100)
 */
export const POINT_COORDS: ReadonlyArray<{ x: number; y: number; row: number; col: number; label: string }> =
  Array.from({ length: NUM_POINTS }, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return {
      x: col * 25,
      y: row * 25,
      row,
      col,
      label: `${i + 1}`,
    };
  });

const ODIA_DIGITS = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];

export function formatLocalNumber(num: number | string, lang: 'en' | 'or'): string {
  const str = String(num);
  if (lang !== 'or') return str;
  return str.replace(/[0-9]/g, (d) => ODIA_DIGITS[Number(d)] || d);
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatPointName(index: number, lang: 'en' | 'or' = 'en'): string {
  if (index < 0 || index >= NUM_POINTS) return '';
  return `#${formatLocalNumber(index + 1, lang)}`;
}

/**
 * Room Code Utilities (SBXXXX format matching DesiGames / DesiBingo)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SB${suffix}`;
}

export function normalizeRoomCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('SB') && cleaned.length === 6) {
    return cleaned;
  }
  if (cleaned.length === 4) {
    return `SB${cleaned}`;
  }
  return cleaned;
}

export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code);
  return /^SB[A-Z0-9]{4}$/.test(normalized);
}

/**
 * Create a fresh initial Bagha Chheli board state
 */
export function createInitialCoreState(): BaghaCoreState {
  return {
    board: Array(NUM_POINTS).fill(null),
    currentTurn: 'TIGER',
    phase: 'TIGER_PLACEMENT',
    tigersToPlace: TOTAL_TIGERS,
    goatsToPlaceInitially: INITIAL_GOATS_BATCH,
    goatsPlacedTotal: 0,
    goatsOnBoard: 0,
    goatsCaptured: 0,
    selectedPieceIndex: null,
    status: 'playing',
    winInfo: null,
  };
}

/**
 * Check if two board points are directly connected by a line
 */
export function isAdjacent(idx1: number, idx2: number): boolean {
  if (idx1 < 0 || idx1 >= NUM_POINTS || idx2 < 0 || idx2 >= NUM_POINTS) return false;
  return ADJACENCY_MAP[idx1].includes(idx2);
}

/**
 * Check if a tiger at `start` can capture a goat by jumping to `end`
 * Exact collinearity + adjacency check from traditional Bagha Chheli
 */
export function isTigerCapture(
  board: BaghaBoard,
  start: number,
  end: number
): { isCapture: boolean; middleIndex: number | null } {
  if (start < 0 || start >= NUM_POINTS || end < 0 || end >= NUM_POINTS) {
    return { isCapture: false, middleIndex: null };
  }
  if (board[start] !== 'TIGER' || board[end] !== null) {
    return { isCapture: false, middleIndex: null };
  }
  const mid = start + (end - start) / 2;
  if (
    Number.isInteger(mid) &&
    board[mid] === 'GOAT' &&
    isAdjacent(start, mid) &&
    isAdjacent(mid, end)
  ) {
    const dx1 = (mid % 5) - (start % 5);
    const dy1 = Math.floor(mid / 5) - Math.floor(start / 5);
    const dx2 = (end % 5) - (mid % 5);
    const dy2 = Math.floor(end / 5) - Math.floor(mid / 5);
    if (dx1 === dx2 && dy1 === dy2) {
      return { isCapture: true, middleIndex: mid };
    }
  }
  return { isCapture: false, middleIndex: null };
}

/**
 * Check if a tiger at `tigerIndex` has at least one legal move or capture
 */
export function canTigerMove(board: BaghaBoard, tigerIndex: number): boolean {
  if (board[tigerIndex] !== 'TIGER') return false;
  if (ADJACENCY_MAP[tigerIndex].some((n) => board[n] === null)) return true;
  for (let i = 0; i < NUM_POINTS; i++) {
    if (isTigerCapture(board, tigerIndex, i).isCapture) return true;
  }
  return false;
}

/**
 * Returns the indices of all tigers currently trapped (0 legal moves)
 */
export function getTrappedTigerIndices(board: BaghaBoard): number[] {
  const trapped: number[] = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    if (board[i] === 'TIGER' && !canTigerMove(board, i)) {
      trapped.push(i);
    }
  }
  return trapped;
}

/**
 * Returns all valid move/capture destinations for a specific piece at `fromIndex`
 */
export function getValidMovesForPiece(
  board: BaghaBoard,
  fromIndex: number,
  phase: GamePhase
): ValidMoveOption[] {
  if (fromIndex < 0 || fromIndex >= NUM_POINTS) return [];
  const piece = board[fromIndex];
  if (!piece) return [];

  if (piece === 'TIGER' && (phase === 'MAIN_PLAY' || phase === 'GOAT_MOVEMENT')) {
    const moves: ValidMoveOption[] = [];
    // Adjacent empty moves
    for (const neighbor of ADJACENCY_MAP[fromIndex]) {
      if (board[neighbor] === null) {
        moves.push({
          from: fromIndex,
          to: neighbor,
          isCapture: false,
          capturedIndex: null,
        });
      }
    }
    // Jump captures
    for (let dest = 0; dest < NUM_POINTS; dest++) {
      const cap = isTigerCapture(board, fromIndex, dest);
      if (cap.isCapture && cap.middleIndex !== null) {
        moves.push({
          from: fromIndex,
          to: dest,
          isCapture: true,
          capturedIndex: cap.middleIndex,
        });
      }
    }
    return moves;
  }

  if (piece === 'GOAT' && phase === 'GOAT_MOVEMENT') {
    const moves: ValidMoveOption[] = [];
    for (const neighbor of ADJACENCY_MAP[fromIndex]) {
      if (board[neighbor] === null) {
        moves.push({
          from: fromIndex,
          to: neighbor,
          isCapture: false,
          capturedIndex: null,
        });
      }
    }
    return moves;
  }

  return [];
}

/**
 * Returns all legal actions for the active player in the current state
 */
export function getAllLegalActions(state: BaghaCoreState): ValidMoveOption[] {
  if (state.status !== 'playing') return [];

  if (
    state.phase === 'TIGER_PLACEMENT' ||
    state.phase === 'GOAT_INITIAL_PLACEMENT' ||
    (state.phase === 'MAIN_PLAY' && state.currentTurn === 'GOAT')
  ) {
    const placements: ValidMoveOption[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      if (state.board[i] === null) {
        placements.push({
          from: null,
          to: i,
          isCapture: false,
          capturedIndex: null,
        });
      }
    }
    return placements;
  }

  const moves: ValidMoveOption[] = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    if (state.board[i] === state.currentTurn) {
      moves.push(...getValidMovesForPiece(state.board, i, state.phase));
    }
  }
  return moves;
}

/**
 * Evaluate win conditions after a move or placement
 */
export function evaluateWinState(
  board: BaghaBoard,
  phase: GamePhase,
  goatsCaptured: number,
  goatsPlacedTotal: number,
  lastMoveText: string = ''
): { status: GameStatus; winInfo: WinInfo | null } {
  if (goatsCaptured >= GOATS_TO_CAPTURE_FOR_WIN) {
    return {
      status: 'won',
      winInfo: {
        winner: 'TIGER',
        reason: 'captures',
        finalMoveText: lastMoveText,
      },
    };
  }

  if (phase !== 'TIGER_PLACEMENT' && phase !== 'GOAT_INITIAL_PLACEMENT') {
    const tigerIndices = board
      .map((p, i) => (p === 'TIGER' ? i : -1))
      .filter((i) => i !== -1);

    if (tigerIndices.length > 0 && !tigerIndices.some((idx) => canTigerMove(board, idx))) {
      const isPaaniGhara = goatsPlacedTotal === TOTAL_GOATS && goatsCaptured === 0;
      return {
        status: 'won',
        winInfo: {
          winner: 'GOAT',
          reason: isPaaniGhara ? 'paani_ghara' : 'trapped',
          finalMoveText: lastMoveText,
        },
      };
    }

    // Also check if it's GOAT_MOVEMENT and no goat can move at all (rare edge case: Tigers win by blocking all goats)
    if (phase === 'GOAT_MOVEMENT') {
      const goatIndices = board
        .map((p, i) => (p === 'GOAT' ? i : -1))
        .filter((i) => i !== -1);
      const anyGoatCanMove = goatIndices.some((gIdx) =>
        ADJACENCY_MAP[gIdx].some((n) => board[n] === null)
      );
      if (goatIndices.length > 0 && !anyGoatCanMove) {
        return {
          status: 'won',
          winInfo: {
            winner: 'TIGER',
            reason: 'captures',
            finalMoveText: lastMoveText,
          },
        };
      }
    }
  }

  return { status: 'playing', winInfo: null };
}

export interface ActionApplicationResult {
  nextState: BaghaCoreState;
  actionPerformed: {
    player: PlayerSide;
    phaseBefore: GamePhase;
    actionType: 'place' | 'move' | 'capture';
    from: number | null;
    to: number;
    capturedIndex: number | null;
  } | null;
}

/**
 * Apply a player action (either a placement at `to` with `from = null`, or a move from `from` to `to`).
 * Returns null if the action is illegal.
 */
export function applyPlayerAction(
  state: BaghaCoreState,
  from: number | null,
  to: number,
  actor: PlayerSide
): ActionApplicationResult | null {
  if (state.status !== 'playing') return null;
  if (state.currentTurn !== actor) return null;
  if (to < 0 || to >= NUM_POINTS) return null;

  const nextBoard = [...state.board];
  let nextPhase = state.phase;
  let nextTurn = state.currentTurn;
  let nextTigersToPlace = state.tigersToPlace;
  let nextGoatsToPlaceInitially = state.goatsToPlaceInitially;
  let nextGoatsPlacedTotal = state.goatsPlacedTotal;
  let nextGoatsOnBoard = state.goatsOnBoard;
  let nextGoatsCaptured = state.goatsCaptured;

  let actionType: 'place' | 'move' | 'capture' = 'place';
  let capturedIndex: number | null = null;

  // 1. TIGER PLACEMENT PHASE (4 Tigers placed consecutively)
  if (state.phase === 'TIGER_PLACEMENT') {
    if (actor !== 'TIGER' || from !== null || nextBoard[to] !== null) return null;
    nextBoard[to] = 'TIGER';
    nextTigersToPlace -= 1;
    if (nextTigersToPlace === 0) {
      nextPhase = 'GOAT_INITIAL_PLACEMENT';
      nextTurn = 'GOAT';
    }
    const moveLabel = `Tiger #${to + 1}`;
    const evalRes = evaluateWinState(
      nextBoard,
      nextPhase,
      nextGoatsCaptured,
      nextGoatsPlacedTotal,
      moveLabel
    );
    return {
      nextState: {
        board: nextBoard,
        currentTurn: nextTurn,
        phase: nextPhase,
        tigersToPlace: nextTigersToPlace,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        status: evalRes.status,
        winInfo: evalRes.winInfo,
      },
      actionPerformed: {
        player: actor,
        phaseBefore: state.phase,
        actionType: 'place',
        from: null,
        to,
        capturedIndex: null,
      },
    };
  }

  // 2. GOAT INITIAL PLACEMENT PHASE (First 4 Goats placed consecutively)
  if (state.phase === 'GOAT_INITIAL_PLACEMENT') {
    if (actor !== 'GOAT' || from !== null || nextBoard[to] !== null) return null;
    nextBoard[to] = 'GOAT';
    nextGoatsPlacedTotal += 1;
    nextGoatsOnBoard += 1;
    nextGoatsToPlaceInitially -= 1;

    if (nextGoatsToPlaceInitially === 0) {
      nextPhase = 'MAIN_PLAY';
      nextTurn = 'TIGER';
    }

    const moveLabel = `Goat #${to + 1}`;
    const evalRes = evaluateWinState(
      nextBoard,
      nextPhase,
      nextGoatsCaptured,
      nextGoatsPlacedTotal,
      moveLabel
    );

    return {
      nextState: {
        board: nextBoard,
        currentTurn: nextTurn,
        phase: nextPhase,
        tigersToPlace: nextTigersToPlace,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        status: evalRes.status,
        winInfo: evalRes.winInfo,
      },
      actionPerformed: {
        player: actor,
        phaseBefore: state.phase,
        actionType: 'place',
        from: null,
        to,
        capturedIndex: null,
      },
    };
  }

  // 3. MAIN PLAY — GOAT PLACEMENT (Goats 5..20 placed 1 per turn)
  if (state.phase === 'MAIN_PLAY' && actor === 'GOAT') {
    if (from !== null || nextBoard[to] !== null) return null;
    nextBoard[to] = 'GOAT';
    nextGoatsPlacedTotal += 1;
    nextGoatsOnBoard += 1;
    if (nextGoatsPlacedTotal === TOTAL_GOATS) {
      nextPhase = 'GOAT_MOVEMENT';
    }
    nextTurn = 'TIGER';

    const moveLabel = `Goat #${to + 1}`;
    const evalRes = evaluateWinState(
      nextBoard,
      nextPhase,
      nextGoatsCaptured,
      nextGoatsPlacedTotal,
      moveLabel
    );

    return {
      nextState: {
        board: nextBoard,
        currentTurn: nextTurn,
        phase: nextPhase,
        tigersToPlace: nextTigersToPlace,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        status: evalRes.status,
        winInfo: evalRes.winInfo,
      },
      actionPerformed: {
        player: actor,
        phaseBefore: state.phase,
        actionType: 'place',
        from: null,
        to,
        capturedIndex: null,
      },
    };
  }

  // 4. PIECE MOVEMENT (Tiger in MAIN_PLAY or GOAT_MOVEMENT, or Goat in GOAT_MOVEMENT)
  if (from === null || from < 0 || from >= NUM_POINTS) return null;
  if (nextBoard[from] !== actor || nextBoard[to] !== null) return null;

  if (actor === 'TIGER') {
    const cap = isTigerCapture(nextBoard, from, to);
    if (cap.isCapture && cap.middleIndex !== null) {
      nextBoard[to] = 'TIGER';
      nextBoard[from] = null;
      nextBoard[cap.middleIndex] = null;
      nextGoatsCaptured += 1;
      nextGoatsOnBoard -= 1;
      actionType = 'capture';
      capturedIndex = cap.middleIndex;
    } else if (isAdjacent(from, to)) {
      nextBoard[to] = 'TIGER';
      nextBoard[from] = null;
      actionType = 'move';
    } else {
      return null;
    }
    nextTurn = 'GOAT';
  } else {
    // Actor is GOAT in GOAT_MOVEMENT
    if (state.phase !== 'GOAT_MOVEMENT') return null;
    if (!isAdjacent(from, to)) return null;
    nextBoard[to] = 'GOAT';
    nextBoard[from] = null;
    actionType = 'move';
    nextTurn = 'TIGER';
  }

  const moveLabel =
    actionType === 'capture'
      ? `#${from + 1}×#${ (capturedIndex ?? 0) + 1 }→#${to + 1}`
      : `#${from + 1}→#${to + 1}`;

  const evalRes = evaluateWinState(
    nextBoard,
    nextPhase,
    nextGoatsCaptured,
    nextGoatsPlacedTotal,
    moveLabel
  );

  return {
    nextState: {
      board: nextBoard,
      currentTurn: nextTurn,
      phase: nextPhase,
      tigersToPlace: nextTigersToPlace,
      goatsToPlaceInitially: nextGoatsToPlaceInitially,
      goatsPlacedTotal: nextGoatsPlacedTotal,
      goatsOnBoard: nextGoatsOnBoard,
      goatsCaptured: nextGoatsCaptured,
      selectedPieceIndex: null,
      status: evalRes.status,
      winInfo: evalRes.winInfo,
    },
    actionPerformed: {
      player: actor,
      phaseBefore: state.phase,
      actionType,
      from,
      to,
      capturedIndex,
    },
  };
}

/**
 * Returns indices of all goats on the board that are currently in immediate danger of being captured
 */
export function getThreatenedGoatIndices(board: BaghaBoard): number[] {
  const threatened = new Set<number>();
  for (let i = 0; i < NUM_POINTS; i++) {
    if (board[i] === 'TIGER') {
      for (let dest = 0; dest < NUM_POINTS; dest++) {
        const cap = isTigerCapture(board, i, dest);
        if (cap.isCapture && cap.middleIndex !== null) {
          threatened.add(cap.middleIndex);
        }
      }
    }
  }
  return Array.from(threatened);
}

/**
 * Smart AI Bot for Bagha Chheli (can play as either TIGER or GOAT)
 */
export function getBestBotAction(state: BaghaCoreState): ValidMoveOption | null {
  if (state.status !== 'playing') return null;
  const actions = getAllLegalActions(state);
  if (actions.length === 0) return null;

  // 1. TIGER_PLACEMENT: Prefer strategic 8-way hubs (12, 6, 8, 16, 18) and corners (0, 4, 20, 24)
  if (state.phase === 'TIGER_PLACEMENT') {
    const preferredOrder = [6, 8, 16, 18, 12, 0, 4, 20, 24, 2, 10, 14, 22];
    for (const pt of preferredOrder) {
      const found = actions.find((a) => a.to === pt);
      if (found) return found;
    }
    return actions[0];
  }

  // 2. Bot playing as TIGER in MAIN_PLAY or GOAT_MOVEMENT
  if (state.currentTurn === 'TIGER') {
    // Immediate capture is highest priority
    const captures = actions.filter((a) => a.isCapture);
    if (captures.length > 0) {
      // Pick capture that leaves tigers with highest mobility or creates a follow-up capture threat
      let bestCap = captures[0];
      let bestScore = -9999;
      for (const cap of captures) {
        const sim = applyPlayerAction(state, cap.from, cap.to, 'TIGER');
        if (!sim) continue;
        if (sim.nextState.status === 'won') return cap;
        const nextThreatCount = getThreatenedGoatIndices(sim.nextState.board).length;
        const trappedCount = getTrappedTigerIndices(sim.nextState.board).length;
        const score = nextThreatCount * 20 - trappedCount * 35 + ADJACENCY_MAP[cap.to].length * 2;
        if (score > bestScore) {
          bestScore = score;
          bestCap = cap;
        }
      }
      return bestCap;
    }

    // Otherwise evaluate each normal tiger move
    let bestMove = actions[0];
    let bestScore = -9999;
    for (const move of actions) {
      const sim = applyPlayerAction(state, move.from, move.to, 'TIGER');
      if (!sim) continue;
      const b = sim.nextState.board;
      const threats = getThreatenedGoatIndices(b).length;
      const trapped = getTrappedTigerIndices(b).length;
      const mobility = b.reduce((acc, p, idx) => {
        if (p !== 'TIGER') return acc;
        return acc + getValidMovesForPiece(b, idx, 'MAIN_PLAY').length;
      }, 0);
      const centerBonus = ADJACENCY_MAP[move.to].length * 1.5;
      const score = threats * 25 + mobility * 4 - trapped * 40 + centerBonus;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 3. Bot playing as GOAT (GOAT_INITIAL_PLACEMENT, MAIN_PLAY placement, or GOAT_MOVEMENT)
  let bestGoatAction = actions[0];
  let bestGoatScore = -99999;

  const currentThreatened = getThreatenedGoatIndices(state.board).length;

  for (const act of actions) {
    const sim = applyPlayerAction(state, act.from, act.to, 'GOAT');
    if (!sim) continue;
    if (sim.nextState.status === 'won' && sim.nextState.winInfo?.winner === 'GOAT') {
      return act; // Immediate win!
    }
    const b = sim.nextState.board;
    const newThreatened = getThreatenedGoatIndices(b).length;
    const trappedTigers = getTrappedTigerIndices(b).length;
    const totalTigerMoves = b.reduce((acc, p, idx) => {
      if (p !== 'TIGER') return acc;
      return acc + getValidMovesForPiece(b, idx, 'MAIN_PLAY').length;
    }, 0);

    // Avoid giving away a capture!
    const capturePenalty = newThreatened * 120;
    const savedGoatBonus = currentThreatened > newThreatened ? 80 : 0;
    // Edge and corner points are harder to jump over
    const isCorner = act.to === 0 || act.to === 4 || act.to === 20 || act.to === 24;
    const isEdge =
      act.to % 5 === 0 || act.to % 5 === 4 || Math.floor(act.to / 5) === 0 || Math.floor(act.to / 5) === 4;
    const safetyBonus = (isCorner ? 14 : 0) + (isEdge ? 8 : 0);

    const score =
      savedGoatBonus -
      capturePenalty +
      trappedTigers * 65 -
      totalTigerMoves * 6 +
      safetyBonus;

    if (score > bestGoatScore) {
      bestGoatScore = score;
      bestGoatAction = act;
    }
  }

  return bestGoatAction;
}
