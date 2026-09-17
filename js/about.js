/* El about: bio y clientes, tal cual salen de data.json. */

import { el, link } from "./dom.js";
import { meta } from "./data.js";
import { href } from "./config.js";

export function about() {
  const m = meta();
  const wrap = el("section", "about");
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

  wrap.append(link("back", href(), "← index"));
  return { node: wrap };
}
