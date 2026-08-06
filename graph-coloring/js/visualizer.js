/*
 * visualizer.js
 * -----------------------------------------------------------------------
 * Same architecture as the Sudoku project's visualizer: every render
 * function is a pure function of (frames, index), so Prev/Next/Restart/
 * scrubbing all just re-render at a different index. See that project's
 * README for the rationale.
 * -----------------------------------------------------------------------
 */

const Visualizer = (() => {
  let nodePositions = [];   // [{x,y}] per vertex, laid out once
  let codeLines = [];

  const COLOR_VARS = ["", "var(--accent-amber)", "var(--accent-cyan)", "var(--accent-violet)", "#F080B0", "#7FE0A0"];

  // ---- one-time setup ---------------------------------------------------

  function layoutCircle(n, radius, cx, cy) {
    const positions = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    return positions;
  }

  function buildGraph(svgEl) {
    const size = 300;
    nodePositions = layoutCircle(GRAPH_N, size * 0.38, size / 2, size / 2);
    svgEl.setAttribute("viewBox", `0 0 ${size} ${size}`);

    let html = "";
    GRAPH_EDGES.forEach(([a, b]) => {
      const p1 = nodePositions[a], p2 = nodePositions[b];
      html += `<line class="graph-edge" data-a="${a}" data-b="${b}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"></line>`;
    });
    for (let i = 0; i < GRAPH_N; i++) {
      const p = nodePositions[i];
      html += `
        <g class="graph-node" data-vertex="${i}" transform="translate(${p.x},${p.y})">
          <circle r="14"></circle>
          <text y="4">${i}</text>
        </g>`;
    }
    svgEl.innerHTML = html;
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

  // ---- per-frame render ---------------------------------------------------

  function renderGraph(frame, svgEl) {
    GRAPH_EDGES.forEach(([a, b]) => {
      const el = svgEl.querySelector(`.graph-edge[data-a="${a}"][data-b="${b}"]`);
      if (!el) return;
      const conflict = frame.type === "invalid" && frame.vertex != null &&
        (frame.vertex === a || frame.vertex === b) &&
        ((a === frame.vertex && frame.colors[b] === frame.color) || (b === frame.vertex && frame.colors[a] === frame.color));
      el.classList.toggle("edge-conflict", !!conflict);
    });

    for (let i = 0; i < GRAPH_N; i++) {
      const g = svgEl.querySelector(`.graph-node[data-vertex="${i}"]`);
      if (!g) continue;
      const circle = g.querySelector("circle");
      const c = frame.colors[i];
      circle.style.fill = c ? COLOR_VARS[c] : "";
      g.classList.toggle("node-colored", !!c);
      g.classList.remove("node-focus", "node-place", "node-remove", "node-deadend", "node-success");
    }

    if (frame.vertex !== null && frame.vertex < GRAPH_N) {
      const g = svgEl.querySelector(`.graph-node[data-vertex="${frame.vertex}"]`);
      if (g) {
        g.classList.add("node-focus");
        if (frame.type === "place") g.classList.add("node-place");
        if (frame.type === "backtrack") g.classList.add("node-remove");
        if (frame.type === "fail") g.classList.add("node-deadend");
      }
    }
    if (frame.type === "success") {
      svgEl.querySelectorAll(".graph-node").forEach(g => g.classList.add("node-success"));
    }
  }

  function renderCode(frame) {
    codeLines.forEach(div => div.classList.toggle("active", div.dataset.lineId === frame.line));
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
    [...frame.stack].reverse().forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "stack-frame" + (i === 0 ? " stack-top" : "");
      row.innerHTML = `
        <span class="stack-depth">#${entry.depth}</span>
        <span class="stack-label">solve(vertex=${entry.vertex})</span>
      `;
      container.appendChild(row);
    });
  }

  function renderVariables(frame, container) {
    const rows = [
      ["vertex", frame.vertex === null ? "\u2014" : frame.vertex],
      ["color", frame.color === null ? "\u2014" : `${frame.color} (${COLOR_NAMES[frame.color]})`],
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
    const maxDepth = GRAPH_N + 1;
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

  function renderNote(frame, el) { el.textContent = frame.note; }
  function renderStepCounter(index, total, el) { el.textContent = `step ${index + 1} / ${total}`; }

  // ---- recursion tree, rebuilt from frame history 0..index ---------------

  function computeTreeModel(frames, index) {
    const nodes = new Map();
    for (let i = 0; i <= index; i++) {
      const f = frames[i];
      if (f.type === "enter") {
        if (!nodes.has(f.callId)) {
          nodes.set(f.callId, { callId: f.callId, parentCallId: f.parentCallId, vertex: f.vertex, depth: f.depth, status: "active" });
        }
      }
      if (f.type === "success" && nodes.has(f.callId)) nodes.get(f.callId).status = "success";
      if (f.type === "fail" && nodes.has(f.callId)) nodes.get(f.callId).status = "deadend";
    }
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
    const byDepth = new Map();
    nodes.forEach(n => {
      if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
      byDepth.get(n.depth).push(n);
    });
    byDepth.forEach(list => list.sort((a, b) => a.callId - b.callId));
    const xSpacing = 40, ySpacing = 36, padding = 26;
    const positions = new Map();
    byDepth.forEach((list, depth) => {
      list.forEach((n, i) => positions.set(n.callId, { x: padding + i * xSpacing, y: padding + depth * ySpacing }));
    });
    let maxX = 0, maxY = 0;
    positions.forEach(p => { maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    return { positions, width: maxX + padding * 2, height: maxY + padding * 2 };
  }

  function renderTree(frames, index, svgEl) {
    const nodes = computeTreeModel(frames, index);
    const { positions, width, height } = layoutTree(nodes);
    svgEl.setAttribute("viewBox", `0 0 ${Math.max(width, 200)} ${Math.max(height, 120)}`);
    const currentCallId = frames[index].callId;

    let svgContent = "";
    nodes.forEach(n => {
      if (n.parentCallId == null) return;
      const p = positions.get(n.parentCallId), c = positions.get(n.callId);
      if (!p || !c) return;
      svgContent += `<line class="tree-edge" x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}"></line>`;
    });
    nodes.forEach(n => {
      const pos = positions.get(n.callId);
      if (!pos) return;
      const isCurrent = n.callId === currentCallId;
      const cls = ["tree-node", `tree-${n.status}`, isCurrent ? "tree-current" : ""].join(" ").trim();
      svgContent += `
        <g class="${cls}" transform="translate(${pos.x},${pos.y})">
          <circle r="10"></circle>
          <text y="3">${n.vertex}</text>
        </g>`;
    });
    svgEl.innerHTML = svgContent;
  }

  // ---- public API ----------------------------------------------------------

  return {
    init(dom) {
      buildGraph(dom.board);
      buildCodePanel(dom.code);
    },
    render(frames, index, dom) {
      const frame = frames[index];
      renderGraph(frame, dom.board);
      renderCode(frame);
      renderStack(frame, dom.stack);
      renderVariables(frame, dom.variables);
      renderDepthLadder(frame, dom.ladder);
      renderNote(frame, dom.note);
      renderStepCounter(index, frames.length, dom.stepCounter);
      renderTree(frames, index, dom.tree);

      const boardPanel = dom.boardPanel || dom.board;
      if (frame.type === "place") Tween.pulse(boardPanel, "flash-place", 350);
      if (frame.type === "backtrack") Tween.pulse(boardPanel, "flash-remove", 350);
      if (frame.type === "fail") Tween.pulse(dom.stack, "flash-deadend", 450);
      if (frame.type === "success") Tween.pulse(boardPanel, "flash-success", 900);
    }
  };
})();
