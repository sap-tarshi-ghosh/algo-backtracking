/*
 * data.js
 * -----------------------------------------------------------------------
 * Static data only. See ../README.md for how this graph was chosen (a
 * small search over random graphs picked one whose naive vertex-order
 * backtracking produces a compact, teachable trace with several real
 * dead ends).
 * -----------------------------------------------------------------------
 */

const GRAPH_N = 10;
const GRAPH_K = 3; // number of available colors

const GRAPH_EDGES = [
  [2, 0], [0, 9], [5, 3], [4, 3], [6, 1], [3, 7], [8, 9], [1, 5],
  [2, 1], [2, 9], [7, 9], [7, 0], [4, 8], [7, 6], [1, 9], [8, 0],
  [8, 1], [1, 7], [0, 5]
];

// Named colors for display; index 0 means "uncolored".
const COLOR_NAMES = ["none", "amber", "cyan", "violet"];

const SOLVER_SOURCE = [
  { id: "L1", text: "function solve(vertex, depth) {" },
  { id: "L2", text: "  if (vertex === n) return true; // all colored" },
  { id: "L3", text: "  for (let c = 1; c <= k; c++) {" },
  { id: "L4", text: "    if (isValid(vertex, c)) {" },
  { id: "L5", text: "      color[vertex] = c;   // place" },
  { id: "L6", text: "      if (solve(vertex + 1, depth + 1)) return true;" },
  { id: "L7", text: "      color[vertex] = 0;   // undo (backtrack)" },
  { id: "L8", text: "    }" },
  { id: "L9", text: "  }" },
  { id: "L10", text: "  return false;  // dead end, let caller backtrack" },
  { id: "L11", text: "}" }
];
