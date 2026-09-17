/* LA DIEGOL — SPA mínima: home (grid con hover), proyecto y about.
   Todo el contenido sale de data.json; aquí solo hay lógica. */

const app = document.getElementById("app");
const nav = document.querySelector(".site-nav");

const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection?.saveData === true;
// si el usuario pide menos movimiento o va con ahorro de datos, no cargamos los loops
const loopsEnabled = !reducedMotion && !saveData;

let data = null;
let cleanup = [];

/* ---------- utilidades ---------- */

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const asset = (slug, file) => `/_PROJECTS/${slug}/${file}`;

const bySlug = (slug) => data.projects.find((p) => p.slug === slug);

const visibles = () => data.projects.filter((p) => p.visible !== false);

/* ---------- home ---------- */

function homeView() {
  const grid = el("div", "grid");
  let bigCount = 0;

  visibles().forEach((p) => {
    const tile = el("a", "tile");
    tile.href = `/${p.slug}`;
    tile.dataset.link = "";
    tile.setAttribute("aria-label", `${p.cliente} — ${p.titulo}`);

    if (p.destacado) {
      tile.classList.add("tile--big");
      // alternamos el lado del bloque grande, como en el diseño
      if (bigCount % 2 === 1) tile.classList.add("tile--right");
      bigCount++;
    }

    const still = el("img", "tile__still");
    still.src = asset(p.slug, "poster.webp");
    still.alt = `${p.cliente} — ${p.titulo}`;
    still.loading = "lazy";
    still.decoding = "async";
    tile.append(still);

    tile.append(makeLoop(p.slug));

    const meta = el("div", "tile__meta");
    meta.append(el("span", null, p.cliente));
    // si el título repite el nombre del cliente (coches.net) no lo ponemos dos veces
    if (p.titulo.toLowerCase() !== p.cliente.toLowerCase()) {
      meta.append(el("span", null, p.titulo));
    }
    tile.append(meta);

    grid.append(tile);
  });

  app.replaceChildren(grid);
  wireLoops(grid);
}

/* El <video> nace sin fuentes: solo se las damos cuando toca reproducirlo,
   así la home no descarga nada de video hasta que hay hover (o centro en móvil). */
function makeLoop(slug) {
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

function loadSources(v) {
  if (v.dataset.loaded) return;
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

// "activo" = hover en escritorio, o casilla en el centro de la pantalla en móvil.
// Enciende el rótulo siempre; el loop, solo si toca.
function play(tile) {
  tile.classList.add("is-active");
  if (!loopsEnabled) return;
  const v = tile.querySelector(".tile__loop");
  if (!v) return;
  loadSources(v);
  tile.classList.add("is-playing");
  v.play().catch(() => {
    // si el navegador se niega (autoplay bloqueado), nos quedamos con el still
    tile.classList.remove("is-playing");
  });
}

function stop(tile) {
  tile.classList.remove("is-active", "is-playing");
  const v = tile.querySelector(".tile__loop");
  if (!v) return;
  v.pause();
  v.currentTime = 0;
}

function wireLoops(grid) {
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
    return;
  }

  // Móvil: se activa lo que queda en la franja central de la pantalla.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? play(e.target) : stop(e.target)));
    },
    { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
  );
  tiles.forEach((t) => io.observe(t));
  cleanup.push(() => io.disconnect());
}

/* ---------- proyecto ---------- */

function projectView(p) {
  const wrap = el("article", "project");

  const head = el("div", "project__head");
  head.append(el("h1", "project__title", p.titulo));
  const meta = [p.cliente, p.tipo].filter(Boolean).join(" · ");
  if (meta) head.append(el("p", "project__meta", meta));
  wrap.append(head);

  (p.vimeo || []).forEach((id, i) => wrap.append(vimeoPlayer(id, p, i)));

  const stills = el("div", "stills");
  for (let i = 1; i <= (p.stills || 0); i++) {
    const img = el("img", "still");
    img.src = asset(p.slug, `${i}.webp`);
    img.alt = `${p.titulo} — still ${i}`;
    img.loading = "lazy";
    img.decoding = "async";
    stills.append(img);
  }
  wrap.append(stills);

  if (p.creditos) wrap.append(el("div", "credits", p.creditos));

  const back = el("a", "back", "← index");
  back.href = "/";
  back.dataset.link = "";
  wrap.append(back);

  app.replaceChildren(wrap);
}

/* Portada + play: el iframe de vimeo solo se crea al clicar. */
function vimeoPlayer(id, p, i) {
  const box = el("div", "player");
  box.setAttribute("role", "button");
  box.tabIndex = 0;
  box.setAttribute("aria-label", `play ${p.titulo}`);

  const poster = el("img");
  poster.src = asset(p.slug, i === 0 ? "poster.webp" : `${Math.min(i + 1, p.stills || 1)}.webp`);
  poster.alt = "";
  poster.loading = i === 0 ? "eager" : "lazy";
  box.append(poster, el("div", "player__play", "▶"));

  const open = () => {
    const iframe = el("iframe");
    iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.title = p.titulo;
    box.replaceChildren(iframe);
  };

  box.addEventListener("click", open);
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  return box;
}

/* ---------- about ---------- */

function aboutView() {
  const wrap = el("section", "about");
  wrap.append(el("h1", "project__title", data.meta.nombre));
  (data.meta.bio || "").split("\n\n").forEach((par) => wrap.append(el("p", null, par)));

  if (data.meta.clientes?.length) {
    wrap.append(el("p", "about__clients", `clients: ${data.meta.clientes.join(", ")}`));
  }
  if (data.meta.email) {
    const p = el("p");
    const a = el("a", null, data.meta.email);
    a.href = `mailto:${data.meta.email}`;
    p.append(a);
    wrap.append(p);
  }
  app.replaceChildren(wrap);
}

/* ---------- router ---------- */

function render() {
  cleanup.forEach((fn) => fn());
  cleanup = [];

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const slug = path.slice(1);

  nav.querySelectorAll("a").forEach((a) =>
    a.classList.toggle("is-active", a.getAttribute("href") === path)
  );

  if (path === "/") {
    document.title = data.meta.titulo || data.meta.nombre;
    homeView();
  } else if (slug === "about") {
    document.title = `about — ${data.meta.nombre}`;
    aboutView();
  } else {
    const p = bySlug(slug);
    if (!p) return notFound();
    document.title = `${p.titulo} — ${data.meta.nombre}`;
    projectView(p);
  }
  window.scrollTo(0, 0);
}

function notFound() {
  document.title = `404 — ${data.meta.nombre}`;
  const wrap = el("section", "about");
  wrap.append(el("h1", "project__title", "404"));
  const back = el("a", "back", "← index");
  back.href = "/";
  back.dataset.link = "";
  wrap.append(back);
  app.replaceChildren(wrap);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const href = a.getAttribute("href");
  if (href === location.pathname) return;
  history.pushState({}, "", href);
  render();
});

window.addEventListener("popstate", render);

fetch("/data.json")
  .then((r) => r.json())
  .then((json) => {
    data = json;
    render();
  })
  .catch(() => {
    app.replaceChildren(el("p", "loading", "no se ha podido cargar data.json"));
  });
