/* Los loops de las casillas de la home: el gif de cada proyecto pasado a
   webm (hover.webm) con videoToWeb, que le deja su ritmo entrecortado.
   El <video> nace sin fuentes y se las damos cuando su casilla está en
   pantalla o a punto de entrar: así, cuando llega el hover (o el centro, en
   móvil), el loop ya está descargado y arranca al momento, pero no se baja
   nada de lo que queda lejos. */

import { asset, canHover, loopsEnabled } from "./config.js";
import { el } from "./dom.js";
import { velocidadLoops } from "./data.js";

export function makeLoop(slug) {
  const v = el("video", "tile__loop");
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  // la "default" es la que sobrevive al load(); la otra, la de ahora
  v.defaultPlaybackRate = v.playbackRate = velocidadLoops();
  v.preload = "none";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  v.setAttribute("aria-hidden", "true");
  v.dataset.webm = asset(slug, "hover.webm");
  return v;
}

/* Solo webm: lo leen todos los navegadores actuales (Safari desde macOS 16 /
   iOS 17.4). En uno más viejo no arranca y se queda la foto de portada. */
function loadSources(v) {
  if (!v || v.dataset.loaded) return;
  v.dataset.loaded = "1";
  v.preload = "auto"; // con "none", load() no descargaría nada hasta el play
  const webm = el("source");
  webm.src = v.dataset.webm;
  webm.type = "video/webm";
  v.append(webm);
  v.load();
}

// "activo" = hover en escritorio, o casilla centrada en móvil.
// Esconde el rótulo siempre; el loop lo enciende solo si toca.
function play(tile) {
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

function stop(tile) {
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
  const stopPrecarga = precarga(tiles);

  if (canHover) {
    tiles.forEach((tile) => {
      const enter = () => play(tile);
      const leave = () => stop(tile);
      tile.addEventListener("pointerenter", enter);
      tile.addEventListener("pointerleave", leave);
      tile.addEventListener("focus", enter);
      tile.addEventListener("blur", leave);
    });
    return stopPrecarga;
  }

  // Móvil: se activa lo que queda en la franja central de la pantalla.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? play(e.target) : stop(e.target))),
    { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
  );
  tiles.forEach((t) => io.observe(t));
  return () => {
    io.disconnect();
    stopPrecarga();
  };
}

/* Descarga el loop de cada casilla cuando entra en pantalla o le falta
   media pantalla para entrar. Devuelve la función de limpieza. */
function precarga(tiles) {
  if (!loopsEnabled) return () => {};
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        loadSources(e.target.querySelector(".tile__loop"));
        io.unobserve(e.target);
      }),
    { rootMargin: "50% 0px 50% 0px", threshold: 0 }
  );
  tiles.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
