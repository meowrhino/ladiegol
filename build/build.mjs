/* ============================================================
   build.mjs — lee data/ y projects/ y escribe la web en dist/.
   Sin dependencias salvo sharp (las imágenes para compartir). Las
   plantillas están en paginas.mjs, el mismo fichero que usa la
   vista previa de Live Server.
       node build/build.mjs
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearSitio, leerJSON, validar } from './paginas.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');
const salir = msg => { console.error(`\n${msg}\n`); process.exit(1); };

/* Cada JSON se lee y se comprueba con su esquema (schema/), el mismo con el
   que VS Code subraya lo que está mal. */
const esquema = tipo => JSON.parse(readFileSync(join(ROOT, 'schema', tipo + '.json'), 'utf8'));
const errores = [];
const leer = (rel, tipo) => {
  const d = leerJSON(readFileSync(join(ROOT, rel), 'utf8'), rel);
  errores.push(...validar(d, esquema(tipo), rel));
  return d;
};
let site, about;
const projects = {};
try {
  site = leer('data/site.json', 'site');
  about = leer('data/about.json', 'about');
  // un proyecto, una carpeta: projects/<slug>/project.json + img/
  for (const slug of readdirSync(join(ROOT, 'projects')).sort()) {
    if (slug.startsWith('.')) continue;
    const f = `projects/${slug}/project.json`;
    if (existsSync(join(ROOT, f))) projects[slug] = leer(f, 'project');
    else console.warn(`⚠ projects/${slug}: no tiene project.json, no se publica`);
  }
} catch (e) { salir(`✗ ${e.message}`); }
if (errores.length) salir(errores.map(e => `✗ ${e}`).join('\n')
  + '\n\nNo se publica nada hasta que se arregle (en VS Code sale subrayado en rojo).');

/* Dónde se publica, según dónde se construye (JAMstack, patrones.md §5): en
   la Action de GitHub (nuestra copia), meowrhino.github.io/ladiegol/ y sin
   indexar; en cualquier otro sitio (Cloudflare, la copia de LA DIEGOL), la
   raíz y el dominio de site.json → "url", y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'meowrhino/ladiegol').split('/');
const base = github ? `/${repo}` : '';
const origen = github ? `https://${owner}.github.io` : String(site.url || '').replace(/\/$/, '');
const indexar = !github && !!site.url;

/** Ancho y alto de un webp, de su cabecera: van al <img> para que el
    navegador reserve el hueco antes de que baje la foto. */
const medidas = new Map();
function medida(rel) {
  if (medidas.has(rel)) return medidas.get(rel);
  let r = null;
  try {
    const b = readFileSync(join(ROOT, rel));
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const tipo = b.toString('ascii', 12, 16);
      if (tipo === 'VP8X') r = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      else if (tipo === 'VP8 ') r = { w: b.readUInt16LE(26) & 0x3FFF, h: b.readUInt16LE(28) & 0x3FFF };
      else if (tipo === 'VP8L') { const v = b.readUInt32LE(21); r = { w: 1 + (v & 0x3FFF), h: 1 + ((v >> 14) & 0x3FFF) }; }
    }
  } catch { /* no está o no se puede leer: sin medidas */ }
  medidas.set(rel, r);
  return r;
}

/* La imagen para compartir (og:image): 1200×630 en JPG, que es lo que
   esperan WhatsApp, Instagram y compañía. Las fotos horizontales llenan el
   recuadro (recortando lo que sobra); las verticales caben enteras, sobre
   negro. Las hace el build con sharp (npm ci) en .cache/og/, con un nombre
   según la foto, y solo las rehace si la foto cambia. Sin sharp se comparte
   la foto tal cual y se avisa. Las plantillas piden la og mientras pintan, y
   sharp va aparte: una primera pasada apunta cuáles hacen falta, se hacen, y
   se pinta. */
const ogNom = rel => createHash('sha1').update(rel).digest('hex').slice(0, 12) + '.jpg';
const ogHechas = new Map();   // foto → og/<nom>.jpg, las que están
async function hacerOgs(rels) {
  let sharp = null;
  for (const rel of rels) {
    const cache = join(ROOT, '.cache', 'og', ogNom(rel));
    if (!(existsSync(cache) && statSync(cache).mtimeMs >= statSync(join(ROOT, rel)).mtimeMs)) {
      try {
        sharp ??= (await import('sharp')).default;
        const m = medida(rel);
        mkdirSync(dirname(cache), { recursive: true });
        await sharp(join(ROOT, rel))
          .resize(1200, 630, m && m.w / m.h >= 1.2 ? { fit: 'cover' } : { fit: 'contain', background: '#000' })
          .flatten({ background: '#000' }).jpeg({ quality: 85, mozjpeg: true }).toFile(cache);
      } catch (e) {
        console.warn(`⚠ sin sharp (${e.code || e.message}): al compartir sale la foto tal cual. Se arregla con: npm ci`);
        return;
      }
    }
    ogHechas.set(rel, `og/${ogNom(rel)}`);
  }
}

/* La portada de cada video: su miniatura en Vimeo (la que eligió ella allí,
   así siempre es de ese video), pedida a oEmbed y guardada en webp en
   .cache/vimeo/. Sin red, sale la foto de portada y se avisa.
   shortcut: en local se baja una vez; si cambia la miniatura en Vimeo, borrar
   .cache/vimeo/ (en la Action y en Cloudflare se baja siempre). */
const posters = new Map();   // id → { src, w, h }
async function hacerPosters(ids) {
  let sharp = null;
  for (const id of ids) {
    const rel = `.cache/vimeo/${id}.webp`;
    try {
      if (!existsSync(join(ROOT, rel))) {
        const pedir = async u => { const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`${r.status} en ${u}`); return r; };
        const o = await (await pedir(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`)).json();
        const jpg = Buffer.from(await (await pedir(o.thumbnail_url.replace(/-d_[\dx]+/, '-d_1920'))).arrayBuffer());
        sharp ??= (await import('sharp')).default;
        mkdirSync(join(ROOT, '.cache', 'vimeo'), { recursive: true });
        await sharp(jpg).webp({ quality: 85 }).toFile(join(ROOT, rel));
      }
      posters.set(id, { src: `vimeo/${id}.webp`, ...medida(rel) });
    } catch (e) {
      console.warn(`⚠ vimeo ${id}: sin su miniatura (${e.message}); sale la foto de portada`);
    }
  }
}

const existe = rel => existsSync(join(ROOT, rel));
const opciones = { site, about, projects, base, origen, indexar, medida, existe };

/* Lo que el esquema no ve (mirar el disco): lo grave para y no se publica
   nada, para no dejar una foto rota en la web; lo demás solo avisa. */
const avisos = crearSitio(opciones).revisar();
const enLista = new Set(crearSitio(opciones).todos.map(p => p.slug));
for (const slug of Object.keys(projects)) if (!enLista.has(slug))
  avisos.push({ grave: false, quien: `projects/${slug}`, texto: 'no está en data/site.json → lists: no se publica' });
for (const a of avisos) console.warn(`${a.grave ? '✗' : '⚠'} ${a.quien}: ${a.texto}`);
if (avisos.some(a => a.grave)) salir('✗ Hay errores (los marcados con ✗). No se publica nada hasta que se arreglen;'
  + ' la vista previa (Live Server) te los enseña igual.');

const pedidas = new Set();
const prueba = crearSitio({ ...opciones, og: rel => (pedidas.add(rel), null) });
for (const r of prueba.rutas()) r.pintar();
await hacerOgs(pedidas);
await hacerPosters([...new Set(prueba.todos.flatMap(p => p.vimeo || []))]);
const sitio = crearSitio({ ...opciones, og: rel => ogHechas.get(rel) ?? null, poster: id => posters.get(id) ?? null });

/* ---------- escribir ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const dir of ['css', 'js', 'fonts', 'img']) cpSync(join(ROOT, dir), join(OUT, dir), { recursive: true });
// las fotos y loops de projects/ y la foto del about, sin los JSON (ya van dentro del HTML)
const sinJSON = src => !src.endsWith('.json') && !src.endsWith('.DS_Store');
for (const dir of ['projects', 'data']) cpSync(join(ROOT, dir), join(OUT, dir), { recursive: true, filter: sinJSON });
cpSync(join(ROOT, '_headers'), join(OUT, '_headers'));   // la caché, en Cloudflare
mkdirSync(join(OUT, 'og'), { recursive: true });
for (const o of ogHechas.values()) cpSync(join(ROOT, '.cache', 'og', o.slice(3)), join(OUT, o));
for (const v of posters.values()) cpSync(join(ROOT, '.cache', v.src), join(OUT, v.src));

const rutas = sitio.rutas();
for (const r of rutas) {
  const f = join(OUT, r.ruta, 'index.html');
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, r.pintar());
}
/* Las direcciones viejas, en Cloudflare: las de _redirects (fotos y data.json
   de antes) y cada página sin la barra del final (/aftermatch → /aftermatch/),
   para que sea un 301 y no el 307 que Cloudflare pone solo. GitHub Pages no lee
   este fichero (allí /aftermatch ya va a /aftermatch/ con 301). */
writeFileSync(join(OUT, '_redirects'), readFileSync(join(ROOT, '_redirects'), 'utf8')
  + rutas.filter(r => r.ruta !== '/').map(r => `${r.ruta.slice(0, -1)} ${r.ruta} 301`).join('\n') + '\n');
// Cloudflare y GitHub Pages la enseñan (con 404) en cualquier dirección que no existe
writeFileSync(join(OUT, '404.html'), sitio.noEncontrada());
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.filter(r => !r.oculto).map(r => `  <url><loc>${sitio.publica(r.ruta)}</loc></url>`).join('\n')}
</urlset>
`);
// En github.io, o sin dominio en site.json, la web es de pruebas: no se indexa.
writeFileSync(join(OUT, 'robots.txt'), indexar
  ? `User-agent: *\nAllow: /\nSitemap: ${sitio.publica('/sitemap.xml')}\n`
  : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

const ocultos = sitio.todos.filter(p => p.oculto).map(p => p.slug);
console.log(`✓ ${rutas.length} páginas · ${sitio.publicados.length} proyectos en la home`
  + `${ocultos.length ? ` · ocultos: ${ocultos.join(', ')}` : ''}${avisos.length ? ` · ${avisos.length} avisos` : ''}`
  + ` · ${indexar ? `se indexa (${origen})` : 'noindex'}`);
