/*
 * data.js
 * -----------------------------------------------------------------------
 * Static data only. See ../README.md for how this graph was chosen (a
 * small search over random graphs picked one whose naive ascending-
 * neighbor-order backtracking produces a compact, teachable trace with
 * several real dead ends, ending in a found Hamiltonian path).
 * -----------------------------------------------------------------------
 */

const GRAPH_N = 7;
const START_VERTEX = 0;

const GRAPH_EDGES = [
  [6, 2], [0, 4], [1, 6], [1, 3], [0, 2], [4, 6], [4, 1],
  [0, 6], [5, 0], [5, 6], [3, 0], [5, 2], [0, 1]
];

const SOLVER_SOURCE = [
  { id: "L1", text: "function solve(path, depth) {" },
  { id: "L2", text: "  if (path.length === n) return true; // visited all" },
  { id: "L3", text: "  const last = path[path.length - 1];" },
  { id: "L4", text: "  for (const next of neighbors(last)) {" },
  { id: "L5", text: "    if (isValid(next, path)) {" },
  { id: "L6", text: "      path.push(next);       // place" },
  { id: "L7", text: "      if (solve(path, depth + 1)) return true;" },
  { id: "L8", text: "      path.pop();             // undo (backtrack)" },
  { id: "L9", text: "    }" },
  { id: "L10", text: "  }" },
  { id: "L11", text: "  return false;  // dead end, let caller backtrack" },
  { id: "L12", text: "}" }
];
