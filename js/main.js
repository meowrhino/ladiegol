/* Arranque y router. Cada vista devuelve { node, mounted? }:
   'mounted' se llama al pintarla y devuelve su función de limpieza. */

import { BASE, href, reducedMotion } from "./config.js";
import { el, link } from "./dom.js";
import { load, bySlug, meta } from "./data.js";
import { home } from "./home.js";
import { project } from "./project.js";
import { about } from "./about.js";
import { welcome } from "./welcome.js";

const app = document.getElementById("app");
const nav = document.querySelector(".site-nav");
const marca = document.querySelector(".wordmark");

let limpiar = null;

/* ---------- navegación ---------- */

const ruta = () => {
  const p = decodeURIComponent(location.pathname);
  const rel = p.startsWith(BASE) ? p.slice(BASE.length) : p.replace(/^\//, "");
  // Live Server (y algún enlace viejo) abren /index.html: es la portada
  return rel.replace(/\/+$/, "").replace(/^index\.html$/, "");
};

function go(url) {
  if (url === location.pathname) return;
  history.pushState({}, "", url);
  render();
}

/* salir del welcome: si ya estamos en la portada no hay a dónde navegar,
   solo hay que volver a pintar (la marca de "ya visto" está puesta) */
const salirDelWelcome = () => {
  // marca este paso para que el css le dé su transición, más lenta
  document.documentElement.dataset.paso = "welcome";
  return ruta() === "" ? render() : go(href());
};

/* en navegación privada sessionStorage puede petar: que no tumbe la web */
const visto = {
  get: () => {
    try {
      return sessionStorage.getItem("welcome-visto");
    } catch {
      return null;
    }
  },
  set: () => {
    try {
      sessionStorage.setItem("welcome-visto", "1");
    } catch {
      /* nada */
    }
  },
};

/* ---------- vistas ---------- */

function vista(path) {
  if (path === "") {
    const w = meta().welcome;
    // el welcome solo sale de portada si está activado, y una vez por visita
    if (w?.activo && !visto.get()) {
      visto.set();
      // el tercer valor fuerza data-vista="welcome": la ruta es la de la home,
      // pero tiene que ir a pantalla completa y sin cabecera
      return [welcome(w.modo, salirDelWelcome), meta().titulo || meta().nombre, "welcome"];
    }
    return [home(), meta().titulo || meta().nombre];
  }

  if (path === "about") return [about(), `about — ${meta().nombre}`];

  // ojo: las rutas son siempre de un solo tramo (welcome-loop, no welcome/loop),
  // porque el html enlaza css y js con rutas relativas
  if (path === "welcome" || path.startsWith("welcome-")) {
    const modo = path.slice("welcome-".length) || meta().welcome?.modo || "loop";
    return [welcome(modo, salirDelWelcome), `welcome — ${meta().nombre}`];
  }

  const p = bySlug(path);
  if (p) return [project(p), `${p.titulo} — ${meta().nombre}`];

  return [noEncontrado(), `404 — ${meta().nombre}`];
}

const vistaNombre = (path) => {
  if (path === "") return "home";
  if (path === "about") return "about";
  if (path === "welcome" || path.startsWith("welcome-")) return "welcome";
  return "project";
};

function noEncontrado() {
  const wrap = el("section", "about");
  wrap.append(el("h1", "project__title", "404"));
  const a = el("a", "back", "← home");
  a.href = href();
  a.dataset.link = "";
  wrap.append(a);
  return { node: wrap };
}

/* Cambiar de página con fundido (view transitions, el navegador hace la
   animación; los tiempos están en css/base.css). La primera vez se pinta
   directo, y sin soporte o con "menos movimiento" también. */
let pintada = false;

function render() {
  const html = document.documentElement;
  if (!pintada || reducedMotion || !document.startViewTransition) {
    pintada = true;
    pintar();
    delete html.dataset.paso;
    return;
  }
  const t = document.startViewTransition(pintar);
  // si la pestaña está en segundo plano el navegador se salta la animación
  // (pinta igual): que no salga como error en la consola
  t.ready.catch(() => {});
  t.finished.finally(() => delete html.dataset.paso);
}

function pintar() {
  if (limpiar) limpiar();
  limpiar = null;

  const path = ruta();
  const [view, title, nombre = vistaNombre(path)] = vista(path);

  document.title = title;
  document.body.dataset.vista = nombre;
  app.replaceChildren(view.node);
  if (view.mounted) limpiar = view.mounted();

  nav.replaceChildren(path === "" ? link("site-nav__index", href("about"), "about") : volver(path));
  window.scrollTo(0, 0);
}

/* en la home, "about"; desde un proyecto, "back"; desde el resto, "home" */
function volver(path) {
  return link("site-nav__index", href(), bySlug(path) ? "back" : "home");
}

/* ---------- enlaces internos ---------- */

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  go(a.getAttribute("href"));
});

addEventListener("popstate", render);

/* ---------- a rodar ---------- */

load()
  .then(() => {
    // el nombre es el enlace al about
    marca.href = href("about");
    marca.dataset.link = "";
    marca.textContent = meta().nombre;

    render();
  })
  .catch((e) => {
    // casi siempre es una coma de más o de menos en data.json: el mensaje del
    // navegador dice en qué línea, así se encuentra rápido
    app.replaceChildren(
      el("p", "loading", "no se ha podido cargar data.json"),
      el("p", "loading", e.message)
    );
  });
