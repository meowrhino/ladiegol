/* La home: un grid con un proyecto por casilla. */

import { asset, href } from "./config.js";
import { el, link } from "./dom.js";
import { visibles } from "./data.js";
import { makeLoop, wireLoops } from "./loops.js";

export function home() {
  const grid = el("div", "grid");
  let bigs = 0;

  visibles().forEach((p) => {
    const tile = link("tile", href(p.slug));
    tile.setAttribute("aria-label", `${p.cliente} — ${p.titulo}`);

    if (p.destacado) {
      tile.classList.add("tile--big");
      // alternamos el lado de la casilla grande, como en el diseño
      if (bigs % 2 === 1) tile.classList.add("tile--right");
      bigs++;
    }

    const still = el("img", "tile__still");
    still.src = asset(p.slug, "poster.webp");
    still.alt = `${p.cliente} — ${p.titulo}`;
    still.loading = "lazy";
    still.decoding = "async";
    tile.append(still, makeLoop(p.slug));

    const meta = el("div", "tile__meta");
    meta.append(el("span", null, p.cliente));
    // si el título repite el nombre del cliente (coches.net) no lo ponemos dos veces
    if (p.titulo.toLowerCase() !== p.cliente.toLowerCase()) {
      meta.append(el("span", null, p.titulo));
    }
    tile.append(meta);

    grid.append(tile);
  });

  return { node: grid, mounted: () => wireLoops(grid) };
}
