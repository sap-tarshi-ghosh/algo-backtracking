/*
 * tween.js
 * -----------------------------------------------------------------------
 * A tiny, dependency-free animation engine in the spirit of anime.js /
 * GSAP: numeric property tweening over time with easing, driven by
 * requestAnimationFrame. The brief asks for "Anime.js or GSAP" - this
 * environment has no network access to vendor either library file, so
 * this module reproduces the handful of features the deck actually
 * needs (tween a number, tween an element's style/attribute, stagger a
 * list) to keep the whole project truly offline, with zero <script src>
 * pointing outside this folder.
 * -----------------------------------------------------------------------
 */

const Easing = {
  linear: t => t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

const Tween = {
  /**
   * animate({ from, to, duration, easing, onUpdate, onComplete })
   * Animates a single number from `from` to `to`, calling onUpdate(value)
   * every frame. Returns a handle with .cancel().
   */
  animate({ from = 0, to = 1, duration = 400, easing = "outCubic", onUpdate, onComplete }) {
    const ease = Easing[easing] || Easing.linear;
    const start = performance.now();
    let cancelled = false;

    function frame(now) {
      if (cancelled) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const value = from + (to - from) * ease(t);
      if (onUpdate) onUpdate(value, t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else if (onComplete) {
        onComplete();
      }
    }
    requestAnimationFrame(frame);
    return { cancel: () => { cancelled = true; } };
  },

  /** Briefly pulses a CSS class on an element, then removes it. */
  pulse(el, className, duration = 500) {
    if (!el) return;
    el.classList.remove(className);
    // Force reflow so the animation restarts even if it's already mid-way.
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), duration);
  },

  /**
   * Calls fn(index) for each item in `items` with a staggered delay,
   * mirroring anime.js's stagger() helper.
   */
  stagger(items, fn, delayStep = 60) {
    items.forEach((item, i) => {
      setTimeout(() => fn(item, i), i * delayStep);
    });
  }
};
