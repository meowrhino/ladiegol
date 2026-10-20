/* La home: el filtro por tipo y los loops del grid (el HTML viene del build). */

import { reducedMotion } from "./config.js";
import { wireLoops } from "./loops.js";

export function home() {
  const grid = document.querySelector(".grid");
  const nav = document.querySelector(".filtro");
  wireLoops(grid);

  /* all + un botón por cada "type" de los proyectos (commercial, music
     video…): enseña solo las casillas de ese tipo */
  nav.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.getAttribute("aria-pressed") === "true") return;
      nav.querySelectorAll("button").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      filtrar(grid, b.dataset.tipo || "");
    });
  });
}

/* Al filtrar, el grid se funde al negro, cambian las casillas y vuelve: el
   mismo fundido (400 ms) que entre páginas (js/transicion.js). Un clic a
   mitad deja sin efecto el anterior (turno). */
const FUNDIDO = 400;
let turno = 0;

async function filtrar(grid, tipo) {
  const mio = ++turno;
  const fundir = (de, a) => grid.animate({ opacity: [de, a] }, { duration: FUNDIDO, fill: "forwards" }).finished.catch(() => {});

  if (!reducedMotion) {
    await fundir(getComputedStyle(grid).opacity, 0);
    if (mio !== turno) return;
  }

  grid.querySelectorAll(".tile").forEach((t) => {
    t.hidden = !!tipo && t.dataset.tipo !== tipo;
  });
  if (!reducedMotion) await fundir(0, 1);
}
