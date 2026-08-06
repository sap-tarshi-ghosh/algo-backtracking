# Backtracking, Live — Graph Coloring

Same interactive-lecture format as the Sudoku project, applied to backtracking
graph coloring: assign one of k colors to every vertex so that no edge joins
two same-colored vertices, backtracking the moment a vertex runs out of valid
colors.

## Running it

Open `index.html` directly in a browser. No server, no build step, no
internet connection needed — everything is bundled in this folder.

## The demo graph

10 vertices, 19 edges, k = 3 colors, vertices colored in plain index order
(0..9) with colors tried in order (1..3) — no heuristics, so the backtracking
itself is what's on display. This particular graph/k combination was chosen
by a small brute-force search (see `find_graph.js` in the project notes) to
produce a compact trace (~214 steps) with 18 genuine backtracks, ending in a
valid 3-coloring.

## Architecture

Identical shape to the Sudoku project — see that project's README for the
full rationale. In short:

- `solver.js` is the real algorithm, written as a generator that yields one
  snapshotted frame per executed line.
- `visualizer.js` renders the graph (SVG), executing code, recursion stack,
  variable inspector, recursion tree, and depth ladder as a pure function of
  the current frame index.
- `player.js` and `slides.js` are unchanged from the Sudoku project — the
  playback state machine and slide-deck engine are generic.
- `tween.js` / `highlight.js` are the same hand-written, dependency-free
  stand-ins for Anime.js/GSAP and Prism.js (no CDN access in the build
  environment — see the Sudoku project's README for the full explanation).

## Controls

- `→` / `Space` — advance (reveals fragments, then moves slide)
- `←` — go back
- On the live-demo slide: `↑` / `↓` step the trace, `k` play/pause, `r` restart
