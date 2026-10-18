# Traspaso: la web a la cuenta de LA DIEGOL

LA DIEGOL ya tiene su copia: **`ladiegol/web`**, conectada a Workers Builds en su
Cloudflare con **ladiegol.com**. Hasta octubre de 2026 publicaba una página
provisional de *work in progress*. El de meowrhino se queda de copia nuestra en
`meowrhino.github.io/ladiegol/` (sin indexar). Desde el traspaso son dos
repositorios separados: los cambios, en el suyo.

Todo viaja dentro del repositorio: el código, los JSON, las fotos y cómo se
publica (`wrangler.jsonc`). En su copia la Action no corre (lleva
`if: github.repository_owner == 'meowrhino'`) y el build, al no estar en GitHub,
publica en la raíz con el `url` de `site.json` (`https://ladiegol.com`) y se
indexa.

Tiempo: unos 20 minutos (el dominio ya está).

## Antes

- [ ] `main` está al día y sin cambios a medias (`git status` limpio), y la copia
      nuestra en github.io se ve bien.
- [ ] **manu da el ok**: el paso 1 publica ladiegol.com y quita la página provisional.

## 1. Su copia

Su `main` es otra historia (la página provisional), así que se sustituye entera.
Antes, por si acaso, se guarda la provisional en una rama suya:

- [ ] `git remote add web https://github.com/ladiegol/web.git` (si no está) y `git fetch web`
- [ ] `git push web refs/remotes/web/main:refs/heads/wip` (la provisional, guardada en `wip`)
- [ ] `git push --force-with-lease=main:web/main web main:main`

## 2. Cloudflare (en la suya, ya conectada)

- [ ] Workers & Pages → `ladiegol` → **Deployments**: el build de este push, en verde.
      Lo demás lo lee de `wrangler.jsonc` (instala sharp con `npm install`, build
      `node build/build.mjs`, sale `dist/`). Si sale en rojo: [CLAUDE.md](CLAUDE.md).

## 3. Que nos deje entrar

- [ ] GitHub, en su repo: ya tenemos **Write**.
- [ ] Cloudflare: Manage account → Members → nos invita, si no lo ha hecho. Ahí se ve el error entero de un build que falla.

## 4. Comprobar en ladiegol.com

- [ ] La home (con el welcome la primera vez), `/about/`, dos proyectos y `/no-existe/` (404).
- [ ] Un vídeo de Vimeo se reproduce y los loops arrancan al pasar el ratón.
- [ ] Las direcciones viejas: `/aftermatch` → `/aftermatch/` y
      `/_PROJECTS/cerca/stills/6.webp` → `/projects/cerca/img/6.webp` (301).
- [ ] `view-source:`: `canonical` y `og:url` con ladiegol.com, y **sin** `<meta name="robots" content="noindex">`.
- [ ] `/robots.txt` dice `Allow` y `/sitemap.xml` tiene las direcciones de ladiegol.com.
- [ ] Compartir un proyecto por WhatsApp: sale su portada (la og).

## 5. Search Console, con su cuenta de Google

- [ ] Dar de alta el dominio (el registro TXT, en el DNS de Cloudflare) y enviar `sitemap.xml`.

## 6. LA DIEGOL en su ordenador

Con ella delante, siguiendo [GUIA.md](GUIA.md) ("La primera vez: preparar VS Code"):

- [ ] Clona **su** repositorio (`ladiegol/web`), no el de meowrhino.
- [ ] Live Server: **Go Live** y ve la vista previa.
- [ ] Un cambio pequeño (un cliente en el about), Confirmar → Sincronizar, y la web cambia.

## 7. Al acabar

- [ ] Fila de ladiegol en `JAMstack/inventario.md` con las dos direcciones.
- [ ] La copia de meowrhino sigue en github.io con `noindex`: no compite en Google.
