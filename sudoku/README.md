# Backtracking, Live — Interactive Sudoku Recursion Deck

A self-contained, offline, interactive teaching presentation on backtracking
recursion, built around a **live** synchronized visualization of a real
Sudoku solver (board, executing code, recursion stack, and variable
inspector, updating in lockstep) plus a growing recursion-tree diagram and
a depth ladder.

## Running it

Open `index.html` directly in any modern browser. No server, no build step,
no internet connection required — everything (fonts, animation engine,
syntax highlighter, all data) is bundled in this folder.

```
sudoku-presentation/
├── index.html          all slide markup
├── css/style.css        design tokens + full layout/animation styles
└── js/
    ├── tween.js          tiny hand-written tweening engine (anime.js/GSAP stand-in)
    ├── highlight.js      tiny hand-written JS syntax highlighter (Prism.js stand-in)
    ├── data.js           the demo puzzle + annotated source lines (no logic)
    ├── solver.js          the real backtracking algorithm, as a generator that
    │                      yields one fully-snapshotted frame per executed line
    ├── visualizer.js       renders the 4 panels + tree + ladder for a given frame
    ├── player.js           play/pause/next/prev/restart/scrub over the frames
    ├── slides.js           slide-deck engine: nav, fragments, click-to-reveal
    └── main.js             wiring only
```

## Why hand-written instead of Reveal.js / Prism.js / Anime.js

The build environment used to generate this project has no outbound network
access, so the real Reveal.js, Prism.js, and Anime.js/GSAP files couldn't be
downloaded and vendored locally. Rather than pointing `<script src>` at a
CDN (which would break the "must work fully offline" requirement the moment
there's no internet connection), each library's role for *this specific
deck* was reimplemented from scratch in a few hundred lines:

- `slides.js` reproduces Reveal.js's slide navigation, progress bar, and
  fragment (progressive reveal) behavior.
- `highlight.js` reproduces Prism.js's job of tokenizing JS into styled
  `<span>`s, scoped to the one function this deck displays.
- `tween.js` reproduces the handful of Anime.js/GSAP features actually used:
  numeric tweening with easing, and a CSS-class pulse helper.

If you do have Reveal.js/Prism.js/Anime.js available locally, you can drop
them into a `vendor/` folder and swap the `<script>` tags in `index.html` —
`slides.js` and `main.js` are written to be easy to replace piecemeal.

## How the live demo stays synchronized

`solver.js` is the *actual* backtracking algorithm (not a scripted
animation) written as a JS generator. `buildTrace()` drains it once up
front into a flat array of frames, each a full snapshot (board, call stack,
current row/col/num/depth, which source line executed). Every other panel
is a pure function of `(frames, currentIndex)` — Next/Prev/Restart/the
speed slider/the scrubber all just move `currentIndex` and re-render, which
is what makes replaying the algorithm from any point trivial and reliable.

## Controls

- `→` / `Space` — advance (reveals fragments, then moves slide)
- `←` — go back
- On the live-demo slide: `↑` / `↓` step the trace, `k` play/pause, `r` restart
- Speed slider and the step scrubber both work mid-playback
