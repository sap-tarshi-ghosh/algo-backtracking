# Backtracking, Live — Suite

A hub page (`index.html`) linking three fully self-contained, offline
interactive lectures on backtracking, each in its own folder:

```
backtracking-suite/
├── index.html              hub — start here
├── css/style.css             hub styles only
├── js/                       hub's tiny entrance-animation script
├── sudoku/                  Sudoku solver (row/column/box constraint)
├── graph-coloring/           k-coloring a graph (no two adjacent vertices share a color)
└── hamiltonian-path/         finding a path that visits every vertex once
```

Each of the three project folders is independently self-contained — you
could copy any one of them out on its own and it would still run, same as
if you'd downloaded it by itself. They just also happen to sit next to each
other here with a hub page and a "&larr; All backtracking demos" link back
from each one's title slide.

## Running it

Open `index.html` (this folder's, the hub) in any modern browser, then click
into whichever demo you want. Or open any of the three sub-folders'
`index.html` files directly — nothing here needs a server or an internet
connection.

## Why three separate, near-identical codebases instead of one shared engine

Each project reuses the same four "engine" files verbatim
(`tween.js`, `highlight.js`, `slides.js`, `player.js`) and follows the same
architecture — a generator-based solver that yields one snapshotted frame
per executed line, and a visualizer that's a pure function of
`(frames, currentIndex)`. What differs per project is only `data.js`,
`solver.js`, `visualizer.js`, and the board-specific CSS, because each
problem's state (a 9x9 grid vs. a colored graph vs. a growing path) needs
its own rendering. Keeping each project's own folder fully self-contained
(rather than pointing all three at one shared `/engine/` folder) means any
one of them can be handed out, opened, or archived completely on its own —
which is what "three separate projects" asked for.

See each project's own `README.md` for its specific algorithm, demo
instance, and design notes.
