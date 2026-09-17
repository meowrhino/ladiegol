/* La portada de bienvenida: el nombre cambiando de tipografía letra a letra
   encima de un pase de imágenes de los proyectos.

   Dos modos, para poder compararlos:
     loop   → los loops de los proyectos, uno tras otro, en orden aleatorio
     stills → lo mismo pero con stills sueltos

   Se elige en data.json (meta.welcome.modo) y se pueden ver los dos en
   /welcome/loop y /welcome/stills. */

import { asset, loopsEnabled } from "./config.js";
import { el, pick, shuffled } from "./dom.js";
import { allStills, meta, withLoop } from "./data.js";
import { wordmark, autoShuffle } from "./wordmark.js";

const STILL_MS = 1400; // lo que dura cada still en pantalla

export function welcome(modo, salir) {
  // sin loops (ahorro de datos o reduced motion) el modo video no tiene sentido
  const mode = modo === "loop" && loopsEnabled ? "loop" : "stills";

  const wrap = el("section", `welcome welcome--${mode}`);
  const media = el("div", "welcome__media");
  const layers = [slot(mode), slot(mode)];
  media.append(...layers);

  const name = el("h1", "welcome__name");
  name.append(wordmark(meta().nombre));

  wrap.append(media, el("div", "welcome__veil"), name, el("p", "welcome__hint", "enter"));

  wrap.addEventListener("click", salir);

  return {
    node: wrap,
    mounted: () => {
      const stopName = autoShuffle(name, 260, 1100);
      const stopPase = mode === "loop" ? runLoops(layers) : runStills(layers);
      const onKey = (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") salir();
      };
      addEventListener("keydown", onKey);
      return () => {
        stopName();
        stopPase();
        removeEventListener("keydown", onKey);
      };
    },
  };
}

function slot(mode) {
  if (mode === "stills") {
    const img = el("img", "welcome__slot");
    img.alt = "";
    img.decoding = "async";
    return img;
  }
  const v = el("video", "welcome__slot");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  return v;
}

/* webm si el navegador puede; si no, mp4 (Safari viejo) */
const soportaWebm = document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
const loopSrc = (slug) => asset(slug, soportaWebm ? "hover.webm" : "hover.mp4");

/* Pase de loops: cada clip se ve entero y encadena con el siguiente.
   Mientras uno suena, el otro ya se está cargando, así no hay parón. */
function runLoops(layers) {
  const cola = shuffled(withLoop());
  if (!cola.length) return () => {};

  let i = 0;
  let front = 1;
  let vivo = true;
  let timer = null;

  // prepara el siguiente clip en la capa de atrás
  const carga = () => {
    const p = cola[i++ % cola.length];
    const v = layers[1 - front];
    v.src = loopSrc(p.slug);
    v.load();
    return v;
  };

  // lo pone delante, lo arranca y deja el siguiente cargando
  const pasa = (v) => {
    if (!vivo) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    layers[front].classList.remove("is-front");
    v.classList.add("is-front");
    front = 1 - front;

    const siguiente = carga();
    const avanza = () => {
      v.onended = null;
      clearTimeout(timer);
      arranca(siguiente);
    };
    v.onended = avanza;
    // por si el 'ended' no llega (pestaña en segundo plano, formato raro)
    timer = setTimeout(avanza, Math.max(1500, (v.duration || 3) * 1000 + 400));
  };

  const arranca = (v) => {
    if (!vivo) return;
    if (v.readyState >= 3) pasa(v);
    else v.oncanplay = () => pasa(v);
  };

  arranca(carga());

  return () => {
    vivo = false;
    clearTimeout(timer);
    layers.forEach((v) => {
      v.onended = v.oncanplay = null;
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
  };
}

/* Pase de stills: uno cada STILL_MS, sin repetir el anterior. */
function runStills(layers) {
  const todos = allStills();
  if (!todos.length) return () => {};

  let cola = shuffled(todos);
  let i = 0;
  let front = 1;
  let vivo = true;
  let timer = null;

  const siguiente = () => {
    if (!vivo) return;
    if (i >= cola.length) {
      cola = shuffled(todos);
      i = 0;
    }
    const { slug, n } = cola[i++];
    const back = 1 - front;
    const img = layers[back];

    img.onload = () => {
      if (!vivo) return;
      layers[front].classList.remove("is-front");
      img.classList.add("is-front");
      front = back;
      timer = setTimeout(siguiente, STILL_MS);
    };
    img.onerror = () => {
      if (vivo) timer = setTimeout(siguiente, 100);
    };
    img.src = asset(slug, `${n}.webp`);
  };

  siguiente();
  return () => {
    vivo = false;
    clearTimeout(timer);
    layers.forEach((img) => {
      img.onload = img.onerror = null;
    });
  };
}

/* por si algún día queremos un still suelto al azar en otro sitio */
export const stillAlAzar = () => pick(allStills());
