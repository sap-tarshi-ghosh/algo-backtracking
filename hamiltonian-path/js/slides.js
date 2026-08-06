/*
 * slides.js
 * -----------------------------------------------------------------------
 * A small, self-contained slide-deck engine providing the subset of
 * Reveal.js behavior this deck needs: keyboard navigation, one slide
 * active at a time with a CSS transition between them, progressive
 * "fragment" reveals within a slide, and staggered entrance animation
 * for elements marked .animate-in. Independent of the Sudoku demo logic.
 * -----------------------------------------------------------------------
 */

class SlideDeck {
  constructor(root) {
    this.root = root;
    this.slides = [...root.querySelectorAll(".slide")];
    this.current = 0;
    this.dots = [];
    this._buildChrome();
    this._bindKeys();
    this._bindClickToReveal();
    this.goTo(0, true);
  }

  _buildChrome() {
    // Progress bar
    this.progressEl = document.createElement("div");
    this.progressEl.className = "deck-progress";
    this.progressBar = document.createElement("div");
    this.progressBar.className = "deck-progress-bar";
    this.progressEl.appendChild(this.progressBar);
    document.body.appendChild(this.progressEl);

    // Nav dots
    this.dotsEl = document.createElement("div");
    this.dotsEl.className = "deck-dots";
    this.slides.forEach((s, i) => {
      const dot = document.createElement("button");
      dot.className = "deck-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => this.goTo(i));
      this.dotsEl.appendChild(dot);
      this.dots.push(dot);
    });
    document.body.appendChild(this.dotsEl);

    // Prev/next arrows
    this.arrowsEl = document.createElement("div");
    this.arrowsEl.className = "deck-arrows";
    const prev = document.createElement("button");
    prev.className = "deck-arrow deck-arrow-prev";
    prev.setAttribute("aria-label", "Previous");
    prev.innerHTML = "&#8592;";
    prev.addEventListener("click", () => this.back());
    const next = document.createElement("button");
    next.className = "deck-arrow deck-arrow-next";
    next.setAttribute("aria-label", "Next");
    next.innerHTML = "&#8594;";
    next.addEventListener("click", () => this.advance());
    this.arrowsEl.appendChild(prev);
    this.arrowsEl.appendChild(next);
    document.body.appendChild(this.arrowsEl);
  }

  _bindKeys() {
    window.addEventListener("keydown", e => {
      // Don't hijack keys while the user is typing in a form control.
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        this.advance();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        this.back();
      } else if (e.key === "Home") {
        this.goTo(0);
      } else if (e.key === "End") {
        this.goTo(this.slides.length - 1);
      }
    });
  }

  _bindClickToReveal() {
    // Any element with [data-reveal-toggle] shows/hides the next
    // .reveal-content sibling when clicked - used for "click to reveal
    // explanation" call-outs that aren't part of the fragment sequence.
    this.root.querySelectorAll("[data-reveal-toggle]").forEach(btn => {
      const target = btn.nextElementSibling;
      btn.addEventListener("click", () => {
        const opening = !target.classList.contains("open");
        target.classList.toggle("open", opening);
        btn.classList.toggle("open", opening);
        btn.setAttribute("aria-expanded", String(opening));
      });
    });
  }

  _fragmentsOf(slide) {
    return [...slide.querySelectorAll(".fragment")];
  }

  _animateEntrance(slide) {
    const items = [...slide.querySelectorAll(".animate-in")];
    items.forEach(el => el.classList.remove("animate-in-done"));
    Tween.stagger(items, el => el.classList.add("animate-in-done"), 90);
  }

  goTo(index, isInitial) {
    index = Math.max(0, Math.min(this.slides.length - 1, index));
    this.slides.forEach((s, i) => {
      s.classList.toggle("active", i === index);
      s.classList.toggle("prev", i < index);
    });
    this.current = index;
    this.dots.forEach((d, i) => d.classList.toggle("active", i === index));
    this.progressBar.style.width = `${((index + 1) / this.slides.length) * 100}%`;

    // Reset fragments to hidden each time we land on a slide fresh.
    const slide = this.slides[index];
    this._fragmentsOf(slide).forEach(f => f.classList.remove("shown"));
    this._animateEntrance(slide);

    slide.dispatchEvent(new CustomEvent("slide:enter", { detail: { isInitial: !!isInitial } }));
    document.dispatchEvent(new CustomEvent("deck:change", { detail: { index } }));
  }

  advance() {
    const slide = this.slides[this.current];
    const fragments = this._fragmentsOf(slide);
    const nextHidden = fragments.find(f => !f.classList.contains("shown"));
    if (nextHidden) {
      nextHidden.classList.add("shown");
      return;
    }
    if (this.current < this.slides.length - 1) this.goTo(this.current + 1);
  }

  back() {
    const slide = this.slides[this.current];
    const fragments = this._fragmentsOf(slide);
    const shown = [...fragments].reverse().find(f => f.classList.contains("shown"));
    if (shown) {
      shown.classList.remove("shown");
      return;
    }
    if (this.current > 0) this.goTo(this.current - 1);
  }
}
