/* ============================================================
   paginas.mjs — las plantillas de la web.
   ------------------------------------------------------------
   Todo el HTML sale de aquí, y lo usan dos sitios:

     build/build.mjs    en Node, al publicar: escribe dist/
     build/preview.mjs  en el navegador, con Live Server: pinta
                        la página al vuelo leyendo los JSON

   Por eso este fichero no importa nada ni toca el disco: lo que
   necesita saber del disco (si un fichero existe, cuánto mide una
   foto) se lo pasa quien lo llama.

   Es el mismo HTML que antes pintaba el JS (js/main.js, hasta
   octubre de 2026), con las mismas clases: el CSS no ha cambiado.
   El JS ahora solo añade cosas: el filtro, los loops, el welcome y
   el reproductor de Vimeo.
   ============================================================ */

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Lee un JSON y, si está mal, dice dónde (línea y columna). */
export function leerJSON(texto, nombre) {
  try { return JSON.parse(texto); }
  catch (e) {
    let donde = '';
    const lc = /line (\d+) column (\d+)/.exec(e.message);
    const pos = /position (\d+)/.exec(e.message);
    if (lc) donde = ` (línea ${lc[1]}, columna ${lc[2]})`;
    else if (pos) {
      const antes = texto.slice(0, +pos[1]).split('\n');
      donde = ` (línea ${antes.length}, columna ${antes.at(-1).length + 1})`;
    } else {
      // una coma de más ("Unexpected token ']'") no trae posición: se busca la coma
      const coma = /,\s*[\]}]/.exec(texto);
      if (coma) donde = ` (línea ${texto.slice(0, coma.index).split('\n').length}: sobra la coma del final)`;
    }
    const err = new Error(`${nombre} no es un JSON válido${donde}. Suele ser una coma de más `
      + `o de menos, o unas comillas sin cerrar. Detalle: ${e.message}`);
    err.json = true;
    throw err;
  }
}

/** Lo que dice schema/<tipo>.json, comprobado también aquí (copiado de oriol):
    lo que VS Code subraya en rojo, el build lo para y la vista previa lo enseña. */
export function validar(dato, esquema, fichero) {
  const TIPO = { string: 'un texto entre comillas', number: 'un número', boolean: 'true o false',
                 array: 'una lista [ … ]', object: 'un bloque { … }', null: 'null' };
  const tipo = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  // un $ref lleva a su $defs; lo de al lado (la description) manda
  const def = s => (s.$ref ? { ...esquema.$defs[s.$ref.split('/').pop()], ...s, $ref: undefined } : s);
  const tipoOk = (v, s) => !s.type || [].concat(s.type).includes(tipo(v));
  function mirar(v, s, camino) {
    s = def(s);
    const donde = camino.length ? `"${camino.join(' → ')}"` : 'el fichero';
    const pista = s.description ? ` (${s.description})` : '';
    if (s.anyOf) {
      const opciones = s.anyOf.map(def);
      if (opciones.some(o => !mirar(v, o, camino).length)) return [];
      const suya = opciones.find(o => tipoOk(v, o));
      return suya ? mirar(v, suya, camino) : [`${donde} no vale así${pista}`];
    }
    if (!tipoOk(v, s)) return [`${donde} tiene que ser ${[].concat(s.type).map(t => TIPO[t]).join(' o ')}${pista}`];
    const e = [];
    if (s.enum && !s.enum.includes(v)) e.push(`${donde}: "${v}" no vale; tiene que ser ${s.enum.map(x => `"${x}"`).join(', ')}`);
    if (s.pattern && typeof v === 'string' && !new RegExp(s.pattern).test(v)) e.push(`${donde}: "${v}" no tiene la forma que toca${pista}`);
    if (s.minimum != null && typeof v === 'number' && v < s.minimum) e.push(`${donde} tiene que ser ${s.minimum} o más`);
    if (Array.isArray(v)) {
      if (s.maxItems != null && v.length > s.maxItems) e.push(`${donde}: como mucho ${s.maxItems}`);
      if (s.items) v.forEach((x, i) => e.push(...mirar(x, s.items, [...camino, String(i + 1)])));
    } else if (tipo(v) === 'object') {
      for (const r of s.required || []) if (!(r in v)) e.push(`falta "${r}"${camino.length ? ` en ${donde}` : ''}`);
      for (const [k, x] of Object.entries(v)) {
        if (s.properties?.[k]) e.push(...mirar(x, s.properties[k], [...camino, k]));
        else if (typeof s.additionalProperties === 'object') e.push(...mirar(x, s.additionalProperties, [...camino, k]));
        else if (s.additionalProperties === false) {
          const hay = Object.keys(s.properties || {}).filter(p => p !== '$schema' && p !== '_');
          e.push(`"${[...camino, k].join(' → ')}" no es un campo de aquí (¿mal escrito?). Los que hay: ${hay.join(', ')}`);
        }
      }
    }
    return e;
  }
  return mirar(dato, esquema, []).map(m => `${fichero}: ${m}`);
}

/* Las direcciones que ya usa la web: un proyecto no se puede llamar así. */
const RESERVADAS = ['about', 'welcome', 'welcome-loop', 'welcome-stills', 'projects', 'data',
  'css', 'js', 'fonts', 'img', 'og', 'build', 'schema', 'tools'];

/* ============================================================
   crearSitio — todo lo que depende de los datos
   ------------------------------------------------------------
     site          data/site.json
     about         data/about.json
     projects      { slug: projects/<slug>/project.json }
     base          subcarpeta donde se sirve ('' o '/ladiegol')
     origen        el dominio de las direcciones públicas, sin barra final
     indexar       si Google la puede indexar (no en github.io)
     medida(rel)   { w, h } de una foto, o null
     existe(rel)   si un fichero está (el loop de cada proyecto)
     og(rel)       la imagen para compartir (1200×630) de esa foto, o null
     preview       true en la vista previa: los enlaces van a ?p=/ruta/
   ============================================================ */
export function crearSitio({ site, about = {}, projects, base = '', origen = '', indexar: INDEXAR = false,
  medida = () => null, existe = () => true, og = () => null, preview = false }) {
  const B = String(base).replace(/\/$/, '');
  const NOMBRE = site.name || '';

  /** Una entrada de la lista: "slug", o { "project": "slug", "visible": false }
      para uno oculto (tiene su página para mandarla en privado, pero no sale
      en la home ni en el sitemap). */
  const entrada = e => (e && typeof e === 'object' ? { slug: e.project, visible: e.visible !== false } : { slug: e, visible: true });
  const entradas = Object.values(site.lists || {}).flatMap(l => (Array.isArray(l?.projects) ? l.projects : []).map(entrada));
  const preparar = ({ slug, visible }) => {
    const p = projects[slug];
    const photos = (Array.isArray(p.photos) ? p.photos : []).map(String);
    return { ...p, slug, oculto: !visible, photos, cover: String(p.cover ?? photos[0] ?? '1') };
  };
  const vistos = new Set();
  const todos = entradas.filter(e => typeof e.slug === 'string' && projects[e.slug] && !vistos.has(e.slug) && vistos.add(e.slug))
    .map(preparar);
  const publicados = todos.filter(p => !p.oculto);

  /* ---------- direcciones ---------- */
  const raiz = p => B + (p.startsWith('/') ? p : '/' + p);
  const url = (ruta = '/') => (preview ? `${B}/?p=${ruta}` : B + ruta);
  const publica = p => origen + B + (p.startsWith('/') ? p : '/' + p);
  const foto = (slug, n) => `projects/${slug}/img/${n}.webp`;
  const loop = slug => `projects/${slug}/img/loop.webm`;
  const FOTO_ABOUT = 'data/about/1.webp';
  const wh = rel => { const m = medida(rel); return m ? ` width="${m.w}" height="${m.h}"` : ''; };

  /* La transición entre páginas, la de la casa (JAMstack, patrones.md §6c),
     copiada tal cual de almarbra: js/transicion.js, css/transicion.css y este
     script, que tapa la página antes de pintar si se llega desde otra de la
     web. Sin dibujo propio: un fundido al negro y el cuadradito que late. */
  const headScript = `<script>{
const html = document.documentElement;
html.classList.add('js');
let back = false;
try {
  const d = JSON.parse(sessionStorage.getItem('transicion'));
  back = !d && performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  if (d?.carga) html.style.setProperty('--carga', d.carga);   // el color del loader, del dibujo
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && (back || d)) html.classList.add('tapada');
} catch {}
window.revelada = ${preview ? 'false' : "'onpagereveal' in window"} ? new Promise((done) => addEventListener('pagereveal', (e) => {
  const vt = e.viewTransition;
  if (vt && back && html.classList.contains('tapada')) { html.classList.add('tapando'); done(vt); }
  else { vt?.ready.catch(() => {}); vt?.skipTransition(); done(null); }   // saltarla rechaza ready: sin error en la consola
}, { once: true })) : Promise.resolve(null);
}</script>`;

  /** La página entera. vista: home, about, project o welcome (el CSS cuelga de
      body[data-vista]). nav: el enlace de arriba (about, back o home). */
  function pagina({ ruta, titulo, desc = site.description, imagen, vista, nav, main, extra = '', oculto = false }) {
    const o = imagen && og(imagen);
    const indexar = INDEXAR && !oculto;
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="theme-color" content="#000000" />
  ${indexar ? '' : '<meta name="robots" content="noindex" />\n  '}<link rel="canonical" href="${publica(ruta)}" />

  <meta property="og:type" content="${vista === 'project' ? 'article' : 'website'}" />
  <meta property="og:title" content="${esc(titulo)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${publica(ruta)}" />
  <meta property="og:site_name" content="${esc(NOMBRE)}" />
  ${o ? `<meta property="og:image" content="${publica('/' + o)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : imagen ? `<meta property="og:image" content="${publica('/' + imagen)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="icon" href="${raiz('/img/icon.png')}" type="image/png" />
  <link rel="apple-touch-icon" href="${raiz('/img/icon.png')}" />
  <link rel="preload" href="${raiz('/fonts/dm-sans-400.woff2')}" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="${raiz('/fonts/wild-trave-rounded.woff2')}" as="font" type="font/woff2" crossorigin />
  ${headScript}
  <link rel="stylesheet" href="${raiz('/css/transicion.css')}" />
  <link rel="stylesheet" href="${raiz('/css/base.css')}" />
  <link rel="stylesheet" href="${raiz('/css/home.css')}" />
  <link rel="stylesheet" href="${raiz('/css/project.css')}" />
  <link rel="stylesheet" href="${raiz('/css/welcome.css')}" />
  <script type="module" src="${raiz('/js/main.js')}"></script>
  <script src="${raiz('/js/transicion.js')}" defer></script>
</head>
<body data-vista="${vista}" data-loop-slowdown="${esc(site.loopSlowdown ?? 1)}">${extra}
  <header class="site-header">
    <a class="wordmark" href="${url('/about/')}" title="about">${esc(NOMBRE)}</a>
    <nav class="site-nav">${nav}</nav>
  </header>

  <main id="app" class="app" aria-live="polite">${main}</main>
</body>
</html>
`;
  }
  const navA = (ruta, txt) => `<a class="site-nav__index" href="${url(ruta)}">${txt}</a>`;

  /* ---------- el welcome ----------
     Lo pinta el JS (js/welcome.js) con lo que va en este bloque: el nombre,
     el modo y las fotos y loops del pase. Sale en la home la primera vez de
     cada visita y en /welcome, /welcome-loop y /welcome-stills. */
  const fotosWelcome = () => {
    const lista = site.welcome?.photos;
    const pares = Array.isArray(lista) && lista.length
      ? lista.map(s => String(s).split('/')).filter(([slug, n]) => publicados.some(p => p.slug === slug) && n)
      : publicados.flatMap(p => p.photos.map(n => [p.slug, n]));
    return pares.map(([slug, n]) => ({ slug, src: raiz('/' + foto(slug, n)) }));
  };
  const datosWelcome = modo => `<script type="application/json" id="welcome">${JSON.stringify({
    name: NOMBRE,
    mode: modo,
    home: url('/'),
    stills: fotosWelcome(),
    loops: publicados.filter(p => existe(loop(p.slug))).map(p => raiz('/' + loop(p.slug))),
    covers: publicados.map(p => raiz('/' + foto(p.slug, p.cover))),
  }).replace(/</g, '\\u003c')}</script>`;
  /* En la home, el <body> pasa a welcome antes de pintar si aún no se ha visto
     en esta visita (sessionStorage): así la home no asoma debajo. */
  const welcomeEnHome = `
  <script>{ let visto = null; try { visto = sessionStorage.getItem('welcome-visto'); } catch {} if (!visto) document.body.dataset.vista = 'welcome'; }</script>`;

  /* ---------- home ---------- */
  function home() {
    let grandes = 0;
    const tiles = publicados.map(p => {
      let cls = 'tile';
      if (p.featured) cls += grandes++ % 2 === 1 ? ' tile--big tile--right' : ' tile--big';
      const cliente = p.client || '', titulo = p.title || '';
      // si el título repite el nombre del cliente (coches.net) no lo ponemos dos veces
      const rotulo = `<span>${esc(cliente)}</span>${titulo.toLowerCase() !== cliente.toLowerCase() ? `<span>${esc(titulo)}</span>` : ''}`;
      const still = foto(p.slug, p.cover);
      return `<a class="${cls}" href="${url(`/${p.slug}/`)}" data-tipo="${esc(p.type || '')}" aria-label="${esc(`${cliente} — ${titulo}`)}">`
        + `<div class="tile__meta">${rotulo}</div>`
        + `<div class="tile__media"><img class="tile__still" src="${raiz('/' + still)}" alt="${esc(`${cliente} — ${titulo}`)}"${wh(still)} loading="lazy" decoding="async" />`
        + (existe(loop(p.slug)) ? `<video class="tile__loop" muted loop playsinline preload="none" aria-hidden="true" data-webm="${raiz('/' + loop(p.slug))}"></video>` : '')
        + `</div></a>`;
    });
    // all + un botón por cada tipo (commercial, music video…); el JS los conecta
    const tipos = [...new Set(publicados.map(p => p.type).filter(Boolean))];
    const filtro = `<nav class="filtro" aria-label="filter">${['', ...tipos].map(t =>
      `<button class="filtro__op" type="button" aria-pressed="${!t}"${t ? ` data-tipo="${esc(t)}"` : ''}>${esc(t || 'all')}</button>`).join('')}</nav>`;
    return pagina({
      ruta: '/', titulo: site.title || NOMBRE, vista: 'home', imagen: publicados[0] && foto(publicados[0].slug, publicados[0].cover),
      nav: navA('/about/', 'about'),
      extra: site.welcome?.on ? welcomeEnHome + datosWelcome(site.welcome.mode) : '',
      main: `<div class="home">${filtro}<div class="grid">\n${tiles.join('\n')}\n</div></div>`,
    });
  }

  /* ---------- about ---------- */
  const parrafos = v => (Array.isArray(v) ? v : v ? [v] : []);
  function aboutPagina() {
    const insta = String(site.social?.instagram || '');
    const main = `<section class="about">`
      + `<div class="about__media"><img src="${raiz('/' + FOTO_ABOUT)}" alt=""${wh(FOTO_ABOUT)} decoding="async" /><div class="welcome__veil about__veil"></div></div>`
      + parrafos(about.text).map(p => `<p>${esc(p)}</p>`).join('')
      + (about.clients?.length ? `<p class="about__clients">clients: ${esc(about.clients.join(', '))}</p>` : '')
      + (site.email ? `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>` : '')
      + (insta ? `<p><a href="https://instagram.com/${esc(insta.replace('@', ''))}" target="_blank" rel="noopener">${esc(insta)}</a></p>` : '')
      + `<p class="about__credito">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p>`
      + `</section>`;
    const desc = parrafos(about.text)[0] || site.description;
    return pagina({ ruta: '/about/', titulo: `about — ${NOMBRE}`, desc: corto(desc), imagen: FOTO_ABOUT,
      vista: 'about', nav: navA('/', 'home'), main });
  }
  /** 155 letras para la description. */
  const corto = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= 155 ? t : t.slice(0, 152).replace(/\s+\S*$/, '') + '…'; };

  /* ---------- proyecto ---------- */
  function proyecto(p) {
    const titulo = p.title || '';
    // el reproductor: la portada + play; el iframe de Vimeo lo pone el JS al clicar
    // (el primer video lleva la portada; los siguientes, las fotos que vienen después)
    const players = (p.vimeo || []).map((id, i) => {
      const poster = foto(p.slug, i === 0 ? p.cover : p.photos[Math.min(i, p.photos.length - 1)] || p.cover);
      return `<div class="player" role="button" tabindex="0" aria-label="${esc(`play ${titulo}`)}" data-vimeo="${esc(id)}">`
        + `<img src="${raiz('/' + poster)}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" /><div class="player__play">▶</div></div>`;
    }).join('');
    const ficha = [p.client, p.type].filter(Boolean).join(' · ');
    const stills = p.photos.map((n, i) => {
      const rel = foto(p.slug, n);
      return `<img class="still" src="${raiz('/' + rel)}" alt="${esc(`${titulo} — still ${i + 1}`)}"${wh(rel)} loading="lazy" decoding="async" />`;
    }).join('\n');
    return pagina({
      ruta: `/${p.slug}/`, titulo: `${titulo} — ${NOMBRE}`, oculto: p.oculto,
      desc: corto(p.description || `${titulo}${ficha ? ` (${ficha.toLowerCase()})` : ''}. ${site.description}`),
      imagen: foto(p.slug, p.cover), vista: 'project', nav: navA('/', 'back'),
      main: `<article class="project">${players}<div class="project__head"><h1 class="project__title">${esc(titulo)}</h1>`
        + `${ficha ? `<p class="project__meta">${esc(ficha)}</p>` : ''}</div>`
        + `<div class="stills">\n${stills}\n</div><a class="back" href="${url('/')}">← back</a></article>`,
    });
  }

  /* ---------- welcome suelto, para comparar los dos modos ---------- */
  const welcomeSuelto = (ruta, modo) => pagina({
    ruta, titulo: `welcome — ${NOMBRE}`, vista: 'welcome', oculto: true, nav: navA('/', 'home'),
    extra: datosWelcome(modo), main: '',
  });

  function noEncontrada() {
    return pagina({ ruta: '/404/', titulo: `404 — ${NOMBRE}`, vista: 'project', oculto: true, nav: navA('/', 'home'),
      main: `<section class="about"><h1 class="project__title">404</h1><a class="back" href="${url('/')}">← home</a></section>` });
  }

  /** Todas las páginas: { ruta, oculto, pintar() }. */
  function rutas() {
    return [
      { ruta: '/', pintar: home },
      { ruta: '/about/', pintar: aboutPagina },
      ...todos.map(p => ({ ruta: `/${p.slug}/`, oculto: p.oculto, pintar: () => proyecto(p) })),
      ...[['welcome', site.welcome?.mode || 'loop'], ['welcome-loop', 'loop'], ['welcome-stills', 'stills']]
        .map(([r, modo]) => ({ ruta: `/${r}/`, oculto: true, pintar: () => welcomeSuelto(`/${r}/`, modo) })),
    ];
  }

  /** Lo que el esquema no ve: lo grave (✗) para el build, lo demás avisa (⚠).
      [{ grave, quien, texto }] */
  function revisar() {
    const a = [];
    const mal = (quien, texto) => a.push({ grave: true, quien, texto });
    const ojo = (quien, texto) => a.push({ grave: false, quien, texto });
    const contados = new Map();
    for (const e of entradas) {
      const quien = 'data/site.json → lists';
      if (typeof e.slug !== 'string' || !e.slug) { mal(quien, 'hay una entrada sin nombre de proyecto'); continue; }
      contados.set(e.slug, (contados.get(e.slug) || 0) + 1);
      if (!projects[e.slug]) mal(quien, `"${e.slug}" no tiene carpeta (projects/${e.slug}/project.json). ¿Está bien escrito?`);
      if (RESERVADAS.includes(e.slug)) mal(quien, `"${e.slug}" no puede ser el nombre de un proyecto: ya es una página o una carpeta de la web`);
    }
    for (const [slug, n] of contados) if (n > 1) mal('data/site.json → lists', `"${slug}" sale ${n} veces`);
    for (const p of todos) {
      const quien = `projects/${p.slug}/project.json`;
      if (!p.photos.length) ojo(quien, 'no tiene fotos en "photos"');
      for (const n of new Set([...p.photos, p.cover]))
        if (!existe(foto(p.slug, n))) mal(quien, `la foto "${n}" no está: falta projects/${p.slug}/img/${n}.webp`);
      if (!existe(loop(p.slug))) ojo(quien, 'no tiene loop (img/loop.webm): en la home sale solo la foto');
      if (!(p.vimeo || []).length) ojo(quien, 'no tiene video ("vimeo")');
    }
    for (const s of site.welcome?.photos || []) {
      const [slug, n] = String(s).split('/');
      if (!n || !publicados.some(p => p.slug === slug)) mal('data/site.json → welcome → photos', `"${s}" no vale: tiene que ser "proyecto/número" de un proyecto de la lista`);
      else if (!existe(foto(slug, n))) mal('data/site.json → welcome → photos', `"${s}": falta projects/${slug}/img/${n}.webp`);
    }
    if (!existe(FOTO_ABOUT)) mal('about', `falta la foto del about: ${FOTO_ABOUT}`);
    return a;
  }

  return { rutas, noEncontrada, revisar, publica, publicados, todos };
}
