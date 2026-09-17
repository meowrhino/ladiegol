/* Arranque y router. Cada vista devuelve { node, mounted? }:
   'mounted' se llama al pintarla y devuelve su función de limpieza. */

import { BASE, href } from "./config.js";
import { el, link } from "./dom.js";
import { load, bySlug, meta } from "./data.js";
import { wordmark, reshuffle } from "./wordmark.js";
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
  return rel.replace(/\/+$/, "");
};

function go(url) {
  if (url === location.pathname) return;
  history.pushState({}, "", url);
  render();
}

/* salir del welcome: si ya estamos en la portada no hay a dónde navegar,
   solo hay que volver a pintar (la marca de "ya visto" está puesta) */
const salirDelWelcome = () => (ruta() === "" ? render() : go(href()));

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
      return [welcome(w.modo, salirDelWelcome), meta().titulo || meta().nombre];
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
  const a = el("a", "back", "← index");
  a.href = href();
  a.dataset.link = "";
  wrap.append(a);
  return { node: wrap };
}

function render() {
  if (limpiar) limpiar();
  limpiar = null;

  const path = ruta();
  const [view, title] = vista(path);

  document.title = title;
  document.body.dataset.vista = vistaNombre(path);
  app.replaceChildren(view.node);
  if (view.mounted) limpiar = view.mounted();

  // desde la home no hay a dónde volver; desde el resto, un "index"
  nav.replaceChildren(...(path === "" ? [] : [link("site-nav__index", href(), "index")]));
  window.scrollTo(0, 0);
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
    marca.replaceChildren(wordmark(meta().nombre));
    marca.addEventListener("pointerenter", () => reshuffle(marca));

    render();
  })
  .catch(() => {
    app.replaceChildren(el("p", "loading", "no se ha podido cargar data.json"));
  });
