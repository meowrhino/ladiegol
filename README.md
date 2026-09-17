# ladiegol.com

Portfolio de LA DIEGOL. Web estática (JAMstack): un `index.html`, un `data.json` y una carpeta de archivos por proyecto. Sin build, sin dependencias.

**Regla de oro:** el contenido se toca en **`data.json`** y en **`_PROJECTS/`**. El código (`index.html`, `css/`, `js/`) no hace falta tocarlo.

---

## Cómo funciona en 30 segundos

- **Home** (`/`): un grid con un proyecto por casilla. Se ve el **primer still**; al pasar el ratón por encima arranca el **loop** de ese proyecto (el gif, ya convertido a video). En **móvil no hay hover**, así que se activa solo lo que queda en la **franja central** de la pantalla mientras haces scroll.
- Los proyectos con `"destacado": true` ocupan una **casilla doble**, alternando lado.
- **Proyecto** (`/<slug>`): primero el/los videos de Vimeo (no cargan hasta que los clicas), debajo la ficha (título · cliente · tipo) y después la galería de stills, todos del mismo ancho.
- **About** (`/about`): la bio y la lista de clientes, de `data.json`. Se entra **clicando el nombre** de la cabecera; para volver, el "index" de arriba a la derecha.
- **Welcome** (`/welcome`): la portada de bienvenida, con el nombre cambiando de tipografía letra a letra sobre un pase de los proyectos. Hay dos versiones para comparar: **`/welcome-loop`** (los loops, uno tras otro) y **`/welcome-stills`** (stills sueltos).
- El **logo** reparte seis góticas entre las letras, una distinta cada vez que se carga la página (y al pasarle el ratón por encima en la cabecera). En la home va grande y se va con el scroll; en el resto se queda pequeño y fijo arriba.

---

## Los GIFs: por qué no hay GIFs

Los gifs de hover originales pesan entre 11 MB y 98 MB cada uno. Puestos tal cual en la home,
abrir la página serían ~190 MB. Convertidos a video ocupan esto:

| proyecto | gif original | .webm | .mp4 |
|---|---|---|---|
| CUPRA | 41 MB | 112 KB | 188 KB |

Es decir, unas **300–400 veces menos**, y en pantalla se ve igual porque en el grid van a 960 px de ancho.

El truco es el de siempre: **un gif es un video malo**. Se convierten a `.webm` (VP9) con `.mp4` de
repuesto para Safari viejo, se cargan con `preload="none"` y el navegador no descarga **nada** de
video hasta que hay hover (o hasta que la casilla llega al centro, en móvil).

Lo hace todo el script:

```bash
./tools/build-assets.sh              # todos los proyectos
./tools/build-assets.sh yuyo-calm    # solo uno
```

Lee los originales de `~/Desktop/ladiegol` (se cambia con `SRC=/otra/ruta ./tools/build-assets.sh`)
y deja en `_PROJECTS/<slug>/`:

```
poster.webp    ← el primer still, para el grid de la home
hover.webm     ← el loop
hover.mp4      ← el mismo loop para Safari viejo
1.webp … n.webp ← los stills de la página del proyecto (recortados: les quita las barras negras)
```

Necesita `ffmpeg` y `cwebp`:

```bash
brew install ffmpeg webp
```

Los ajustes (calidad, tamaños, fps) están arriba del todo del script, comentados. Si algo pesa
demasiado, sube `HOVER_CRF`; si se ve feo, bájalo.

---

## Añadir un proyecto

1. Mete los originales en `~/Desktop/ladiegol/projects/N - NOMBRE/` con sus carpetas `stills/` y `gifs hover/`.
2. Añade la línea del proyecto al array `MAP` de `tools/build-assets.sh` (`slug|nombre de la carpeta`).
3. `./tools/build-assets.sh <slug>`
4. Añade el proyecto a `data.json`:

```json
{
  "slug": "mi-proyecto",
  "titulo": "TÍTULO",
  "cliente": "CLIENTE",
  "tipo": "COMMERCIAL",
  "destacado": false,
  "visible": true,
  "vimeo": ["930328854"],
  "stills": 12,
  "loop": true
}
```

| campo | qué hace |
|---|---|
| `slug` | identificador. **Tiene que llamarse igual que la carpeta** en `_PROJECTS/` |
| `titulo` / `cliente` / `tipo` | lo que se ve en la casilla y en la ficha |
| `destacado` | `true` = casilla doble en la home |
| `visible` | `false` = no sale en la home, pero `/<slug>` sigue funcionando (para pasar el link antes de publicar) |
| `vimeo` | ids de Vimeo, solo el número, en orden |
| `stills` | cuántas fotos hay (`1.webp … n.webp`). Lo dice el script al terminar |
| `loop` | `false` si ese proyecto no tiene loop de hover (tampoco sale en el welcome) |

El **orden de la home** es el orden del array `projects`.

---

---

## La portada de bienvenida (welcome)

Se configura en `data.json`, dentro de `meta`:

```json
"welcome": { "activo": false, "modo": "loop" }
```

- `activo`: `true` = al entrar en la web sale primero el welcome (una vez por visita; luego ya no molesta). `false` = no sale, pero se puede ver entrando a mano en `/welcome`.
- `modo`: `"loop"` o `"stills"`.

Se sale clicando en cualquier sitio (o con enter / espacio / esc).

> Los loops son los mismos de la home, de 960 px de ancho. Si nos quedamos con el modo
> `loop`, conviene generarlos más grandes para pantalla completa (subir `HOVER_W` en
> `tools/build-assets.sh`, o hacer unos aparte solo para el welcome).

---

## Estructura del código

```
index.html / 404.html   ← el mismo cascarón (404 para las urls profundas)
css/
  base.css      tokens, tipografías, cabecera, about
  home.css      el grid
  project.css   ficha, vimeo y galería
  welcome.css   la portada de bienvenida
js/
  main.js       arranque y router
  config.js     rutas base y detección de hover / ahorro de datos
  dom.js        cuatro ayudas (crear elementos, barajar, elegir al azar)
  data.js       carga y consultas de data.json
  home.js       el grid
  loops.js      los loops de las casillas (hover o centro de pantalla)
  project.js    la página de proyecto
  about.js      el about
  welcome.js    las dos versiones del welcome
  wordmark.js   el nombre con una tipo por letra
fonts/          JetBrains Mono + seis góticas (recortadas a las mayúsculas)
```

Las rutas son siempre de **un solo tramo** (`/welcome-loop`, no `/welcome/loop`): el html
enlaza css y js con rutas relativas para que la web funcione igual en un dominio propio
que en `usuario.github.io/ladiegol/`.

---

## Probar en local

No vale abrir `index.html` con doble clic (hay rutas absolutas y un `fetch`). Hay que servirlo:

```bash
python3 tools/serve.py
```

y abrir http://localhost:8080. Ese servidorcillo imita a Cloudflare Pages: si recargas en
`/aftermatch` te devuelve la web en vez de un 404.

Si cambias algo y sigues viendo lo viejo: caché. **Cmd+Shift+R**.

---

## Tipografías

- **JetBrains Mono** (texto) y seis góticas para el logo: UnifrakturMaguntia, Germania One,
  Pirata One, New Rocker, Metal Mania y Grenze Gotisch. Todas libres (OFL), servidas desde
  `fonts/` y recortadas a mayúsculas y números: pesan 74 KB entre las siete.
- Si aparecen los archivos de **Akkurat** o **BKSMono**, se añaden a `fonts/`, se declara el
  `@font-face` en `css/base.css` y se cambia `--font-mono` / `--font-sans`.
- Para cambiar una gótica del logo: sustituir el `dN-*.woff2` correspondiente y su `@font-face`
  (`"Diegol N"`). Si algún día son más o menos de seis, ajustar `FAMILIES` en `js/wordmark.js`.

---

## Pendiente

- [ ] **Email / Instagram** del `meta` de `data.json`, que están vacíos.
- [ ] Falta el **gif de hover de Yuyo Calm** (ahora mismo `"loop": false`).
- [ ] Decidir la versión del **welcome** (`/welcome-loop` vs `/welcome-stills`) y activarlo.
- [ ] Con 10 proyectos habrá que revisar el ritmo de casillas grandes de la home.
