# Backtracking, Live — Hamiltonian Path

Same interactive-lecture format as the other two projects, applied to
backtracking search for a Hamiltonian path: extend a path one unvisited
neighbor at a time, backtracking the instant a vertex has no unvisited
neighbor left to extend to.

## Running it

Open `index.html` directly in a browser. No server, no build step, no
internet connection needed — everything is bundled in this folder.

## The demo graph

7 vertices, 13 edges, path search starts at vertex 0, neighbors tried in
ascending order — no heuristics. This graph was chosen by a small
brute-force search (see `find_graph.js` in the project notes) to produce a
compact trace (~199 steps) with 17 genuine backtracks, ending in the found
path 0 → 2 → 5 → 6 → 4 → 1 → 3.

## Architecture

Identical shape to the Sudoku and graph-coloring projects — see the Sudoku
project's README for the full rationale. In short:

- `solver.js` is the real algorithm, written as a generator that yields one
  snapshotted frame per executed line.
- `visualizer.js` renders the graph (SVG, with the growing path highlighted
  in cyan and the vertex/edge currently being tried in amber), executing
  code, recursion stack, variable inspector, recursion tree, and depth
  ladder — all as a pure function of the current frame index.
- `player.js` and `slides.js` are unchanged from the other two projects.
- `tween.js` / `highlight.js` are the same hand-written, dependency-free
  stand-ins for Anime.js/GSAP and Prism.js.

## Controls

- `→` / `Space` — advance (reveals fragments, then moves slide)
- `←` — go back
- On the live-demo slide: `↑` / `↓` step the trace, `k` play/pause, `r` restart
