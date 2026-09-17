/* La página de un proyecto: ficha, videos de vimeo y galería de stills. */

import { asset, href } from "./config.js";
import { el, link } from "./dom.js";

export function project(p) {
  const wrap = el("article", "project");

  // primero el video, que es lo importante; luego la ficha; luego las fotos
  (p.vimeo || []).forEach((id, i) => wrap.append(player(id, p, i)));

  const head = el("div", "project__head");
  head.append(el("h1", "project__title", p.titulo));
  const ficha = [p.cliente, p.tipo].filter(Boolean).join(" · ");
  if (ficha) head.append(el("p", "project__meta", ficha));
  wrap.append(head);

  const stills = el("div", "stills");
  for (let i = 1; i <= (p.stills || 0); i++) {
    const img = el("img", "still");
    img.src = asset(p.slug, `${i}.webp`);
    img.alt = `${p.titulo} — still ${i}`;
    img.loading = "lazy";
    img.decoding = "async";
    stills.append(img);
  }
  wrap.append(stills, link("back", href(), "← index"));

  return { node: wrap };
}

/* Portada + play: el iframe de vimeo solo se crea al clicar, así la página
   no carga el reproductor (ni sus cookies) sin que nadie lo pida. */
function player(id, p, i) {
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
