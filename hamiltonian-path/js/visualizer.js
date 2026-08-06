/*
 * visualizer.js
 * -----------------------------------------------------------------------
 * Same architecture as the other two projects: every render function is a
 * pure function of (frames, index).
 * -----------------------------------------------------------------------
 */

const Visualizer = (() => {
  let nodePositions = [];
  let codeLines = [];

  function layoutCircle(n, radius, cx, cy) {
    const positions = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    return positions;
  }

  function edgeKey(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }

  function buildGraph(svgEl) {
    const size = 300;
    nodePositions = layoutCircle(GRAPH_N, size * 0.38, size / 2, size / 2);
    svgEl.setAttribute("viewBox", `0 0 ${size} ${size}`);

    let html = "";
    GRAPH_EDGES.forEach(([a, b]) => {
      const p1 = nodePositions[a], p2 = nodePositions[b];
      html += `<line class="graph-edge" data-key="${edgeKey(a, b)}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"></line>`;
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
    const pathEdges = new Set();
    for (let i = 0; i < frame.path.length - 1; i++) pathEdges.add(edgeKey(frame.path[i], frame.path[i + 1]));
    const tryingKey = (frame.type === "try" || frame.type === "invalid") && frame.next != null
      ? edgeKey(frame.last, frame.next) : null;

    GRAPH_EDGES.forEach(([a, b]) => {
      const key = edgeKey(a, b);
      const el = svgEl.querySelector(`.graph-edge[data-key="${key}"]`);
      if (!el) return;
      el.classList.toggle("edge-on-path", pathEdges.has(key));
      el.classList.toggle("edge-trying", key === tryingKey);
      el.classList.toggle("edge-invalid", key === tryingKey && frame.type === "invalid");
    });

    for (let i = 0; i < GRAPH_N; i++) {
      const g = svgEl.querySelector(`.graph-node[data-vertex="${i}"]`);
      if (!g) continue;
      g.classList.toggle("node-visited", frame.visited[i]);
      g.classList.toggle("node-start", i === START_VERTEX);
      g.classList.remove("node-focus", "node-place", "node-remove", "node-deadend", "node-success");
    }
    const lastEl = svgEl.querySelector(`.graph-node[data-vertex="${frame.last}"]`);
    if (lastEl) {
      lastEl.classList.add("node-focus");
      if (frame.type === "fail") lastEl.classList.add("node-deadend");
    }
    if (frame.next !== null) {
      const nextEl = svgEl.querySelector(`.graph-node[data-vertex="${frame.next}"]`);
      if (nextEl) {
        if (frame.type === "place") nextEl.classList.add("node-place");
        if (frame.type === "backtrack") nextEl.classList.add("node-remove");
      }
    }
    if (frame.type === "success") {
      svgEl.querySelectorAll(".graph-node").forEach(g => g.classList.add("node-success"));
      svgEl.querySelectorAll(".graph-edge.edge-on-path").forEach(e => e.classList.add("edge-success"));
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
        <span class="stack-label">solve(last=${entry.vertex})</span>
      `;
      container.appendChild(row);
    });
  }

  function renderVariables(frame, container) {
    const rows = [
      ["last", frame.last === null ? "\u2014" : frame.last],
      ["next", frame.next === null ? "\u2014" : frame.next],
      ["path", frame.path.join(" \u2192 ")],
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
    const maxDepth = GRAPH_N;
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

  // ---- recursion tree ---------------------------------------------------

  function computeTreeModel(frames, index) {
    const nodes = new Map();
    for (let i = 0; i <= index; i++) {
      const f = frames[i];
      if (f.type === "enter") {
        if (!nodes.has(f.callId)) {
          nodes.set(f.callId, { callId: f.callId, parentCallId: f.parentCallId, vertex: f.last, depth: f.depth, status: "active" });
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
    const xSpacing = 42, ySpacing = 38, padding = 26;
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

  // ---- public API ---------------------------------------------------------

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
