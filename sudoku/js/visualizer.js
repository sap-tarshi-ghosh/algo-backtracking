/*
 * visualizer.js
 * -----------------------------------------------------------------------
 * All DOM rendering for the live demo lives here. Every render function
 * is a pure-ish function of (frames, index): given the same index it
 * always produces the same panels, which is what makes Prev/Next/Restart/
 * scrubbing reliable - there is no separate "undo" logic, we simply
 * re-render at a different index.
 *
 * The one exception is animation: a handful of functions add a transient
 * CSS class (via Tween.pulse) to celebrate the specific transition that
 * just happened (place / remove / dead end / success), which needs to
 * know the *previous* index too.
 * -----------------------------------------------------------------------
 */

const Visualizer = (() => {
  let boardCells = []; // 9x9 array of <td> elements, built once
  let codeLines = [];  // array of <div class="code-line"> elements, built once

  // ---- one-time setup -------------------------------------------------

  function buildBoard(container) {
    container.innerHTML = "";
    const table = document.createElement("table");
    table.className = "sudoku-board";
    boardCells = [];
    for (let r = 0; r < 9; r++) {
      const rowEl = document.createElement("tr");
      const rowCells = [];
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement("td");
        cell.className = "cell";
        if (r % 3 === 0) cell.classList.add("box-top");
        if (c % 3 === 0) cell.classList.add("box-left");
        if (r === 8) cell.classList.add("box-bottom");
        if (c === 8) cell.classList.add("box-right");
        const span = document.createElement("span");
        span.className = "cell-value";
        cell.appendChild(span);
        rowEl.appendChild(cell);
        rowCells.push(cell);
      }
      table.appendChild(rowEl);
      boardCells.push(rowCells);
    }
    container.appendChild(table);
  }

  function buildCodePanel(container) {
    container.innerHTML = "";
    codeLines = [];
    SOLVER_SOURCE.forEach(line => {
      const div = document.createElement("div");
      div.className = "code-line";
      div.dataset.lineId = line.id;
      const gutter = document.createElement("span");
      gutter.className = "code-gutter";
      gutter.textContent = line.id.replace("L", "");
      const content = document.createElement("span");
      content.className = "code-content";
      content.innerHTML = Highlight.renderLine(line.text);
      div.appendChild(gutter);
      div.appendChild(content);
      container.appendChild(div);
      codeLines.push(div);
    });
  }

  // ---- per-frame render -------------------------------------------------

  function renderBoard(frame, prevFrame) {
    const givens = DEMO_PUZZLE;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellEl = boardCells[r][c];
        const val = frame.board[r][c];
        const span = cellEl.querySelector(".cell-value");
        span.textContent = val === 0 ? "" : val;
        cellEl.classList.toggle("given", givens[r][c] !== 0);
        cellEl.classList.toggle("filled", val !== 0 && givens[r][c] === 0);
        cellEl.classList.remove("cell-focus", "cell-place", "cell-remove", "cell-deadend", "cell-success");
      }
    }
    const { row, col } = frame;
    if (row !== null && col !== null) {
      const cellEl = boardCells[row][col];
      cellEl.classList.add("cell-focus");
      if (frame.type === "place") cellEl.classList.add("cell-place");
      if (frame.type === "backtrack") cellEl.classList.add("cell-remove");
      if (frame.type === "fail") cellEl.classList.add("cell-deadend");
    }
    if (frame.type === "success") {
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) boardCells[r][c].classList.add("cell-success");
    }
  }

  function renderCode(frame) {
    codeLines.forEach(div => {
      div.classList.toggle("active", div.dataset.lineId === frame.line);
    });
    const activeEl = codeLines.find(d => d.dataset.lineId === frame.line);
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }

  function renderStack(frame, container) {
    container.innerHTML = "";
    if (frame.stack.length === 0) {
      const empty = document.createElement("div");
      empty.className = "stack-empty";
      empty.textContent = "call stack empty";
      container.appendChild(empty);
      return;
    }
    // Render top-of-stack first (most recent call at the top, like a real
    // call stack / debugger "Call Stack" panel).
    [...frame.stack].reverse().forEach((entry, i) => {
      const isTop = i === 0;
      const row = document.createElement("div");
      row.className = "stack-frame" + (isTop ? " stack-top" : "");
      row.innerHTML = `
        <span class="stack-depth">#${entry.depth}</span>
        <span class="stack-label">solve(row=${entry.row}, col=${entry.col})</span>
      `;
      container.appendChild(row);
    });
  }

  function renderVariables(frame, container) {
    const rows = [
      ["row", frame.row === null ? "\u2014" : frame.row],
      ["col", frame.col === null ? "\u2014" : frame.col],
      ["num", frame.num === null ? "\u2014" : frame.num],
      ["depth", frame.depth],
      ["event", frame.type]
    ];
    container.innerHTML = rows.map(([k, v]) => `
      <div class="var-row">
        <span class="var-key">${k}</span>
        <span class="var-value var-${k}">${v}</span>
      </div>
    `).join("");
  }

  function renderDepthLadder(frame, container) {
    const maxDepth = 21; // known ceiling for this puzzle's trace, keeps ladder stable
    container.innerHTML = "";
    const track = document.createElement("div");
    track.className = "ladder-track";
    for (let d = 0; d <= maxDepth; d++) {
      const rung = document.createElement("div");
      rung.className = "ladder-rung";
      if (d === frame.depth) rung.classList.add("ladder-active");
      if (d < frame.depth) rung.classList.add("ladder-passed");
      track.appendChild(rung);
    }
    container.appendChild(track);
    const label = document.createElement("div");
    label.className = "ladder-label";
    label.textContent = `depth ${frame.depth}`;
    container.appendChild(label);
  }

  function renderNote(frame, el) {
    el.textContent = frame.note;
  }

  function renderStepCounter(index, total, el) {
    el.textContent = `step ${index + 1} / ${total}`;
  }

  // ---- recursion tree (SVG), rebuilt from frame history 0..index -------
  // Rebuilding on every step is O(index) (max ~320) which is trivial, and
  // it's what makes Prev/scrub correct for free: the tree is always an
  // exact function of "everything that happened so far".

  function computeTreeModel(frames, index) {
    const nodes = new Map(); // callId -> { callId, parentCallId, row, col, depth, status }
    for (let i = 0; i <= index; i++) {
      const f = frames[i];
      if (f.type === "enter" || f.type === "scan") {
        if (!nodes.has(f.callId)) {
          nodes.set(f.callId, {
            callId: f.callId, parentCallId: f.parentCallId,
            row: f.row, col: f.col, depth: f.depth, status: "active"
          });
        }
      }
      if (f.type === "enter") {
        const n = nodes.get(f.callId);
        if (n) { n.row = f.row; n.col = f.col; }
      }
      if (f.type === "success" && nodes.has(f.callId)) nodes.get(f.callId).status = "success";
      if (f.type === "fail" && nodes.has(f.callId)) nodes.get(f.callId).status = "deadend";
    }
    // Mark ancestors of a success leaf as "on-path" for a satisfying glow.
    const successIds = [...nodes.values()].filter(n => n.status === "success").map(n => n.callId);
    successIds.forEach(id => {
      let n = nodes.get(id);
      while (n && n.parentCallId != null) {
        const p = nodes.get(n.parentCallId);
        if (!p) break;
        if (p.status === "active") p.status = "on-path";
        n = p;
      }
    });
    return nodes;
  }

  function layoutTree(nodes) {
    // Simple layered layout: group by depth, position left-to-right in
    // order of callId (creation order) within each depth layer.
    const byDepth = new Map();
    nodes.forEach(n => {
      if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
      byDepth.get(n.depth).push(n);
    });
    byDepth.forEach(list => list.sort((a, b) => a.callId - b.callId));
    const xSpacing = 46, ySpacing = 40, padding = 30;
    const positions = new Map();
    byDepth.forEach((list, depth) => {
      list.forEach((n, i) => {
        positions.set(n.callId, {
          x: padding + i * xSpacing,
          y: padding + depth * ySpacing
        });
      });
    });
    let maxX = 0, maxY = 0;
    positions.forEach(p => { maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    return { positions, width: maxX + padding * 2, height: maxY + padding * 2 };
  }

  function renderTree(frames, index, svgEl, prevIndex) {
    const nodes = computeTreeModel(frames, index);
    const { positions, width, height } = layoutTree(nodes);
    svgEl.setAttribute("viewBox", `0 0 ${Math.max(width, 200)} ${Math.max(height, 120)}`);

    const currentCallId = frames[index].callId;
    let svgContent = "";
    // Edges first so they render beneath nodes.
    nodes.forEach(n => {
      if (n.parentCallId == null) return;
      const p = positions.get(n.parentCallId);
      const c = positions.get(n.callId);
      if (!p || !c) return;
      svgContent += `<line class="tree-edge" x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}"></line>`;
    });
    nodes.forEach(n => {
      const pos = positions.get(n.callId);
      if (!pos) return;
      const isCurrent = n.callId === currentCallId;
      const cls = ["tree-node", `tree-${n.status}`, isCurrent ? "tree-current" : ""].join(" ").trim();
      const label = n.row !== null ? `${n.row},${n.col}` : "root";
      svgContent += `
        <g class="${cls}" transform="translate(${pos.x},${pos.y})">
          <circle r="10"></circle>
          <text y="3">${label}</text>
        </g>`;
    });
    svgEl.innerHTML = svgContent;
  }

  // ---- public API -------------------------------------------------------

  return {
    init(dom) {
      buildBoard(dom.board);
      buildCodePanel(dom.code);
    },
    render(frames, index, dom, prevIndex) {
      const frame = frames[index];
      renderBoard(frame, prevIndex != null ? frames[prevIndex] : null);
      renderCode(frame);
      renderStack(frame, dom.stack);
      renderVariables(frame, dom.variables);
      renderDepthLadder(frame, dom.ladder);
      renderNote(frame, dom.note);
      renderStepCounter(index, frames.length, dom.stepCounter);
      renderTree(frames, index, dom.tree, prevIndex);

      // Celebratory pulses for the panels themselves, keyed off event type.
      const boardPanel = dom.boardPanel || dom.board;
      if (frame.type === "place") Tween.pulse(boardPanel, "flash-place", 350);
      if (frame.type === "backtrack") Tween.pulse(boardPanel, "flash-remove", 350);
      if (frame.type === "fail") Tween.pulse(dom.stack, "flash-deadend", 450);
      if (frame.type === "success") Tween.pulse(boardPanel, "flash-success", 900);
    }
  };
})();
