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

// [{slug, n}] de todos los stills, para el welcome en modo stills
export const allStills = () =>
  visibles().flatMap((p) =>
    Array.from({ length: p.stills || 0 }, (_, i) => ({ slug: p.slug, n: i + 1 }))
  );
