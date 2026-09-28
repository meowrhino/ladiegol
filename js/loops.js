/* Los loops de las casillas de la home: el gif de cada proyecto, pasado a
   webp animado (hover.webp) con imgToWeb.
   El <img> nace sin fuente: solo se la damos cuando toca, así la home no
   descarga nada de loops hasta que hay hover (o centro, en móvil). */

import { asset, canHover, loopsEnabled } from "./config.js";
import { el } from "./dom.js";

export function makeLoop(slug) {
  const img = el("img", "tile__loop");
  img.alt = "";
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  img.dataset.src = asset(slug, "hover.webp");
  return img;
}

// "activo" = hover en escritorio, o casilla centrada en móvil.
// Enciende el rótulo siempre; el loop, solo si toca.
function play(tile) {
  tile.classList.add("is-active");
  if (!loopsEnabled) return;
  const img = tile.querySelector(".tile__loop");
  if (!img) return;
  // el webp animado arranca en cuanto carga; si el ratón ya se ha ido, no se enseña
  img.onload = () => {
    if (tile.classList.contains("is-active")) tile.classList.add("is-playing");
  };
  img.src = img.dataset.src;
}

/* Al parar le quitamos la fuente: deja de gastar y la próxima vez empieza
   desde el principio (la descarga ya queda en caché). */
function stop(tile) {
  tile.classList.remove("is-active", "is-playing");
  const img = tile.querySelector(".tile__loop");
  if (!img) return;
  img.onload = null;
  img.removeAttribute("src");
}

/** Conecta el hover (escritorio) o el observador del centro (móvil).
    Devuelve la función de limpieza. */
export function wireLoops(grid) {
  const tiles = [...grid.querySelectorAll(".tile")];

  if (canHover) {
    tiles.forEach((tile) => {
      const enter = () => play(tile);
      const leave = () => stop(tile);
      tile.addEventListener("pointerenter", enter);
      tile.addEventListener("pointerleave", leave);
      tile.addEventListener("focus", enter);
      tile.addEventListener("blur", leave);
    });
    // precargamos el primero: suele ser el que se toca antes
    const first = tiles[0]?.querySelector(".tile__loop");
    if (loopsEnabled && first) new Image().src = first.dataset.src;
    return () => {};
  }

  // Móvil: se activa lo que queda en la franja central de la pantalla.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? play(e.target) : stop(e.target))),
    { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
  );
  tiles.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
