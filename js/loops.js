/* Los loops de las casillas de la home.
   El <video> nace sin fuentes: solo se las damos cuando toca reproducirlo, así
   la home no descarga nada de video hasta que hay hover (o centro, en móvil). */

import { asset, canHover, loopsEnabled } from "./config.js";
import { el } from "./dom.js";

export function makeLoop(slug) {
  const v = el("video", "tile__loop");
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "none";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  v.setAttribute("aria-hidden", "true");
  v.dataset.webm = asset(slug, "hover.webm");
  v.dataset.mp4 = asset(slug, "hover.mp4");
  return v;
}

export function loadSources(v) {
  if (!v || v.dataset.loaded) return;
  v.dataset.loaded = "1";
  const webm = el("source");
  webm.src = v.dataset.webm;
  webm.type = "video/webm";
  const mp4 = el("source");
  mp4.src = v.dataset.mp4;
  mp4.type = "video/mp4";
  v.append(webm, mp4);
  v.load();
}

// "activo" = hover en escritorio, o casilla centrada en móvil.
// Enciende el rótulo siempre; el loop, solo si toca.
export function play(tile) {
  tile.classList.add("is-active");
  if (!loopsEnabled) return;
  const v = tile.querySelector(".tile__loop");
  if (!v) return;
  loadSources(v);

  const start = () => {
    // si mientras cargaba el ratón ya se ha ido, no arrancamos
    if (!tile.classList.contains("is-active")) return;
    v.play()
      .then(() => tile.classList.add("is-playing"))
      // si el navegador se niega (autoplay bloqueado), nos quedamos con el still
      .catch(() => tile.classList.remove("is-playing"));
  };

  // pedir play() antes de que haya datos aborta la reproducción: esperamos
  if (v.readyState >= 2) start();
  else v.addEventListener("canplay", start, { once: true });
}

export function stop(tile) {
  tile.classList.remove("is-active", "is-playing");
  const v = tile.querySelector(".tile__loop");
  if (!v) return;
  v.pause();
  v.currentTime = 0;
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
    if (loopsEnabled && tiles[0]) loadSources(tiles[0].querySelector(".tile__loop"));
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
