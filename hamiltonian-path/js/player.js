/*
 * player.js
 * -----------------------------------------------------------------------
 * Owns "where are we in the trace" and the play/pause timer. Delegates
 * all actual rendering to Visualizer.render(). Kept separate from
 * visualizer.js so playback control logic (timers, speed) never mixes
 * with DOM-building logic.
 * -----------------------------------------------------------------------
 */

class Player {
  constructor(frames, dom, speedMs = 550) {
    this.frames = frames;
    this.dom = dom;
    this.index = 0;
    this.playing = false;
    this.speedMs = speedMs;
    this.timer = null;
  }

  goto(index, prevIndex) {
    this.index = Math.max(0, Math.min(this.frames.length - 1, index));
    Visualizer.render(this.frames, this.index, this.dom, prevIndex);
    this.updateButtons();
  }

  next() {
    if (this.index >= this.frames.length - 1) { this.pause(); return; }
    const prev = this.index;
    this.goto(this.index + 1, prev);
  }

  prev() {
    if (this.index <= 0) return;
    const prev = this.index;
    this.goto(this.index - 1, prev);
  }

  restart() {
    this.pause();
    this.goto(0, null);
  }

  play() {
    if (this.playing) return;
    if (this.index >= this.frames.length - 1) this.goto(0, null);
    this.playing = true;
    this.updateButtons();
    this.timer = setInterval(() => {
      if (this.index >= this.frames.length - 1) { this.pause(); return; }
      this.next();
    }, this.speedMs);
  }

  pause() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.updateButtons();
  }

  toggle() {
    if (this.playing) this.pause(); else this.play();
  }

  setSpeed(ms) {
    this.speedMs = ms;
    if (this.playing) { this.pause(); this.play(); }
  }

  updateButtons() {
    if (this.dom.playPauseBtn) {
      this.dom.playPauseBtn.textContent = this.playing ? "\u23F8 Pause" : "\u25B6 Play";
      this.dom.playPauseBtn.classList.toggle("is-playing", this.playing);
    }
    if (this.dom.prevBtn) this.dom.prevBtn.disabled = this.index <= 0;
    if (this.dom.nextBtn) this.dom.nextBtn.disabled = this.index >= this.frames.length - 1;
  }
}
