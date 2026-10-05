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

/* velocidad de los loops: meta.ralentizar_loops = 1 es la del gif,
   2 el doble de lento. Si falta o no es un número, la del gif. */
export const velocidadLoops = () => {
  const r = Number(data.meta.ralentizar_loops);
  return r > 0 ? 1 / r : 1;
};

// todos los loops disponibles, para el welcome
export const withLoop = () => visibles().filter((p) => p.loop !== false);

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
