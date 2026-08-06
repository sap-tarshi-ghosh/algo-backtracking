/*
 * solver.js
 * -----------------------------------------------------------------------
 * Pure algorithm logic. No DOM access here at all.
 *
 * The solver is written as a JS generator so that every "step" the real
 * recursive algorithm takes can be paused on. Recursive calls are entered
 * with `yield*`, which is what lets the generator mirror genuine call-stack
 * depth (not a simulated one) - depth in the visualization is the real
 * depth of the generator delegation chain.
 *
 * buildTrace() drains the generator once, up front, into a flat array of
 * immutable frames (board + stack are deep-cloned per frame). Precomputing
 * the whole trace is what makes Prev/Next/Restart/scrubbing O(1): the UI
 * never re-runs the algorithm, it just indexes into `frames`.
 * -----------------------------------------------------------------------
 */

function cloneBoard(board) {
  return board.map(row => row.slice());
}

function cloneStack(stack) {
  return stack.map(frame => ({ ...frame }));
}

function findEmptyCell(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

// Build one frame snapshot. Kept as a small helper so every yield site
// stays a one-liner and the frame shape can't drift between call sites.
function makeFrame(opts) {
  return {
    type: opts.type,        // enter | try | invalid | place | backtrack | fail | success
    line: opts.line,        // id into SOLVER_SOURCE
    row: opts.row ?? null,
    col: opts.col ?? null,
    num: opts.num ?? null,
    depth: opts.depth,
    callId: opts.callId,        // which recursive invocation this frame belongs to
    parentCallId: opts.parentCallId ?? null, // its caller's invocation, for tree edges
    board: cloneBoard(opts.board),
    stack: cloneStack(opts.stack),
    note: opts.note
  };
}

/**
 * Recursive generator mirroring the annotated pseudocode in data.js line
 * for line. `stack` is a single array shared across the whole recursion
 * (mutated in place) so it behaves exactly like a real call stack.
 * `callCounter` is a shared { value } used to hand every invocation of
 * solve() a unique id, which is what lets the visualizer build a genuine
 * recursion tree (parent/child edges) instead of guessing from depth alone.
 */
function* solveGen(board, depth, stack, callCounter) {
  const callId = ++callCounter.value;
  const parentCallId = stack.length ? stack[stack.length - 1].callId : null;

  yield makeFrame({
    type: "scan", line: "L2", depth, board, stack, callId, parentCallId,
    note: "Scanning the board for the next empty cell"
  });

  const cell = findEmptyCell(board);

  if (!cell) {
    yield makeFrame({
      type: "success", line: "L3", depth, board, stack, callId, parentCallId,
      note: "No empty cells left \u2014 the board is solved"
    });
    return true;
  }

  const [row, col] = cell;
  stack.push({ row, col, depth, callId });

  yield makeFrame({
    type: "enter", line: "L4", row, col, depth, board, stack, callId, parentCallId,
    note: `Focused on cell (${row}, ${col})`
  });

  for (let num = 1; num <= 9; num++) {
    yield makeFrame({
      type: "try", line: "L6", row, col, num, depth, board, stack, callId, parentCallId,
      note: `Testing ${num} at (${row}, ${col})`
    });

    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      yield makeFrame({
        type: "place", line: "L7", row, col, num, depth, board, stack, callId, parentCallId,
        note: `${num} is valid \u2014 placed at (${row}, ${col})`
      });

      const solved = yield* solveGen(board, depth + 1, stack, callCounter);
      if (solved) return true;

      board[row][col] = 0;
      yield makeFrame({
        type: "backtrack", line: "L9", row, col, num, depth, board, stack, callId, parentCallId,
        note: `Dead end below \u2014 undo ${num} at (${row}, ${col})`
      });
    } else {
      yield makeFrame({
        type: "invalid", line: "L6", row, col, num, depth, board, stack, callId, parentCallId,
        note: `${num} conflicts with row/column/box`
      });
    }
  }

  stack.pop();
  yield makeFrame({
    type: "fail", line: "L12", row, col, depth, board, stack, callId, parentCallId,
    note: `No number works at (${row}, ${col}) \u2014 backtrack to caller`
  });
  return false;
}

/**
 * Drain the generator into a flat, replayable array of frames.
 * `sourcePuzzle` is never mutated (solveGen works on a clone).
 */
function buildTrace(sourcePuzzle) {
  const board = cloneBoard(sourcePuzzle);
  const stack = [];
  const frames = [];
  const callCounter = { value: 0 };
  const gen = solveGen(board, 0, stack, callCounter);
  let result = gen.next();
  while (!result.done) {
    frames.push(result.value);
    result = gen.next();
  }
  return frames;
}
