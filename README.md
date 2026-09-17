# ladiegol.com

Portfolio de LA DIEGOL. Web estática (JAMstack): un `index.html`, un `data.json` y una carpeta de archivos por proyecto. Sin build, sin dependencias.

**Regla de oro:** el contenido se toca en **`data.json`** y en **`_PROJECTS/`**. El código (`index.html`, `css/style.css`, `js/main.js`) no hace falta tocarlo.

---

## Cómo funciona en 30 segundos

- **Home** (`/`): un grid con un proyecto por casilla. Se ve el **primer still**; al pasar el ratón por encima arranca el **loop** de ese proyecto (el gif, ya convertido a video). En **móvil no hay hover**, así que se activa solo lo que queda en la **franja central** de la pantalla mientras haces scroll.
- Los proyectos con `"destacado": true` ocupan una **casilla doble**, alternando lado.
- **Proyecto** (`/<slug>`): título + cliente, el/los videos de Vimeo (no cargan hasta que los clicas) y la galería de stills.
- **About** (`/about`): la bio y la lista de clientes, de `data.json`.

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
  "creditos": ""
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
| `creditos` | texto libre de la ficha técnica. Vacío = no aparece |

El **orden de la home** es el orden del array `projects`.

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

## Pendiente

- [ ] **Tipografías**: faltan los `.woff2` (ver `fonts/LEEME.txt`). Ahora mismo tira de la mono del sistema.
- [ ] **Logotipo**: la gótica de "LA DIEGOL" del Figma, en SVG o en fuente.
- [ ] **Email / Instagram** del `meta` de `data.json`, que están vacíos.
- [ ] **Créditos** de cada proyecto (fichas técnicas completas).
- [ ] Faltan el **gif de hover de Yuyo Calm** y los stills/loop de la sección `welcome`.
- [ ] Decidir si la home lleva **más casillas que proyectos** (en el Figma se ven ~18).
