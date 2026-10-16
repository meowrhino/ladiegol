/* La home: el filtro por tipo y un grid con un proyecto por casilla. */

import { href, still as stillSrc, reducedMotion } from "./config.js";
import { el, link } from "./dom.js";
import { visibles } from "./data.js";
import { makeLoop, wireLoops } from "./loops.js";

export function home() {
  const grid = el("div", "grid");
  let bigs = 0;

  visibles().forEach((p) => {
    const tile = link("tile", href(p.slug));
    tile.dataset.tipo = p.tipo || "";
    tile.setAttribute("aria-label", `${p.cliente} — ${p.titulo}`);

    if (p.destacado) {
      tile.classList.add("tile--big");
      // alternamos el lado de la casilla grande, como en el diseño
      if (bigs % 2 === 1) tile.classList.add("tile--right");
      bigs++;
    }

    // el rótulo va encima de la imagen, no sobre ella
    const meta = el("div", "tile__meta");
    meta.append(el("span", null, p.cliente));
    // si el título repite el nombre del cliente (coches.net) no lo ponemos dos veces
    if (p.titulo.toLowerCase() !== p.cliente.toLowerCase()) {
      meta.append(el("span", null, p.titulo));
    }

    const media = el("div", "tile__media");
    const still = el("img", "tile__still");
    still.onload = () => still.classList.add("is-loaded"); // entra con fundido
    still.src = stillSrc(p.slug, p.portada || 1);
    still.alt = `${p.cliente} — ${p.titulo}`;
    still.loading = "lazy";
    still.decoding = "async";
    media.append(still);
    if (p.loop !== false) media.append(makeLoop(p.slug));

    tile.append(meta, media);

    grid.append(tile);
  });

  const wrap = el("div", "home");
  wrap.append(filtro(grid), grid);

  return { node: wrap, mounted: () => wireLoops(grid) };
}

/* all + un botón por cada "tipo" que haya en data.json (commercial, music
   video…): enseña solo las casillas de ese tipo */
function filtro(grid) {
  const nav = el("nav", "filtro");
  nav.setAttribute("aria-label", "filter");
  const tipos = [...new Set(visibles().map((p) => p.tipo).filter(Boolean))];

  ["", ...tipos].forEach((tipo) => {
    const b = el("button", "filtro__op", tipo || "all");
    b.type = "button";
    b.setAttribute("aria-pressed", String(!tipo));
    b.addEventListener("click", () => {
      if (b.getAttribute("aria-pressed") === "true") return;
      nav.querySelectorAll("button").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      filtrar(grid, tipo);
    });
    nav.append(b);
  });
  return nav;
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
