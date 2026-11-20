import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialCoreState,
  applyPlayerAction,
  isTigerCapture,
  canTigerMove,
  evaluateWinState,
  getBestBotAction,
  ADJACENCY_MAP,
  NUM_POINTS,
  GOATS_TO_CAPTURE_FOR_WIN,
  generateRandomPlayerId,
  swapPlayerSide,
  swapTwoPlayerSides,
} from './rules';

test('generateRandomPlayerId matches sb-1a0a to sb-9z9z format', () => {
  for (let i = 0; i < 50; i++) {
    const id = generateRandomPlayerId();
    assert.match(id, /^sb-[1-9][a-z][0-9][a-z]$/);
  }
});

test('Board topology has 25 points and symmetric adjacency', () => {
  assert.equal(ADJACENCY_MAP.length, NUM_POINTS);
  for (let i = 0; i < NUM_POINTS; i++) {
    for (const neighbor of ADJACENCY_MAP[i]) {
      assert.equal(
        ADJACENCY_MAP[neighbor].includes(i),
        true,
        `Symmetry failed between ${i} and ${neighbor}`
      );
    }
  }
});

test('Phase 1A & 1B: 4 Tigers placed first, then 4 Goats placed, then transitions to MAIN_PLAY', () => {
  let state = createInitialCoreState();
  assert.equal(state.phase, 'TIGER_PLACEMENT');
  assert.equal(state.currentTurn, 'TIGER');

  // Place 4 tigers at 0, 4, 20, 24
  const tigerSpots = [0, 4, 20, 24];
  for (let i = 0; i < 4; i++) {
    const res = applyPlayerAction(state, null, tigerSpots[i], 'TIGER');
    assert.ok(res, `Tiger placement ${i + 1} should succeed`);
    state = res.nextState;
    if (i < 3) {
      assert.equal(state.phase, 'TIGER_PLACEMENT');
      assert.equal(state.currentTurn, 'TIGER');
    }
  }

  assert.equal(state.phase, 'GOAT_INITIAL_PLACEMENT');
  assert.equal(state.currentTurn, 'GOAT');
  assert.equal(state.tigersToPlace, 0);

  // Place 4 initial goats at 1, 2, 3, 5
  const goatSpots = [1, 2, 3, 5];
  for (let i = 0; i < 4; i++) {
    const res = applyPlayerAction(state, null, goatSpots[i], 'GOAT');
    assert.ok(res, `Initial goat placement ${i + 1} should succeed`);
    state = res.nextState;
  }

  assert.equal(state.phase, 'MAIN_PLAY');
  assert.equal(state.currentTurn, 'TIGER');
  assert.equal(state.goatsPlacedTotal, 4);
  assert.equal(state.goatsOnBoard, 4);
});

test('Tiger jump capture removes goat and increments goatsCaptured', () => {
  let state = createInitialCoreState();
  state.phase = 'MAIN_PLAY';
  state.currentTurn = 'TIGER';
  state.tigersToPlace = 0;
  state.goatsToPlaceInitially = 0;
  state.board[0] = 'TIGER';
  state.board[1] = 'GOAT';
  state.board[2] = null;
  state.goatsOnBoard = 1;
  state.goatsPlacedTotal = 4;

  const capCheck = isTigerCapture(state.board, 0, 2);
  assert.equal(capCheck.isCapture, true);
  assert.equal(capCheck.middleIndex, 1);

  const res = applyPlayerAction(state, 0, 2, 'TIGER');
  assert.ok(res);
  assert.equal(res.actionPerformed?.actionType, 'capture');
  assert.equal(res.nextState.board[0], null);
  assert.equal(res.nextState.board[1], null);
  assert.equal(res.nextState.board[2], 'TIGER');
  assert.equal(res.nextState.goatsCaptured, 1);
  assert.equal(res.nextState.goatsOnBoard, 0);
  assert.equal(res.nextState.currentTurn, 'GOAT');
});

test('Game continues after 5 captures and Tigers win when all 20 goats are captured', () => {
  let state = createInitialCoreState();
  state.phase = 'MAIN_PLAY';
  state.currentTurn = 'TIGER';
  state.tigersToPlace = 0;
  state.goatsToPlaceInitially = 0;
  state.goatsCaptured = 4;
  state.goatsOnBoard = 5;
  state.goatsPlacedTotal = 9;
  state.board[6] = 'TIGER';
  state.board[12] = 'GOAT';
  state.board[18] = null;

  // 5th capture should NOT end the game
  const res5 = applyPlayerAction(state, 6, 18, 'TIGER');
  assert.ok(res5);
  assert.equal(res5.nextState.goatsCaptured, 5);
  assert.equal(res5.nextState.status, 'playing');

  // 20th capture ends the game with TIGER win
  state.goatsCaptured = GOATS_TO_CAPTURE_FOR_WIN - 1;
  state.goatsOnBoard = 1;
  state.goatsPlacedTotal = 20;
  state.phase = 'GOAT_MOVEMENT';
  const res20 = applyPlayerAction(state, 6, 18, 'TIGER');
  assert.ok(res20);
  assert.equal(res20.nextState.goatsCaptured, 20);
  assert.equal(res20.nextState.status, 'won');
  assert.equal(res20.nextState.winInfo?.winner, 'TIGER');
  assert.equal(res20.nextState.winInfo?.reason, 'captures');
});

test('Paani Ghara rule triggers when all 20 goats are placed and tigers trapped with 0 captures', () => {
  const board = Array(NUM_POINTS).fill('GOAT');
  // Put 4 tigers at corners 0, 4, 20, 24 surrounded by goats so they cannot move or jump
  board[0] = 'TIGER';
  board[4] = 'TIGER';
  board[20] = 'TIGER';
  board[24] = 'TIGER';

  assert.equal(canTigerMove(board, 0), false);
  assert.equal(canTigerMove(board, 4), false);

  const evalPaani = evaluateWinState(board, 'GOAT_MOVEMENT', 0, 20, 'Goat #25');
  assert.equal(evalPaani.status, 'won');
  assert.equal(evalPaani.winInfo?.winner, 'GOAT');
  assert.equal(evalPaani.winInfo?.reason, 'paani_ghara');

  const evalNormalTrapped = evaluateWinState(board, 'MAIN_PLAY', 1, 15, 'Goat #15');
  assert.equal(evalNormalTrapped.status, 'won');
  assert.equal(evalNormalTrapped.winInfo?.winner, 'GOAT');
  assert.equal(evalNormalTrapped.winInfo?.reason, 'trapped');
});

test('Smart AI Bot produces valid actions across phases', () => {
  let state = createInitialCoreState();
  for (let step = 0; step < 12; step++) {
    const botAct = getBestBotAction(state);
    assert.ok(botAct, `Bot should return a valid action at step ${step}`);
    const applied = applyPlayerAction(state, botAct.from, botAct.to, state.currentTurn);
    assert.ok(applied, `Bot action should be legal at step ${step}`);
    state = applied.nextState;
  }
  assert.equal(state.phase, 'MAIN_PLAY');
});

test('Configurable initial Goats (6 or 8) keeps 4 Tigers compulsory and places 6 or 8 Goats in Phase 1B', () => {
  for (const initialBatch of [6, 8] as const) {
    let state = createInitialCoreState(initialBatch);
    assert.equal(state.tigersToPlace, 4);
    assert.equal(state.goatsToPlaceInitially, initialBatch);
    assert.equal(state.initialGoatsBatch, initialBatch);

    // Place 4 compulsory Tigers
    for (let i = 0; i < 4; i++) {
      const res = applyPlayerAction(state, null, i, 'TIGER');
      assert.ok(res);
      state = res.nextState;
    }
    assert.equal(state.phase, 'GOAT_INITIAL_PLACEMENT');

    // Place `initialBatch` Goats in Phase 1B
    for (let g = 0; g < initialBatch; g++) {
      assert.equal(state.phase, 'GOAT_INITIAL_PLACEMENT');
      const res = applyPlayerAction(state, null, 4 + g, 'GOAT');
      assert.ok(res);
      state = res.nextState;
    }
    assert.equal(state.phase, 'MAIN_PLAY');
    assert.equal(state.goatsPlacedTotal, initialBatch);
    assert.equal(state.goatsOnBoard, initialBatch);
  }
});

test('Multi-jump chain capture allows a Tiger to capture multiple Goats in a single turn', () => {
  let state = createInitialCoreState();
  state.phase = 'MAIN_PLAY';
  state.currentTurn = 'TIGER';
  state.tigersToPlace = 0;
  state.goatsToPlaceInitially = 0;
  state.board[0] = 'TIGER';
  state.board[1] = 'GOAT';
  state.board[2] = null;
  state.board[3] = 'GOAT';
  state.board[4] = null;
  state.goatsOnBoard = 2;
  state.goatsPlacedTotal = 6;

  // First capture jump: 0 -> 2 (capturing 1)
  const jump1 = applyPlayerAction(state, 0, 2, 'TIGER');
  assert.ok(jump1);
  state = jump1.nextState;
  assert.equal(state.goatsCaptured, 1);
  // Since 2 -> 4 (over 3) is immediately available, it stays TIGER's turn with chainCaptureTigerIndex = 2
  assert.equal(state.currentTurn, 'TIGER');
  assert.equal(state.chainCaptureTigerIndex, 2);

  // Second capture jump in same turn: 2 -> 4 (capturing 3)
  const jump2 = applyPlayerAction(state, 2, 4, 'TIGER');
  assert.ok(jump2);
  state = jump2.nextState;
  assert.equal(state.goatsCaptured, 2);
  assert.equal(state.chainCaptureTigerIndex, null);
  assert.equal(state.currentTurn, 'GOAT');
});

test('swapPlayerSide and swapTwoPlayerSides alternate chaal between Tiger and Goat after a win/loss', () => {
  assert.equal(swapPlayerSide('TIGER'), 'GOAT');
  assert.equal(swapPlayerSide('GOAT'), 'TIGER');

  const round2 = swapTwoPlayerSides('TIGER');
  assert.deepEqual(round2, { hostSide: 'GOAT', guestSide: 'TIGER' });

  const round3 = swapTwoPlayerSides(round2.hostSide);
  assert.deepEqual(round3, { hostSide: 'TIGER', guestSide: 'GOAT' });
});


