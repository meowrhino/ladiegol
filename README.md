# ladiegol.com

Portfolio de LA DIEGOL. Web estática: un `index.html`, un `data.json` y una carpeta por proyecto. Sin build, sin dependencias.

**Regla de oro:** el contenido se toca en **`data.json`** y en **`_PROJECTS/`**. El código (`index.html`, `css/`, `js/`) no hace falta tocarlo.

---

## Cómo funciona en 30 segundos

- **Home** (`/`): un grid con un proyecto por casilla. Se ve un **still de portada**; al pasar el ratón por encima arranca el **loop** del proyecto. En **móvil no hay hover**, así que se activa lo que queda en la **franja central** de la pantalla mientras haces scroll.
- Los proyectos con `"destacado": true` ocupan una **casilla doble**, alternando lado.
- **Proyecto** (`/<slug>`): primero el/los videos de Vimeo (no cargan hasta que los clicas), debajo la ficha (título · cliente · tipo) y después la galería de stills.
- **About** (`/about`): la bio y la lista de clientes, de `data.json`. Se entra **clicando el nombre** de la cabecera; para volver, el "index" de arriba a la derecha.
- **Welcome** (`/welcome`): la portada de bienvenida, con el nombre cambiando de tipografía letra a letra sobre un pase de imágenes. Dos versiones para comparar: **`/welcome-loop`** y **`/welcome-stills`**.
- El **logo** reparte seis góticas entre las letras, una distinta cada vez que se carga la página. En la home va grande y se va con el scroll; en el resto se queda pequeño y fijo arriba.
- El **fondo** es negro con grano fino de película.

---

## Añadir un proyecto (paso a paso)

Todo se hace con dos herramientas web y tocando solo carpetas y `data.json`.
Hace falta **Chrome** (Safari no sabe crear WebP) y **VS Code** con la extensión **Live Server**
(VS Code la propone sola al abrir la carpeta).

### 1. Los stills → [imgToWeb](https://meowrhino.github.io/imgToWeb/)

1. Arrastra la carpeta de stills del proyecto. Calidad: **85 %** (la que viene).
2. Deja activado el **renombrado secuencial** (1, 2, 3…) y **arrastra las fotos para ordenarlas**:
   el orden de la web es ese.
3. **Descargar todo (zip)** y descomprime.

### 2. El loop → [videoToWeb](https://meowrhino.github.io/videoToWeb/)

Elige el modo **loop**, arrastra el **gif** del hover y descarga el `.webm`. Mantiene el ritmo
entrecortado del gif y pesa muchísimo menos.

### 3. La carpeta

Crea `_PROJECTS/<slug>/` (el slug es el nombre corto del proyecto, en minúsculas y con guiones:
`por-culpa-del-amor`) y deja dentro:

```
_PROJECTS/por-culpa-del-amor/
  stills/
    1.webp
    2.webp
    …
  hover.webm     ← el loop, renombrado así
```

### 4. El `data.json`

Copia un proyecto del array `projects`, pégalo donde quieras que salga (el **orden de la home** es
el orden del array) y cambia los datos:

```json
{
  "slug": "por-culpa-del-amor",
  "titulo": "POR CULPA DEL AMOR",
  "cliente": "DOLLAR SELLMOUNI",
  "tipo": "MUSIC VIDEO",
  "destacado": false,
  "visible": true,
  "vimeo": ["685499456"],
  "stills": 9,
  "portada": 1,
  "loop": true
},
```

| campo | qué hace |
|---|---|
| `slug` | **igual que la carpeta** de `_PROJECTS/`. Es también la url: `ladiegol.com/por-culpa-del-amor` |
| `titulo` / `cliente` / `tipo` | lo que se ve en la casilla y en la ficha (sale todo en mayúsculas, da igual cómo lo escribas) |
| `destacado` | `true` = casilla doble en la home. Mejor 2 o 3 como mucho |
| `visible` | `false` = no sale en la home, pero `/<slug>` funciona (para pasar el link antes de publicar) |
| `vimeo` | ids de Vimeo, solo el número (`vimeo.com/685499456` → `"685499456"`), en orden |
| `stills` | cuántas fotos hay en `stills/` |
| `portada` | el número del still que sale en la home y de portada del vídeo |
| `loop` | `false` si el proyecto no tiene loop |

Ojo con las **comas**: entre proyecto y proyecto va una coma, y después del último no.
Si la web se queda en blanco después de tocar el json, casi siempre es una coma.

### 5. Comprobarlo

En VS Code, **Go Live** (abajo a la derecha). Se abre la web y se recarga sola cada vez que
guardas `data.json`. Mira la home (la portada y el loop) y entra en el proyecto.

### 6. Publicarlo

Con **[GitHub Desktop](https://desktop.github.com)** y el repo **`ladiegol/web`** abierto
(es el único que publica en ladiegol.com):

1. Abajo a la izquierda, escribe qué has hecho (`añado por culpa del amor`) → **Commit to main**.
2. Arriba, **Push origin**.

En un minuto está en ladiegol.com. Si ves lo de antes, **Cmd+Shift+R**: el navegador guarda
las fotos y los loops una hora.

---

## Los ajustes generales (`meta` en `data.json`)

| campo | qué hace |
|---|---|
| `nombre` | el logo de la cabecera y el título del about |
| `titulo` | el título de la pestaña del navegador en la home |
| `ralentizar_loops` | velocidad de los loops: `1` = la del gif, `1.5` = un 50 % más lentos, `2` = el doble de lentos |
| `email` / `instagram` | salen al final del about. Vacíos (`""`) = no salen. El instagram, con o sin `@` |
| `bio` | el texto del about. Cada `\n\n` es un párrafo nuevo |
| `clientes` | la lista de clientes del about, en orden |
| `welcome` | la portada de bienvenida (ver más abajo) |

---

## Los loops

Son los **gifs** del cliente pasados a **webm** (`hover.webm`) con videoToWeb en modo loop: el
mismo ritmo entrecortado del gif (sus fps, normalmente 10) a 960 px. Duran lo mismo que los gifs
originales (comprobado uno a uno, ±0,1 s). Para que vayan más lentos, `ralentizar_loops` en `meta`. Los 12 suman **~7 MB** (de
0,3 a 1 MB cada uno). Cada loop se descarga cuando su casilla está en pantalla o le falta media
pantalla para entrar: así el hover arranca al momento y no se baja nada de lo que queda lejos.

Lo que probamos antes de elegir (los 12 loops):

| | peso | |
|---|---|---|
| **gif → webm** (el elegido) | ~7 MB | ritmo del gif, misma calidad que el webp a 960 px |
| gif → webp animado (imgToWeb) | ~36 MB | ritmo del gif, 2000 px |
| vídeo → webm | ~3,7 MB | fluido, a velocidad real |

Los descartados están fuera del repo, en `~/Desktop/ladiegol-loops-webp/` y
`~/Desktop/ladiegol-loops-video/`.

WebM lo leen todos los navegadores actuales (Safari desde macOS 16 / iOS 17.4). En uno más viejo el
loop no arranca y se queda la foto de portada.

---

## La portada de bienvenida (welcome)

Se configura en `data.json`, dentro de `meta`:

```json
"welcome": {
  "activo": false,
  "modo": "loop",
  "stills": ["stripper/1", "are-you-one-of-us/10", "cerca/6"]
}
```

- `activo`: `true` = al entrar en la web sale primero el welcome (una vez por visita). `false` = no sale, pero se puede ver entrando a mano en `/welcome`.
- `modo`: `"loop"` (los loops de los proyectos, uno tras otro) o `"stills"`.
- `stills`: las fotos del pase, como `"slug/número"`. Si la lista está vacía salen todas.

Se sale clicando en cualquier sitio (o con enter / espacio / esc).

El ritmo del pase de stills está arriba de `js/welcome.js`: `STILL_MS` (2,6 s por foto) y
`FUNDIDO_MS` (1,1 s de fundido, que va también en `css/welcome.css`). Los loops se ven enteros.

---

## Convertir en bloque (para nosotros)

`tools/build-assets.sh` convierte los originales de golpe con **los mismos ajustes** que imgToWeb
(stills) y videoToWeb (gif → loop), para que salga igual que lo que suba el cliente:

```bash
./tools/build-assets.sh          # todos los proyectos
./tools/build-assets.sh cerca    # solo uno
```

Lee de `~/Desktop/ladiegol/projects/N - NOMBRE/{stills,gifs hover}` (se cambia con
`SRC=/otra/ruta`). Los stills se numeran en el orden de los nombres de archivo (las capturas van
por fecha). Necesita `brew install ffmpeg webp`. Los originales de esta tanda ya no están en el
escritorio: para volver a convertirlos habría que pedírselos otra vez al cliente.

---

## Estructura del código

```
index.html / 404.html   ← el mismo cascarón (el 404 solo lo usa GitHub Pages)
data.json               ← todo el contenido
_PROJECTS/<slug>/       ← stills/1.webp…n.webp y hover.webm
css/
  base.css      tokens, grano, tipografías, cabecera, about
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
.vscode/        ajustes de Live Server
tools/          conversión en bloque y servidor local
```

Las rutas son siempre de **un solo tramo** (`/welcome-loop`, no `/welcome/loop`): el html
enlaza css y js con rutas relativas.

---

## Probar en local

No vale abrir `index.html` con doble clic (hay un `fetch`). Hay que servirlo:

- **VS Code → Go Live** (Live Server). Está configurado en `.vscode/settings.json` para que al
  recargar en `/cerca` salga la web y no un 404, igual que en Cloudflare.
- O sin VS Code: `python3 tools/serve.py` → http://localhost:8080

Si cambias algo y sigues viendo lo viejo: caché. **Cmd+Shift+R**.

---

## Publicar (ladiegol.com)

La web vive en **Cloudflare Workers** (solo archivos estáticos) conectada al repo del cliente,
**`github.com/ladiegol/web`**. Cada push a `main` de ese repo se publica solo en un minuto.

Hay dos repos y **no llevan lo mismo**:

- **`meowrhino/ladiegol`** (el nuestro, `origin`): aquí se trabaja. Su `main` es la web de
  verdad. Un `git push` normal solo sube aquí.
- **`ladiegol/web`** (el del cliente, remoto `web`): es lo que sale en ladiegol.com. Ahora mismo
  tiene la página provisional de **work in progress**.

La página provisional está en la rama **`wip`** de nuestro repo: es `main` más la carpeta `wip/`,
y `wrangler.jsonc` apuntando a esa carpeta, así que no se publica nada más.

```bash
# cambiar la página provisional
git switch wip          # editar wip/index.html, commit
git push origin wip     # copia en nuestro repo
git push web wip:main   # ladiegol.com

# lanzar la web de verdad (sustituye la provisional)
git switch main
git push --force-with-lease web main:main
```

- `wrangler.jsonc`: la config. Publica la raíz del repo y, si la url no es un archivo
  (`/aftermatch`, `/about`…), devuelve `index.html` con 200.
- `.assetsignore`: lo que **no** se publica (`tools/`, este README, `.git`…).
- `_headers`: la caché de cada carpeta. Fotos, loops, css y js, una hora: si se cambia una foto
  (aunque se llame igual), quien ya había entrado la ve nueva como mucho una hora después.

Probar exactamente lo que servirá Cloudflare: `npx wrangler dev` → http://localhost:8787

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
- [ ] Decidir la versión del **welcome** (`/welcome-loop` vs `/welcome-stills`) y activarlo.
