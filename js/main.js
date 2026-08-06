/*
 * main.js (hub)
 * -----------------------------------------------------------------------
 * The hub is a static landing page, not a slide deck - the only behavior
 * it needs is a staggered entrance animation for the hero and cards.
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  const items = [...document.querySelectorAll(".animate-in")];
  Tween.stagger(items, el => el.classList.add("animate-in-done"), 90);
});
