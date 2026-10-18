/* ============================================================
   preview.mjs — la web entera sin build, para Live Server.
   ------------------------------------------------------------
   La web de verdad no existe hasta que el build la escribe en
   dist/. Esto la pinta al vuelo con las mismas plantillas
   (paginas.mjs). La página va en ?p=:   /?p=/aftermatch/
   ============================================================ */
import { crearSitio, leerJSON, validar, esc } from './paginas.mjs';

const BASE = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
const pedir = async ruta => {
  const r = await fetch(`${BASE}/${ruta}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`no encuentro ${ruta}`);
  return r.text();
};
const escribir = html => { document.open(); document.write(html); document.close(); };
const error = (titulo, texto) => escribir(`<!doctype html><meta charset="utf-8"><title>vista previa — error</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="margin:0;padding:clamp(24px,6vw,80px);font:18px/1.5 system-ui,sans-serif;background:#000;color:#ededed">
<h1 style="font-weight:400;color:#ff6b5e">${esc(titulo)}</h1><p style="max-width:62ch;white-space:pre-line">${esc(texto)}</p>
<p style="color:#8a8a8a">Arréglalo, guarda, y esta página se recarga sola.</p></body>`);

/* ¿Existe este fichero? Se pregunta al servidor con HEAD, que no lo baja. */
const hay = new Map();
const preguntar = rutas => Promise.all([...rutas].filter(r => !hay.has(r)).map(async r => {
  try { hay.set(r, (await fetch(`${BASE}/${encodeURI(r)}`, { method: 'HEAD', cache: 'no-store' })).ok); }
  catch { hay.set(r, false); }
}));

async function arrancar() {
  let site, about;
  const projects = {};
  try {
    site = leerJSON(await pedir('data/site.json'), 'data/site.json');
    about = leerJSON(await pedir('data/about.json'), 'data/about.json');
    // el navegador no puede listar carpetas: se piden las que nombra la lista
    const slugs = new Set(Object.values(site.lists || {}).flatMap(l => (Array.isArray(l?.projects) ? l.projects : []))
      .map(e => (e && typeof e === 'object' ? e.project : e)).filter(e => typeof e === 'string'));
    await Promise.all([...slugs].map(async slug => {
      const f = `projects/${slug}/project.json`;
      let txt;
      try { txt = await pedir(f); } catch { return; }   // no está: lo dice la revisión
      projects[slug] = leerJSON(txt, f);
    }));
    /* lo mismo que comprueba el build con schema/ (en VS Code, subrayado en rojo) */
    const esquemas = {};
    for (const t of ['site', 'about', 'project']) esquemas[t] = JSON.parse(await pedir(`schema/${t}.json`));
    const errores = [...validar(site, esquemas.site, 'data/site.json'), ...validar(about, esquemas.about, 'data/about.json'),
      ...Object.entries(projects).flatMap(([slug, p]) => validar(p, esquemas.project, `projects/${slug}/project.json`))];
    if (errores.length) return error('Hay algo mal en un JSON', errores.map(e => `✗ ${e}`).join('\n'));
  } catch (e) { return error(e.json ? 'Hay un error en un JSON' : 'No puedo leer los datos', e.message); }

  /* Las plantillas preguntan "¿existe este fichero?" de forma síncrona, y al
     servidor solo se le puede preguntar de forma asíncrona: se revisa en seco
     apuntando lo que se pregunta, se pregunta todo de una vez, y se pinta. */
  const nuevas = new Set();
  crearSitio({ site, about, projects, existe: r => (nuevas.add(r), true) }).revisar();
  await preguntar(nuevas);
  const sitio = crearSitio({ site, about, projects, base: BASE, preview: true, existe: r => hay.get(r) === true });

  let pedida = new URLSearchParams(location.search).get('p') || '/';
  if (!pedida.startsWith('/')) pedida = '/' + pedida;
  if (!pedida.endsWith('/')) pedida += '/';
  const pagina = sitio.rutas().find(r => r.ruta === pedida);
  if (!pagina) return error('Esta página no existe', `No hay ninguna página en ${pedida}. Si es un proyecto, mira que esté en data/site.json → lists y que el nombre de su carpeta esté bien escrito.`);

  /* Lo que mira el build: lo grave (✗, una foto que no está…) no se
     publicaría, así que sale en vez de la página; los avisos (⚠), en una
     franja arriba. En la consola no lo mira nadie. */
  const avisos = sitio.revisar();
  const graves = avisos.filter(a => a.grave);
  if (graves.length) return error('Esto no se publicaría', graves.map(a => `✗ ${a.quien}: ${a.texto}`).join('\n'));
  escribir(pagina.pintar());
  if (avisos.length) {
    const franja = `<div style="position:fixed;inset:0 0 auto;z-index:20;padding:8px 12px;background:#fff3c4;color:#5c4400;`
      + `font:13px/1.4 system-ui,sans-serif;max-height:30vh;overflow:auto">`
      + avisos.map(a => `⚠ ${esc(a.quien)}: ${esc(a.texto)}`).join('<br>')
      + ` <button onclick="this.parentNode.remove()" style="font:inherit">cerrar</button></div>`;
    // la página recién escrita aún se monta: la franja, cuando haya <body>
    if (document.body) document.body.insertAdjacentHTML('afterbegin', franja);
    else document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin', franja), { once: true });
  }
}

arrancar().catch(e => error('La vista previa ha fallado', e.message));
