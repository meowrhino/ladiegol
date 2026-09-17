/* Cuatro ayudas para no escribir document.createElement mil veces. */

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

export function link(cls, path, text) {
  const a = el("a", cls, text);
  a.href = path;
  a.dataset.link = "";
  return a;
}

export const shuffled = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
