/* Los loops de las casillas de la home.
   Nacen sin fuente: solo se la damos cuando toca reproducirlos, así la home no
   descarga nada de loops hasta que hay hover (o centro, en móvil).

   Dos formatos (ver loopFormat en data.js):
     video → <video> con hover.webm (sacado del vídeo con videoToWeb)
     gif   → <img> con hover.webp animado (sacado del gif con imgToWeb) */

import { asset, canHover, loopsEnabled } from "./config.js";
import { el } from "./dom.js";
import { loopFormat } from "./data.js";

export function makeLoop(slug) {
  if (loopFormat() === "gif") {
    const img = el("img", "tile__loop");
    img.alt = "";
    img.decoding = "async";
    img.setAttribute("aria-hidden", "true");
    img.dataset.src = asset(slug, "hover.webp");
    return img;
  }

  const v = el("video", "tile__loop");
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
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
  if (!v || v.dataset.loaded || v.tagName !== "VIDEO") return;
  v.dataset.loaded = "1";
  const webm = el("source");
  webm.src = v.dataset.webm;
  webm.type = "video/webm";
  v.append(webm);
  v.load();
}

/* El webp animado arranca en cuanto tiene fuente. Al parar se la quitamos:
   así deja de gastar y la próxima vez empieza desde el principio. */
function playImg(tile, img) {
  img.onload = () => {
    if (tile.classList.contains("is-active")) tile.classList.add("is-playing");
  };
  img.src = img.dataset.src;
}

// "activo" = hover en escritorio, o casilla centrada en móvil.
// Enciende el rótulo siempre; el loop, solo si toca.
function play(tile) {
  tile.classList.add("is-active");
  if (!loopsEnabled) return;
  const v = tile.querySelector(".tile__loop");
  if (!v) return;
  if (v.tagName === "IMG") return playImg(tile, v);
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
  if (v.tagName === "IMG") {
    v.onload = null;
    v.removeAttribute("src");
    return;
  }
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
