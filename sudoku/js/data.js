/*
 * data.js
 * -----------------------------------------------------------------------
 * Static data only: the demo puzzle, the solved reference grid, and the
 * annotated source code shown in the "Executing Code" panel.
 * No rendering or algorithm logic lives here (see solver.js / visualizer.js).
 * -----------------------------------------------------------------------
 */

// A puzzle hand-picked (see findpuzzle.js in project notes) so that a plain
// row-major backtracking search produces a compact, teachable trace: it
// hits a few genuine dead ends (backtracks) without running for thousands
// of steps, so the whole solve can be replayed live in a lecture.
const DEMO_PUZZLE = [
  [0, 3, 4, 6, 7, 8, 9, 0, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 0],
  [1, 0, 0, 3, 4, 2, 5, 6, 7],
  [8, 0, 9, 7, 6, 1, 4, 0, 3],
  [4, 0, 0, 8, 5, 3, 0, 9, 1],
  [0, 1, 3, 0, 0, 4, 8, 0, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [0, 0, 0, 4, 1, 9, 0, 3, 5],
  [0, 0, 5, 2, 8, 6, 1, 7, 9]
];

// The source lines exactly as "executed" by solver.js. Each line has a
// stable id so a trace frame can say "highlight line L4" without caring
// about pixel offsets. Indentation is spaces, preserved verbatim.
const SOLVER_SOURCE = [
  { id: "L1", text: "function solve(board, depth) {" },
  { id: "L2", text: "  const cell = findEmptyCell(board);" },
  { id: "L3", text: "  if (cell === null) return true; // solved!" },
  { id: "L4", text: "  const [row, col] = cell;" },
  { id: "L5", text: "  for (let num = 1; num <= 9; num++) {" },
  { id: "L6", text: "    if (isValid(board, row, col, num)) {" },
  { id: "L7", text: "      board[row][col] = num;   // place" },
  { id: "L8", text: "      if (solve(board, depth + 1)) return true;" },
  { id: "L9", text: "      board[row][col] = 0;     // undo (backtrack)" },
  { id: "L10", text: "    }" },
  { id: "L11", text: "  }" },
  { id: "L12", text: "  return false;  // dead end, let caller backtrack" },
  { id: "L13", text: "}" }
];
