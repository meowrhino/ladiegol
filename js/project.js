/* La página de un proyecto: el HTML viene del build; aquí, el reproductor. */

import { el } from "./dom.js";

/* Portada + play: el iframe de vimeo solo se crea al clicar, así la página
   no carga el reproductor (ni sus cookies) sin que nadie lo pida. */
export function project() {
  const titulo = document.querySelector(".project__title")?.textContent || "";
  document.querySelectorAll(".player[data-vimeo]").forEach((box) => {
    const id = box.dataset.vimeo;
    const open = () => {
      const iframe = el("iframe");
      iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.title = titulo;
      box.replaceChildren(iframe);
      // la caja es 16:9 de reserva; con la proporción real del video no quedan bandas
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=1920`)
        .then((r) => r.json())
        .then((v) => (box.style.aspectRatio = `${v.width} / ${v.height}`))
        .catch(() => {});
    };

    box.addEventListener("click", open);
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}
