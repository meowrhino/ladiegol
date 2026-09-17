/* El nombre con una tipografía distinta por letra.
   Las familias las declara css/base.css como "Diegol 1" … "Diegol 6". */

import { el } from "./dom.js";

const FAMILIES = 6;
const family = () => `"Diegol ${1 + Math.floor(Math.random() * FAMILIES)}"`;

/** Convierte un texto en letras sueltas, cada una con su tipo. */
export function wordmark(text) {
  const frag = document.createDocumentFragment();
  [...text].forEach((ch) => {
    if (ch === " ") {
      frag.append(el("span", "wordmark__space", " "));
      return;
    }
    const span = el("span", "wordmark__letter", ch);
    span.style.fontFamily = family();
    frag.append(span);
  });
  return frag;
}

/** Vuelve a sortear las tipos de un nombre ya pintado. */
export function reshuffle(node) {
  node.querySelectorAll(".wordmark__letter").forEach((s) => {
    s.style.fontFamily = family();
  });
}

/** Cada letra cambia por su lado, a su ritmo. Devuelve la función de parar. */
export function autoShuffle(node, min = 400, max = 1600) {
  const timers = [];
  node.querySelectorAll(".wordmark__letter").forEach((s) => {
    const tick = () => {
      s.style.fontFamily = family();
      timers.push(setTimeout(tick, min + Math.random() * (max - min)));
    };
    timers.push(setTimeout(tick, Math.random() * max));
  });
  return () => timers.forEach(clearTimeout);
}
