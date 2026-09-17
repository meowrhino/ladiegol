/* Ajustes globales y rutas.
   BASE sale de la url de este propio archivo, así la web funciona igual en
   ladiegol.com/ que en meowrhino.github.io/ladiegol/ sin tocar nada. */

export const BASE = new URL("../", import.meta.url).pathname;

export const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection?.saveData === true;

// si el usuario pide menos movimiento o va con ahorro de datos, nada de loops
export const loopsEnabled = !reducedMotion && !saveData;

export const href = (path = "") => BASE + path;
export const asset = (slug, file) => `${BASE}_PROJECTS/${slug}/${file}`;
