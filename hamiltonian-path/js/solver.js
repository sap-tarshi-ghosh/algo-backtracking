/*
 * solver.js
 * -----------------------------------------------------------------------
 * Pure algorithm logic, no DOM access. Same shape as the Sudoku and
 * graph-coloring projects: a generator yields one fully-snapshotted frame
 * per executed line, and buildTrace() drains it once into a flat array.
 * -----------------------------------------------------------------------
 */

function buildAdjacency(n, edges) {
  const adj = Array.from({ length: n }, () => new Set());
  edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
  return adj.map(s => [...s].sort((a, b) => a - b));
}

function cloneArr(a) { return a.slice(); }
function cloneStack(stack) { return stack.map(f => ({ ...f })); }

function makeFrame(opts) {
  return {
    type: opts.type,          // enter | try | invalid | place | backtrack | fail | success
    line: opts.line,
    last: opts.last ?? null,
    next: opts.next ?? null,
    depth: opts.depth,
    callId: opts.callId,
    parentCallId: opts.parentCallId ?? null,
    path: cloneArr(opts.path),
    visited: cloneArr(opts.visited),
    stack: cloneStack(opts.stack),
    note: opts.note
  };
}

/**
 * Recursive generator: solve(depth). `path` (the ordered vertex sequence
 * visited so far) and `visited` (boolean membership) are both shared,
 * mutated-in-place arrays, exactly like the real algorithm's shared state.
 */
function* solveGen(n, adjSorted, path, visited, depth, stack, callCounter) {
  const callId = ++callCounter.value;
  const parentCallId = stack.length ? stack[stack.length - 1].callId : null;
  const last = path[path.length - 1];
  stack.push({ vertex: last, depth, callId });

  yield makeFrame({
    type: "enter", line: "L2", last, depth, path, visited, stack, callId, parentCallId,
    note: path.length === n ? "Every vertex has been visited" : `At vertex ${last}, looking for the next step`
  });

  if (path.length === n) {
    yield makeFrame({
      type: "success", line: "L2", last, depth, path, visited, stack, callId, parentCallId,
      note: "Full Hamiltonian path found \u2014 done"
    });
    return true;
  }

  for (const next of adjSorted[last]) {
    yield makeFrame({
      type: "try", line: "L5", last, next, depth, path, visited, stack, callId, parentCallId,
      note: `Considering edge ${last} \u2192 ${next}`
    });

    if (!visited[next]) {
      visited[next] = true;
      path.push(next);
      yield makeFrame({
        type: "place", line: "L6", last, next, depth, path, visited, stack, callId, parentCallId,
        note: `${next} is unvisited \u2014 extend the path to it`
      });

      const solved = yield* solveGen(n, adjSorted, path, visited, depth + 1, stack, callCounter);
      if (solved) return true;

      path.pop();
      visited[next] = false;
      yield makeFrame({
        type: "backtrack", line: "L8", last, next, depth, path, visited, stack, callId, parentCallId,
        note: `Dead end further along \u2014 remove ${next} from the path`
      });
    } else {
      yield makeFrame({
        type: "invalid", line: "L5", last, next, depth, path, visited, stack, callId, parentCallId,
        note: `${next} is already on the path \u2014 skip it`
      });
    }
  }

  stack.pop();
  yield makeFrame({
    type: "fail", line: "L11", last, depth, path, visited, stack, callId, parentCallId,
    note: `No unvisited neighbor works from ${last} \u2014 backtrack to caller`
  });
  return false;
}

function buildTrace() {
  const adjSorted = buildAdjacency(GRAPH_N, GRAPH_EDGES);
  const visited = new Array(GRAPH_N).fill(false);
  visited[START_VERTEX] = true;
  const path = [START_VERTEX];
  const stack = [];
  const frames = [];
  const callCounter = { value: 0 };
  const gen = solveGen(GRAPH_N, adjSorted, path, visited, 0, stack, callCounter);
  let result = gen.next();
  while (!result.done) {
    frames.push(result.value);
    result = gen.next();
  }
  return frames;
}
