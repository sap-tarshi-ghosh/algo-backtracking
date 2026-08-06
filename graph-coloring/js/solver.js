/*
 * solver.js
 * -----------------------------------------------------------------------
 * Pure algorithm logic, no DOM access. Same shape as the Sudoku project:
 * a generator yields one fully-snapshotted frame per executed line, and
 * buildTrace() drains it once into a flat array so the UI can scrub/
 * replay by simply indexing into that array.
 * -----------------------------------------------------------------------
 */

function buildAdjacency(n, edges) {
  const adj = Array.from({ length: n }, () => new Set());
  edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
  return adj;
}

function isValidColor(colors, adj, vertex, c) {
  for (const nb of adj[vertex]) {
    if (colors[nb] === c) return false;
  }
  return true;
}

function cloneArr(a) { return a.slice(); }
function cloneStack(stack) { return stack.map(f => ({ ...f })); }

function makeFrame(opts) {
  return {
    type: opts.type,          // enter | try | invalid | place | backtrack | fail | success
    line: opts.line,
    vertex: opts.vertex ?? null,
    color: opts.color ?? null,
    depth: opts.depth,
    callId: opts.callId,
    parentCallId: opts.parentCallId ?? null,
    colors: cloneArr(opts.colors),
    stack: cloneStack(opts.stack),
    note: opts.note
  };
}

/**
 * Recursive generator: solve(vertex, depth). `colors` is the shared,
 * mutated-in-place color assignment array; `stack` mirrors the real call
 * stack, one entry per still-active invocation.
 */
function* solveGen(n, adj, k, colors, vertex, depth, stack, callCounter) {
  const callId = ++callCounter.value;
  const parentCallId = stack.length ? stack[stack.length - 1].callId : null;
  stack.push({ vertex, depth, callId });

  yield makeFrame({
    type: "enter", line: "L2", vertex, depth, colors, stack, callId, parentCallId,
    note: vertex === n ? "All vertices colored" : `Focused on vertex ${vertex}`
  });

  if (vertex === n) {
    yield makeFrame({
      type: "success", line: "L2", vertex, depth, colors, stack, callId, parentCallId,
      note: "Every vertex has a valid color \u2014 done"
    });
    return true;
  }

  for (let c = 1; c <= k; c++) {
    yield makeFrame({
      type: "try", line: "L4", vertex, color: c, depth, colors, stack, callId, parentCallId,
      note: `Testing color ${c} on vertex ${vertex}`
    });

    if (isValidColor(colors, adj, vertex, c)) {
      colors[vertex] = c;
      yield makeFrame({
        type: "place", line: "L5", vertex, color: c, depth, colors, stack, callId, parentCallId,
        note: `Color ${c} is valid \u2014 assigned to vertex ${vertex}`
      });

      const solved = yield* solveGen(n, adj, k, colors, vertex + 1, depth + 1, stack, callCounter);
      if (solved) return true;

      colors[vertex] = 0;
      yield makeFrame({
        type: "backtrack", line: "L7", vertex, color: c, depth, colors, stack, callId, parentCallId,
        note: `Dead end below \u2014 undo color ${c} on vertex ${vertex}`
      });
    } else {
      yield makeFrame({
        type: "invalid", line: "L4", vertex, color: c, depth, colors, stack, callId, parentCallId,
        note: `Color ${c} conflicts with a neighbor of vertex ${vertex}`
      });
    }
  }

  stack.pop();
  yield makeFrame({
    type: "fail", line: "L10", vertex, depth, colors, stack, callId, parentCallId,
    note: `No color works for vertex ${vertex} \u2014 backtrack to caller`
  });
  return false;
}

function buildTrace() {
  const adj = buildAdjacency(GRAPH_N, GRAPH_EDGES);
  const colors = new Array(GRAPH_N).fill(0);
  const stack = [];
  const frames = [];
  const callCounter = { value: 0 };
  const gen = solveGen(GRAPH_N, adj, GRAPH_K, colors, 0, 0, stack, callCounter);
  let result = gen.next();
  while (!result.done) {
    frames.push(result.value);
    result = gen.next();
  }
  return frames;
}
