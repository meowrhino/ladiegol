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

/* Al filtrar, las casillas se cortan hacia arriba una tras otra y las que
   quedan entran de golpe desde abajo, también en cascada. Un clic a mitad
   deja sin efecto el anterior (turno). */
const CORTE = "cubic-bezier(.77, 0, .18, 1)";
let turno = 0;

async function filtrar(grid, tipo) {
  const mio = ++turno;
  const tiles = [...grid.querySelectorAll(".tile")];

  if (!reducedMotion) {
    const salen = tiles.filter((t) => !t.hidden).map((t, i) =>
      t.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], {
        duration: 260,
        delay: i * 20,
        easing: CORTE,
        fill: "forwards",
      }).finished.catch(() => {})
    );
    await Promise.all(salen);
    if (mio !== turno) return;
  }

  tiles.forEach((t) => {
    t.getAnimations().forEach((a) => a.cancel());
    t.hidden = !!tipo && t.dataset.tipo !== tipo;
  });
  if (reducedMotion) return;

  tiles
    .filter((t) => !t.hidden)
    .forEach((t, i) =>
      t.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
        duration: 520,
        delay: i * 45,
        easing: CORTE,
        fill: "backwards",
      })
    );
}
