/* La portada de bienvenida: el nombre encima de un pase de imágenes de los
   proyectos.

   Dos modos, para poder compararlos:
     loop   → los loops (hover.webm) de los proyectos, en orden aleatorio
     stills → los stills de meta.welcome.stills (o todos, si no hay lista)

   Se elige en data.json (meta.welcome.modo) y se pueden ver los dos en
   /welcome-loop y /welcome-stills.

   Es también el loader: mientras se ve, se descargan las portadas de la home
   y las fuentes, con el porcentaje abajo. Cuando está todo (y ha pasado
   MIN_MS, para que dé tiempo a verlo) entra solo en la home. Si algo tarda
   más de MAX_MS entra igual, y con un clic se entra antes. */

import { asset, still, loopsEnabled, reducedMotion } from "./config.js";
import { el, shuffled } from "./dom.js";
import { meta, visibles, welcomeStills, withLoop, velocidadLoops } from "./data.js";

/* El ritmo del pase de stills. Son los números a tocar si va rápido o lento:
   cada foto está STILL_MS en pantalla y el fundido entre dos dura FUNDIDO_MS
   (ese valor está también en css/welcome.css). */
const STILL_MS = 2600;
const FUNDIDO_MS = 1100;

const MIN_MS = 2400;
const MAX_MS = 8000;

/* Los loops miden 960 px de ancho: a pantalla completa en una pantalla enorme
   se verían borrosos, así que ahí el welcome usa los stills (2000 px). */
const PANTALLA_ENORME = 2200;

export function welcome(modo, salir) {
  // sin loops (ahorro de datos o reduced motion) el modo loop no tiene sentido
  const mode =
    modo === "loop" && loopsEnabled && innerWidth <= PANTALLA_ENORME ? "loop" : "stills";

  const wrap = el("section", `welcome welcome--${mode}`);
  const media = el("div", "welcome__media");
  const layers = [slot(mode), slot(mode)];
  media.append(...layers);

  const name = el("h1", "welcome__name", meta().nombre);

  const hint = el("p", "welcome__hint", "0%");
  wrap.append(media, el("div", "welcome__veil"), name, hint);

  return {
    node: wrap,
    mounted: () => {
      // se sale una sola vez: el clic y la entrada automática pueden coincidir
      let fuera = false;
      const entrar = () => {
        if (fuera) return;
        fuera = true;
        salir();
      };

      const stopPase =
        mode === "stills" ? runStills(layers) : runLoops(layers);
      const onKey = (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") entrar();
      };
      addEventListener("keydown", onKey);
      wrap.addEventListener("click", entrar);

      const t0 = performance.now();
      const timers = [setTimeout(entrar, MAX_MS)];
      precargar((f) => (hint.textContent = `${Math.round(f * 100)}%`)).then(() => {
        timers.push(setTimeout(entrar, Math.max(0, MIN_MS - (performance.now() - t0))));
      });

      return () => {
        fuera = true;
        timers.forEach(clearTimeout);
        stopPase();
        removeEventListener("keydown", onKey);
      };
    },
  };
}

/* Descarga las portadas de la home y espera a las fuentes; avisa del avance
   (de 0 a 1). Las fotos que fallan cuentan igual: el loader no se atasca. */
function precargar(avance) {
  const urls = visibles().map((p) => still(p.slug, p.portada || 1));
  const total = urls.length + 1;
  let hechas = 0;
  const una = () => avance(++hechas / total);

  const fotos = urls.map(
    (src) =>
      new Promise((ok) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          una();
          ok();
        };
        img.src = src;
      })
  );
  return Promise.all([...fotos, document.fonts.ready.then(una)]);
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
  // la "default" es la que sobrevive a cada cambio de src
  v.defaultPlaybackRate = v.playbackRate = velocidadLoops();
  v.preload = "auto";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  return v;
}

const loopSrc = (slug) => asset(slug, "hover.webm");

/* Pase de loops: cada clip se ve entero y encadena con el siguiente.
   Mientras uno suena, el otro ya se está cargando, así no hay parón.

   Ojo con los handlers: un <video> reutilizado dispara 'canplay' cada vez que
   se le cambia la fuente. Si no se limpian, cada uno arranca una cadena nueva
   y el pase se vuelve loco. Por eso aquí se anulan siempre antes de usarlos. */
function runLoops(layers) {
  const cola = shuffled(withLoop());
  if (!cola.length) return () => {};

  let i = 0;
  let front = 1;
  let vivo = true;
  let timer = null;

  const limpia = (v) => {
    v.oncanplay = null;
    v.onended = null;
  };

  // prepara el siguiente clip en la capa de atrás
  const carga = () => {
    const p = cola[i++ % cola.length];
    const v = layers[1 - front];
    limpia(v);
    v.pause();
    v.src = loopSrc(p.slug);
    v.load();
    return v;
  };

  // lo pone delante, lo arranca y deja el siguiente cargando
  const pasa = (v) => {
    if (!vivo) return;
    limpia(v);
    v.currentTime = 0;
    v.play().catch(() => {});
    layers[front].classList.remove("is-front");
    v.classList.add("is-front");
    front = 1 - front;

    const siguiente = carga();
    let hecho = false;
    const avanza = () => {
      if (hecho) return; // 'ended' y el temporizador de reserva, solo uno manda
      hecho = true;
      v.onended = null;
      clearTimeout(timer);
      arranca(siguiente);
    };
    v.onended = avanza;
    // por si el 'ended' no llega (pestaña en segundo plano, formato raro)
    timer = setTimeout(avanza, Math.max(1500, ((v.duration || 3) * 1000) / v.playbackRate + 400));
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
      limpia(v);
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
  };
}

/* Pase de stills: uno cada STILL_MS, encadenados con un fundido largo y sin
   poner nunca dos fotos seguidas del mismo proyecto (eran casi el mismo plano
   y parecía que la web parpadeaba). */
function runStills(layers) {
  const todos = welcomeStills();
  if (!todos.length) return () => {};

  let cola = shuffled(todos);
  let i = 0;
  let anterior = null;
  let front = 1;
  let vivo = true;
  let timer = null;

  const siguienteFoto = () => {
    if (i >= cola.length) {
      cola = shuffled(todos);
      i = 0;
    }
    // si toca el mismo proyecto que la foto anterior, buscamos otro más adelante
    if (cola[i].slug === anterior) {
      const otro = cola.findIndex((s, n) => n > i && s.slug !== anterior);
      if (otro !== -1) [cola[i], cola[otro]] = [cola[otro], cola[i]];
    }
    const foto = cola[i++];
    anterior = foto.slug;
    return foto;
  };

  const siguiente = () => {
    if (!vivo) return;
    const { slug, n } = siguienteFoto();
    const back = 1 - front;
    const img = layers[back];

    img.onload = () => {
      if (!vivo) return;
      layers[front].classList.remove("is-front");
      img.classList.add("is-front");
      front = back;
      // un zoom lentísimo: la foto respira en vez de quedarse clavada
      if (!reducedMotion && img.animate) {
        img.animate([{ transform: "scale(1.015)" }, { transform: "scale(1.06)" }], {
          duration: STILL_MS + FUNDIDO_MS,
          easing: "linear",
          fill: "forwards",
        });
      }
      timer = setTimeout(siguiente, STILL_MS);
    };
    img.onerror = () => {
      if (vivo) timer = setTimeout(siguiente, 100);
    };
    img.src = still(slug, n);
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
