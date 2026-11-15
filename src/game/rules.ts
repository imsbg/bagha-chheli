/**
 * Bagha Chheli (ବାଘ ଛେଳି) — Core Game Rules, Board Topology, Move Validation & Pro Tactical AI
 * Preserves the exact traditional Odia Bagha Chheli rules with regional options:
 * - 25 points (5x5 Alquerque grid with 8-way & 4-way intersections)
 * - Phase 1A (TIGER_PLACEMENT): Tiger places all 4 tigers (compulsory) on any empty points
 * - Phase 1B (GOAT_INITIAL_PLACEMENT): Goat places initial batch of 4, 6, or 8 goats on any empty points
 * - Phase 2 (MAIN_PLAY): Tigers move/capture (including multi-jump chain captures); Goats place 1 new goat per turn until 20 placed
 * - Phase 3 (GOAT_MOVEMENT): Once all 20 goats are placed, Goats move 1 adjacent step per turn
 * - Win Conditions:
 *   1. Tigers win by capturing all 20 goats (or blocking all goats)
 *   2. Goats win by trapping all 4 tigers so none can move
 *   3. Special "Paani Ghara" (ପାଣି ଘର) Win: All 20 goats placed and tigers trapped with 0 captures!
 */

export type PieceType = 'TIGER' | 'GOAT';
export type PlayerSide = 'TIGER' | 'GOAT';
export type BoardPoint = PieceType | null;
export type BaghaBoard = BoardPoint[];
export type InitialGoatsOption = 4 | 6 | 8;

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
  initialGoatsBatch: InitialGoatsOption;
  goatsToPlaceInitially: number;
  goatsPlacedTotal: number;
  goatsOnBoard: number;
  goatsCaptured: number;
  selectedPieceIndex: number | null;
  chainCaptureTigerIndex?: number | null;
  status: GameStatus;
  winInfo: WinInfo | null;
}

export const NUM_POINTS = 25;
export const TOTAL_TIGERS = 4;
export const TOTAL_GOATS = 20;
export const INITIAL_GOATS_BATCH: InitialGoatsOption = 4;
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
 * Normalize initial goats option (4, 6, or 8)
 */
export function normalizeInitialGoatsOption(val?: number): InitialGoatsOption {
  if (val === 6 || val === 8) return val;
  return 4;
}

/**
 * Create a fresh initial Bagha Chheli board state
 */
export function createInitialCoreState(initialGoatsOption: number = INITIAL_GOATS_BATCH): BaghaCoreState {
  const batch = normalizeInitialGoatsOption(initialGoatsOption);
  return {
    board: Array(NUM_POINTS).fill(null),
    currentTurn: 'TIGER',
    phase: 'TIGER_PLACEMENT',
    tigersToPlace: TOTAL_TIGERS,
    initialGoatsBatch: batch,
    goatsToPlaceInitially: batch,
    goatsPlacedTotal: 0,
    goatsOnBoard: 0,
    goatsCaptured: 0,
    selectedPieceIndex: null,
    chainCaptureTigerIndex: null,
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
 * Returns all valid jump-capture moves for a specific Tiger at `tigerIndex`
 */
export function getCaptureMovesForTiger(
  board: BaghaBoard,
  tigerIndex: number
): ValidMoveOption[] {
  if (tigerIndex < 0 || tigerIndex >= NUM_POINTS || board[tigerIndex] !== 'TIGER') {
    return [];
  }
  const captures: ValidMoveOption[] = [];
  for (let dest = 0; dest < NUM_POINTS; dest++) {
    const cap = isTigerCapture(board, tigerIndex, dest);
    if (cap.isCapture && cap.middleIndex !== null) {
      captures.push({
        from: tigerIndex,
        to: dest,
        isCapture: true,
        capturedIndex: cap.middleIndex,
      });
    }
  }
  return captures;
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
  phase: GamePhase,
  chainCaptureTigerIndex: number | null = null
): ValidMoveOption[] {
  if (fromIndex < 0 || fromIndex >= NUM_POINTS) return [];
  const piece = board[fromIndex];
  if (!piece) return [];

  // If a Tiger is mid-chain capture, only that Tiger's additional jump captures are valid
  if (chainCaptureTigerIndex !== null && chainCaptureTigerIndex !== undefined) {
    if (fromIndex !== chainCaptureTigerIndex || piece !== 'TIGER') return [];
    return getCaptureMovesForTiger(board, fromIndex);
  }

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
    moves.push(...getCaptureMovesForTiger(board, fromIndex));
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

  // If a Tiger is in a multi-jump chain capture, only its capture jumps are returned
  if (
    state.currentTurn === 'TIGER' &&
    state.chainCaptureTigerIndex !== null &&
    state.chainCaptureTigerIndex !== undefined
  ) {
    return getCaptureMovesForTiger(state.board, state.chainCaptureTigerIndex);
  }

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

    // Also check if it's GOAT_MOVEMENT and no goat can move at all (Tigers win by blocking all goats)
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
 * Supports multi-jump chain captures for Tigers: if a Tiger captures a Goat and lands on `to` where
 * another capture jump is immediately available with that same Tiger, `currentTurn` stays `'TIGER'`
 * and `chainCaptureTigerIndex` is set to `to`. Passing `from === -1 && to === -1` ends a chain capture early.
 */
export function applyPlayerAction(
  state: BaghaCoreState,
  from: number | null,
  to: number,
  actor: PlayerSide
): ActionApplicationResult | null {
  if (state.status !== 'playing') return null;
  if (state.currentTurn !== actor) return null;

  const initialBatch = normalizeInitialGoatsOption(state.initialGoatsBatch);

  // Allow Tiger player to voluntarily end an active multi-jump chain capture
  if (
    actor === 'TIGER' &&
    from === -1 &&
    to === -1 &&
    state.chainCaptureTigerIndex !== null &&
    state.chainCaptureTigerIndex !== undefined
  ) {
    return {
      nextState: {
        ...state,
        currentTurn: 'GOAT',
        selectedPieceIndex: null,
        chainCaptureTigerIndex: null,
      },
      actionPerformed: null,
    };
  }

  if (to < 0 || to >= NUM_POINTS) return null;

  const nextBoard = [...state.board];
  let nextPhase = state.phase;
  let nextTurn = state.currentTurn;
  let nextTigersToPlace = state.tigersToPlace;
  let nextGoatsToPlaceInitially = state.goatsToPlaceInitially;
  let nextGoatsPlacedTotal = state.goatsPlacedTotal;
  let nextGoatsOnBoard = state.goatsOnBoard;
  let nextGoatsCaptured = state.goatsCaptured;
  let nextChainCaptureTigerIndex: number | null = null;

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
        initialGoatsBatch: initialBatch,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        chainCaptureTigerIndex: null,
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

  // 2. GOAT INITIAL PLACEMENT PHASE (First 4, 6, or 8 Goats placed consecutively)
  if (state.phase === 'GOAT_INITIAL_PLACEMENT') {
    if (actor !== 'GOAT' || from !== null || nextBoard[to] !== null) return null;
    nextBoard[to] = 'GOAT';
    nextGoatsPlacedTotal += 1;
    nextGoatsOnBoard += 1;
    nextGoatsToPlaceInitially -= 1;

    if (nextGoatsToPlaceInitially === 0) {
      nextPhase = nextGoatsPlacedTotal >= TOTAL_GOATS ? 'GOAT_MOVEMENT' : 'MAIN_PLAY';
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
        initialGoatsBatch: initialBatch,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        chainCaptureTigerIndex: null,
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

  // 3. MAIN PLAY — GOAT PLACEMENT (Remaining Goats placed 1 per turn)
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
        initialGoatsBatch: initialBatch,
        goatsToPlaceInitially: nextGoatsToPlaceInitially,
        goatsPlacedTotal: nextGoatsPlacedTotal,
        goatsOnBoard: nextGoatsOnBoard,
        goatsCaptured: nextGoatsCaptured,
        selectedPieceIndex: null,
        chainCaptureTigerIndex: null,
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
    const activeChainTiger = state.chainCaptureTigerIndex ?? null;
    if (activeChainTiger !== null && from !== activeChainTiger) {
      return null;
    }

    const cap = isTigerCapture(nextBoard, from, to);
    if (cap.isCapture && cap.middleIndex !== null) {
      nextBoard[to] = 'TIGER';
      nextBoard[from] = null;
      nextBoard[cap.middleIndex] = null;
      nextGoatsCaptured += 1;
      nextGoatsOnBoard -= 1;
      actionType = 'capture';
      capturedIndex = cap.middleIndex;

      // Check if this same Tiger at `to` has another jump capture available (multi-capture chain)
      const followUpCaptures = getCaptureMovesForTiger(nextBoard, to);
      if (followUpCaptures.length > 0 && nextGoatsCaptured < GOATS_TO_CAPTURE_FOR_WIN) {
        nextTurn = 'TIGER';
        nextChainCaptureTigerIndex = to;
      } else {
        nextTurn = 'GOAT';
        nextChainCaptureTigerIndex = null;
      }
    } else if (activeChainTiger === null && isAdjacent(from, to)) {
      nextBoard[to] = 'TIGER';
      nextBoard[from] = null;
      actionType = 'move';
      nextTurn = 'GOAT';
      nextChainCaptureTigerIndex = null;
    } else {
      return null;
    }
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
      ? `#${from + 1}×#${(capturedIndex ?? 0) + 1}→#${to + 1}`
      : `#${from + 1}→#${to + 1}`;

  const evalRes = evaluateWinState(
    nextBoard,
    nextPhase,
    nextGoatsCaptured,
    nextGoatsPlacedTotal,
    moveLabel
  );

  if (evalRes.status !== 'playing') {
    nextChainCaptureTigerIndex = null;
  }

  return {
    nextState: {
      board: nextBoard,
      currentTurn: nextTurn,
      phase: nextPhase,
      tigersToPlace: nextTigersToPlace,
      initialGoatsBatch: initialBatch,
      goatsToPlaceInitially: nextGoatsToPlaceInitially,
      goatsPlacedTotal: nextGoatsPlacedTotal,
      goatsOnBoard: nextGoatsOnBoard,
      goatsCaptured: nextGoatsCaptured,
      selectedPieceIndex: nextChainCaptureTigerIndex,
      chainCaptureTigerIndex: nextChainCaptureTigerIndex,
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
 * Static board evaluation from TIGER's perspective (positive = favorable for Tiger, negative = favorable for Goat)
 */
function evaluatePositionForTiger(state: BaghaCoreState): number {
  if (state.status === 'won') {
    return state.winInfo?.winner === 'TIGER' ? 100000 : -100000;
  }

  const b = state.board;
  let tigerMobility = 0;
  let tigerHubBonus = 0;
  let trappedCount = 0;
  let captureOpportunities = 0;

  for (let i = 0; i < NUM_POINTS; i++) {
    if (b[i] === 'TIGER') {
      const deg = ADJACENCY_MAP[i].length;
      if (deg === 8) tigerHubBonus += 8;
      let movesForThisTiger = 0;
      for (const n of ADJACENCY_MAP[i]) {
        if (b[n] === null) movesForThisTiger++;
      }
      const caps = getCaptureMovesForTiger(b, i).length;
      captureOpportunities += caps;
      movesForThisTiger += caps * 2;
      tigerMobility += movesForThisTiger;
      if (movesForThisTiger === 0) {
        trappedCount++;
      }
    }
  }

  const threatenedGoats = getThreatenedGoatIndices(b).length;

  // Protected goats (on edges/corners or backed by another goat)
  let solidGoatStructure = 0;
  for (let i = 0; i < NUM_POINTS; i++) {
    if (b[i] === 'GOAT') {
      const isCorner = i === 0 || i === 4 || i === 20 || i === 24;
      const isEdge = i % 5 === 0 || i % 5 === 4 || Math.floor(i / 5) === 0 || Math.floor(i / 5) === 4;
      if (isCorner) solidGoatStructure += 5;
      else if (isEdge) solidGoatStructure += 3;
      for (const n of ADJACENCY_MAP[i]) {
        if (b[n] === 'GOAT') solidGoatStructure += 1;
      }
    }
  }

  return (
    state.goatsCaptured * 420 +
    captureOpportunities * 190 +
    threatenedGoats * 135 +
    tigerMobility * 12 +
    tigerHubBonus -
    trappedCount * 240 -
    solidGoatStructure * 4
  );
}

/**
 * Minimax with Alpha-Beta Pruning for Pro Tactical Lookahead
 */
function minimaxAlphaBeta(
  state: BaghaCoreState,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth <= 0 || state.status !== 'playing') {
    return evaluatePositionForTiger(state);
  }

  const actions = getAllLegalActions(state);
  if (actions.length === 0) {
    return evaluatePositionForTiger(state);
  }

  // Order moves for faster alpha-beta pruning (captures first)
  actions.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));
  const candidateActions = actions.slice(0, 12);

  if (state.currentTurn === 'TIGER') {
    let maxEval = -Infinity;
    for (const act of candidateActions) {
      const sim = applyPlayerAction(state, act.from, act.to, 'TIGER');
      if (!sim) continue;
      // If chain capture continues, keep searching at same depth
      const nextDepth =
        sim.nextState.chainCaptureTigerIndex !== null &&
        sim.nextState.chainCaptureTigerIndex !== undefined
          ? depth
          : depth - 1;
      const ev = minimaxAlphaBeta(sim.nextState, nextDepth, alpha, beta);
      if (ev > maxEval) maxEval = ev;
      if (ev > alpha) alpha = ev;
      if (beta <= alpha) break;
    }
    return maxEval === -Infinity ? evaluatePositionForTiger(state) : maxEval;
  } else {
    let minEval = Infinity;
    for (const act of candidateActions) {
      const sim = applyPlayerAction(state, act.from, act.to, 'GOAT');
      if (!sim) continue;
      const ev = minimaxAlphaBeta(sim.nextState, depth - 1, alpha, beta);
      if (ev < minEval) minEval = ev;
      if (ev < beta) beta = ev;
      if (beta <= alpha) break;
    }
    return minEval === Infinity ? evaluatePositionForTiger(state) : minEval;
  }
}

/**
 * Compute anti-repetition penalty for a candidate move using the round's move history
 */
function getMoveRepetitionPenalty(
  actor: PlayerSide,
  move: ValidMoveOption,
  recentMoves: ReadonlyArray<MoveRecord>
): { penalty: number; isDirectReverse: boolean; movesSinceLastCaptureOrPlace: number } {
  let movesSinceLastCaptureOrPlace = 0;
  for (let i = recentMoves.length - 1; i >= 0; i--) {
    if (recentMoves[i].actionType === 'move') {
      movesSinceLastCaptureOrPlace++;
    } else {
      break;
    }
  }

  if (move.from === null || move.isCapture) {
    return { penalty: 0, isDirectReverse: false, movesSinceLastCaptureOrPlace };
  }

  const myRecentMoves = recentMoves
    .slice(-14)
    .filter((m) => m.player === actor && m.actionType === 'move' && m.from !== null);

  if (myRecentMoves.length === 0) {
    return { penalty: 0, isDirectReverse: false, movesSinceLastCaptureOrPlace };
  }

  const lastMyMove = myRecentMoves[myRecentMoves.length - 1];
  const isDirectReverse = lastMyMove.from === move.to && lastMyMove.to === move.from;

  let pairCount = 0;
  let destVisits = 0;
  for (const m of myRecentMoves) {
    if (
      (m.from === move.from && m.to === move.to) ||
      (m.from === move.to && m.to === move.from)
    ) {
      pairCount++;
    }
    if (m.to === move.to) {
      destVisits++;
    }
  }

  const penalty = (isDirectReverse ? 520 : 0) + pairCount * 220 + destVisits * 65;
  return { penalty, isDirectReverse, movesSinceLastCaptureOrPlace };
}

/**
 * Pro-Level Computer (AI) Bot for Bagha Chheli (plays as either TIGER or GOAT).
 * - Uses randomized strategic opening book placements for both Tigers and Goats so every game is unique.
 * - Uses 3-ply Alpha-Beta pruning + tactical forks/blocking evaluation.
 * - Tracks move history (`recentMoves`) to prevent endless back-and-forth repetition.
 * - If playing as GOAT and a repetitive stalemate loop is detected in movement phase, intentionally
 *   sacrifices 1 Goat to a Tiger capture to break the endless loop and open up tactical play.
 */
export function getBestBotAction(
  state: BaghaCoreState,
  recentMoves: ReadonlyArray<MoveRecord> = []
): ValidMoveOption | null {
  if (state.status !== 'playing') return null;
  const actions = getAllLegalActions(state);
  if (actions.length === 0) return null;

  // 1. TIGER_PLACEMENT: Randomized Pro Opening Formations (never places Tigers in the exact same order/spots every time)
  if (state.phase === 'TIGER_PLACEMENT') {
    const primaryStrategicPool = [6, 8, 12, 16, 18, 0, 4, 20, 24, 2, 10, 14, 22];
    const availableStrategic = actions.filter((a) => primaryStrategicPool.includes(a.to));
    if (availableStrategic.length > 0) {
      // Weight 8-way power hubs slightly higher while keeping genuine randomness across all 13 8-way junctions
      const weighted = availableStrategic.map((act) => {
        const isInnerHub = act.to === 6 || act.to === 8 || act.to === 12 || act.to === 16 || act.to === 18;
        const isCorner = act.to === 0 || act.to === 4 || act.to === 20 || act.to === 24;
        const score = (isInnerHub ? 22 : isCorner ? 18 : 14) + Math.random() * 20;
        return { act, score };
      });
      weighted.sort((a, b) => b.score - a.score);
      return weighted[0].act;
    }
    return actions[Math.floor(Math.random() * actions.length)];
  }

  // 2. GOAT_INITIAL_PLACEMENT: Randomized Safe Strategic Placements (edges, corners & tiger-blocking squares)
  if (state.phase === 'GOAT_INITIAL_PLACEMENT') {
    const scoredPlacements: Array<{ act: ValidMoveOption; score: number }> = [];
    for (const act of actions) {
      const sim = applyPlayerAction(state, null, act.to, 'GOAT');
      if (!sim) continue;
      const b = sim.nextState.board;
      const threatened = getThreatenedGoatIndices(b).length;
      const trapped = getTrappedTigerIndices(b).length;
      const isCorner = act.to === 0 || act.to === 4 || act.to === 20 || act.to === 24;
      const isEdge =
        act.to % 5 === 0 || act.to % 5 === 4 || Math.floor(act.to / 5) === 0 || Math.floor(act.to / 5) === 4;

      // Strong penalty if placing here exposes a goat to immediate capture once Phase 2 starts
      const safetyScore = threatened === 0 ? 200 : -threatened * 250;
      const edgeScore = (isCorner ? 30 : 0) + (isEdge ? 22 : 0) + trapped * 45;
      // Add randomized jitter (0..28) so Goat openings vary naturally across matches
      const randomJitter = Math.random() * 28;
      scoredPlacements.push({
        act,
        score: safetyScore + edgeScore + randomJitter,
      });
    }
    scoredPlacements.sort((a, b) => b.score - a.score);
    return scoredPlacements[0]?.act || actions[0];
  }

  // 3. Bot playing as TIGER in MAIN_PLAY or GOAT_MOVEMENT (including multi-jump chain captures)
  if (state.currentTurn === 'TIGER') {
    const captures = actions.filter((a) => a.isCapture);
    if (captures.length > 0) {
      let bestCap = captures[0];
      let bestCapScore = -Infinity;
      for (const cap of captures) {
        const sim = applyPlayerAction(state, cap.from, cap.to, 'TIGER');
        if (!sim) continue;
        if (sim.nextState.status === 'won') return cap;
        // Prefer captures that trigger another immediate chain capture!
        const chainBonus =
          sim.nextState.chainCaptureTigerIndex !== null &&
          sim.nextState.chainCaptureTigerIndex !== undefined
            ? 900
            : 0;
        const lookahead = minimaxAlphaBeta(sim.nextState, 2, -Infinity, Infinity);
        const totalScore = chainBonus + lookahead + Math.random() * 6;
        if (totalScore > bestCapScore) {
          bestCapScore = totalScore;
          bestCap = cap;
        }
      }
      return bestCap;
    }

    // Evaluate non-capture Tiger moves with 2-ply lookahead + anti-repetition penalty
    let bestTigerMove = actions[0];
    let bestTigerScore = -Infinity;

    for (const move of actions) {
      const sim = applyPlayerAction(state, move.from, move.to, 'TIGER');
      if (!sim) continue;
      if (sim.nextState.status === 'won') return move;

      const rep = getMoveRepetitionPenalty('TIGER', move, recentMoves);
      const lookahead = minimaxAlphaBeta(sim.nextState, 2, -Infinity, Infinity);
      const score = lookahead - rep.penalty + Math.random() * 8;

      if (score > bestTigerScore) {
        bestTigerScore = score;
        bestTigerMove = move;
      }
    }
    return bestTigerMove;
  }

  // 4. Bot playing as GOAT in MAIN_PLAY (placement) or GOAT_MOVEMENT (movement)
  const currentThreatened = getThreatenedGoatIndices(state.board).length;
  const sampleRep = getMoveRepetitionPenalty('GOAT', actions[0], recentMoves);

  // Deadlock / Endless-Game Breaker for GOAT AI:
  // If in GOAT_MOVEMENT and 10+ consecutive moves have occurred without any capture or progress,
  // or if the game is oscillating repetitively, Goat AI intentionally offers 1 Goat for capture
  // so the game progresses instead of looping forever!
  if (
    state.phase === 'GOAT_MOVEMENT' &&
    sampleRep.movesSinceLastCaptureOrPlace >= 10 &&
    currentThreatened === 0
  ) {
    const sacrificeCandidates: Array<{ act: ValidMoveOption; score: number }> = [];
    for (const act of actions) {
      const sim = applyPlayerAction(state, act.from, act.to, 'GOAT');
      if (!sim) continue;
      const b = sim.nextState.board;
      const newThreatened = getThreatenedGoatIndices(b).length;
      if (newThreatened === 1) {
        const trapped = getTrappedTigerIndices(b).length;
        sacrificeCandidates.push({
          act,
          score: trapped * 80 - evaluatePositionForTiger(sim.nextState) + Math.random() * 15,
        });
      }
    }
    if (sacrificeCandidates.length > 0) {
      sacrificeCandidates.sort((a, b) => b.score - a.score);
      return sacrificeCandidates[0].act;
    }
  }

  let bestGoatAction = actions[0];
  let bestGoatScore = -Infinity;

  for (const act of actions) {
    const sim = applyPlayerAction(state, act.from, act.to, 'GOAT');
    if (!sim) continue;
    if (sim.nextState.status === 'won' && sim.nextState.winInfo?.winner === 'GOAT') {
      return act; // Immediate win!
    }

    const b = sim.nextState.board;
    const newThreatened = getThreatenedGoatIndices(b).length;
    const trappedTigers = getTrappedTigerIndices(b).length;
    const rep = getMoveRepetitionPenalty('GOAT', act, recentMoves);

    // Rescue bonus if a Goat was threatened and this action saves it
    const rescueBonus =
      currentThreatened > newThreatened ? (currentThreatened - newThreatened) * 480 : 0;
    const dangerPenalty = newThreatened * 520;

    const isCorner = act.to === 0 || act.to === 4 || act.to === 20 || act.to === 24;
    const isEdge =
      act.to % 5 === 0 || act.to % 5 === 4 || Math.floor(act.to / 5) === 0 || Math.floor(act.to / 5) === 4;
    const structureBonus = (isCorner ? 20 : 0) + (isEdge ? 12 : 0) + trappedTigers * 140;

    // 2-ply lookahead (negated since minimax evaluates from Tiger's perspective)
    const lookaheadForGoat = -minimaxAlphaBeta(sim.nextState, 1, -Infinity, Infinity);

    const totalScore =
      lookaheadForGoat +
      rescueBonus -
      dangerPenalty +
      structureBonus -
      rep.penalty +
      Math.random() * 12;

    if (totalScore > bestGoatScore) {
      bestGoatScore = totalScore;
      bestGoatAction = act;
    }
  }

  return bestGoatAction;
}
