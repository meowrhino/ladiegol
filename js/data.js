/* Carga y consulta de data.json. */

import { href } from "./config.js";

let data = null;

export async function load() {
  data = await fetch(href("data.json")).then((r) => r.json());
  return data;
}

export const meta = () => data.meta;
export const visibles = () => data.projects.filter((p) => p.visible !== false);
export const bySlug = (slug) => data.projects.find((p) => p.slug === slug);

// todos los loops disponibles, para el welcome
export const withLoop = () => visibles().filter((p) => p.loop !== false);

/* Los loops pueden salir del vídeo (hover.webm) o del gif (hover.webp).
   Lo decide meta.loops en data.json ("video" o "gif"); para comparar sin tocar
   el json, ?loops=gif o ?loops=video en la url manda sobre lo del json. */
const loopsUrl = new URLSearchParams(location.search).get("loops");
export const loopFormat = () => ((loopsUrl || data.meta.loops) === "gif" ? "gif" : "video");

/* [{slug, n}] de los stills del welcome: los que diga meta.welcome.stills
   ("slug/n") o, si no hay lista, todos los de todos los proyectos. */
export const welcomeStills = () => {
  const lista = data.meta.welcome?.stills;
  if (lista?.length) {
    return lista
      .map((s) => s.split("/"))
      .filter(([slug, n]) => bySlug(slug) && Number(n) > 0)
      .map(([slug, n]) => ({ slug, n: Number(n) }));
  }
  return visibles().flatMap((p) =>
    Array.from({ length: p.stills || 0 }, (_, i) => ({ slug: p.slug, n: i + 1 }))
  );
};
