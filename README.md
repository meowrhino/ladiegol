# ladiegol

Portfolio de LA DIEGOL (directora, Barcelona), con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Para nosotros; lo
que edita ella está en [GUIA.md](GUIA.md), el paso a su cuenta en
[TRASPASO.md](TRASPASO.md) y qué hacer si el build falla en [CLAUDE.md](CLAUDE.md).

- **Nuestra copia** (`meowrhino/ladiegol`): la Action publica en
  https://meowrhino.github.io/ladiegol/ (con `noindex`).
- **La suya** (`ladiegol/web`): Workers Builds en su Cloudflare, en
  https://ladiegol.com (`wrangler.jsonc`).

## Cómo está hecha

```
data/site.json                 nombre, welcome, lista de la home (lists → work)
data/about.json, data/about/   texto y clientes del about; su foto (1.webp)
projects/<slug>/               project.json + img/1.webp… (imgToWeb) + img/loop.webm (videoToWeb)
schema/                        un esquema por tipo de JSON: VS Code y el build validan con él
build/paginas.mjs              la plantilla: datos → HTML. La usan los dos de abajo
build/build.mjs                lee, valida, hace las og (sharp) y escribe dist/
build/preview.mjs              la misma plantilla en el navegador, para Live Server (index.html)
css/, js/                      lo que se ve; el JS solo añade (filtro, loops, welcome, Vimeo)
css/transicion.css, js/transicion.js   la transición de la casa, copiada de almarbra tal cual
_headers, _redirects           caché y direcciones viejas, en Cloudflare
tools/build-assets.sh          los originales del cliente en bloque (ffmpeg + cwebp), para nosotros
```

- **Páginas**: `/`, `/about/`, `/<slug>/` y, para comparar los dos welcomes,
  `/welcome/`, `/welcome-loop/` y `/welcome-stills/` (con `noindex`). Un proyecto
  va en `/<slug>/` sin prefijo porque solo hay una lista; el build para si un slug
  choca con una página o una carpeta (`RESERVADAS` en `paginas.mjs`).
- **Welcome**: sale en la home una vez por visita (`sessionStorage`), encima del
  grid; un `<script>` justo después de `<body>` lo decide antes de pintar. Es el
  loader: precarga las portadas y entra solo (2,4–8 s, `MIN_MS` / `MAX_MS` en
  `js/welcome.js`), con un fundido lento (View Transition en la misma página,
  `data-paso` en `css/base.css`). En pantallas de más de 2200 px, siempre stills.
- **Loops**: los gifs del cliente en webm (videoToWeb, modo loop, 960 px, ~7 MB
  los 12). Cada uno se baja cuando su casilla está cerca de la pantalla; en
  móvil arranca el que queda en la franja central. `loopSlowdown` los ralentiza.
- **Fuentes**: Wild Trave Rounded (Letterhend, gratis) para el nombre y los
  títulos; DM Sans (OFL, 400 y 900) para lo demás. En `fonts/`. Los tamaños del
  nombre están pensados para Wild Trave ("LA DIEGOL" mide ~8,8 veces el cuerpo).
- **Direcciones viejas** (antes de octubre de 2026): `/_PROJECTS/<slug>/stills/N.webp`,
  `hover.webm`, `img/about.webp` y `data.json`, en `_redirects`; y el build añade
  `/<página>` → `/<página>/` con 301 (Cloudflare pondría 307).

## Probar

```bash
npm ci
```

```bash
node build/build.mjs
```

- **Vista previa** (lo que ve ella): Live Server en la raíz (`index.html`).
- **Lo publicado**: `python3 -m http.server 8099 --directory dist`, o
  `npx wrangler dev` para ver también `_headers`, `_redirects` y el 404.
- En la Action el build sabe que está en GitHub (`GITHUB_ACTIONS`): base
  `/ladiegol/` y `noindex`. Fuera, la raíz y el `url` de `site.json`.
