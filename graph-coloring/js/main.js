/*
 * main.js
 * -----------------------------------------------------------------------
 * Wiring only, same structure as the Sudoku project.
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  const deckRoot = document.querySelector(".reveal-deck");
  const deck = new SlideDeck(deckRoot);

  const frames = buildTrace();

  const dom = {
    board: document.getElementById("demo-board"),      // <svg> element
    boardPanel: document.getElementById("panel-board"),
    code: document.getElementById("demo-code"),
    stack: document.getElementById("demo-stack"),
    variables: document.getElementById("demo-variables"),
    tree: document.getElementById("demo-tree"),
    ladder: document.getElementById("demo-ladder"),
    note: document.getElementById("demo-note"),
    stepCounter: document.getElementById("demo-step-counter"),
    playPauseBtn: document.getElementById("btn-play-pause"),
    prevBtn: document.getElementById("btn-prev"),
    nextBtn: document.getElementById("btn-next"),
  };

  Visualizer.init(dom);
  const player = new Player(frames, dom, 500);
  player.goto(0, null);

  dom.playPauseBtn.addEventListener("click", () => player.toggle());
  dom.nextBtn.addEventListener("click", () => { player.pause(); player.next(); });
  dom.prevBtn.addEventListener("click", () => { player.pause(); player.prev(); });
  document.getElementById("btn-restart").addEventListener("click", () => player.restart());

  const speedRange = document.getElementById("speed-range");
  const speedLabel = document.getElementById("speed-label");
  const SPEED_MS = { "1": 900, "2": 500, "3": 260, "4": 120 };
  speedRange.addEventListener("input", () => {
    const v = speedRange.value;
    player.setSpeed(SPEED_MS[v] || 500);
    speedLabel.textContent = { 1: "Slow", 2: "Normal", 3: "Fast", 4: "Very fast" }[v];
  });

  const scrubber = document.getElementById("step-scrubber");
  scrubber.max = frames.length - 1;
  scrubber.addEventListener("input", () => {
    player.pause();
    player.goto(Number(scrubber.value), player.index);
  });
  const originalGoto = player.goto.bind(player);
  player.goto = (index, prevIndex) => {
    originalGoto(index, prevIndex);
    scrubber.value = String(player.index);
  };

  document.addEventListener("deck:change", () => {
    const demoSlide = document.getElementById("slide-live-demo");
    const isDemoActive = demoSlide && demoSlide.classList.contains("active");
    if (!isDemoActive) player.pause();
  });

  window.addEventListener("keydown", (e) => {
    const demoSlide = document.getElementById("slide-live-demo");
    if (!demoSlide || !demoSlide.classList.contains("active")) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.key === "ArrowUp") { e.preventDefault(); player.pause(); player.next(); }
    if (e.key === "ArrowDown") { e.preventDefault(); player.pause(); player.prev(); }
    if (e.key === "r" || e.key === "R") { player.restart(); }
    if (e.key === "k" || e.key === "K") { player.toggle(); }
  });
});
