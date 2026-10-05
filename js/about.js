/* El about: bio y clientes, tal cual salen de data.json, encima del mismo
   pase de stills del welcome, oscurecido. */

import { el, link } from "./dom.js";
import { meta } from "./data.js";
import { href } from "./config.js";
import { runStills } from "./welcome.js";

export function about() {
  const m = meta();
  const wrap = el("section", "about");

  const media = el("div", "about__media");
  const layers = [0, 1].map(() => {
    const img = el("img", "welcome__slot");
    img.alt = "";
    img.decoding = "async";
    return img;
  });
  media.append(...layers, el("div", "welcome__veil about__veil"));
  wrap.append(media);
  wrap.append(el("h1", "project__title", m.nombre));

  (m.bio || "").split("\n\n").forEach((par) => wrap.append(el("p", null, par)));

  if (m.clientes?.length) {
    wrap.append(el("p", "about__clients", `clients: ${m.clientes.join(", ")}`));
  }
  if (m.email) {
    const p = el("p");
    const a = el("a", null, m.email);
    a.href = `mailto:${m.email}`;
    p.append(a);
    wrap.append(p);
  }
  if (m.instagram) {
    const p = el("p");
    const a = el("a", null, m.instagram);
    a.href = `https://instagram.com/${m.instagram.replace("@", "")}`;
    a.target = "_blank";
    a.rel = "noopener";
    p.append(a);
    wrap.append(p);
  }

  wrap.append(link("back", href(), "← home"));
  return { node: wrap, mounted: () => runStills(layers) };
}
