/* Ajustes globales. */

export const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection?.saveData === true;

// si el usuario pide menos movimiento o va con ahorro de datos, nada de loops
export const loopsEnabled = !reducedMotion && !saveData;

/* velocidad de los loops: site.json → loopSlowdown = 1 es la del gif,
   2 el doble de lento (el build lo deja en <body data-loop-slowdown>).
   Si falta o no es un número, la del gif. */
export const velocidadLoops = () => {
  const r = Number(document.body.dataset.loopSlowdown);
  return r > 0 ? 1 / r : 1;
};
