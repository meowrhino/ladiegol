# Auditoría (2026-10-16), pendiente

Lo que salió al revisar el repo entero. Nada de esto está arreglado todavía.

## Hay que arreglarlo

1. ~~`404.html` precarga `fonts/asset-400.woff2`, que ya no existe.~~ Arreglado: `404.html`
   vuelve a ser copia de `index.html`.
2. ~~Stapel (ParaType, de pago) en un repo público.~~ Ya no se usa: la quitamos antes de
   subirla, así que no está en el historial.

## Conviene arreglarlo

3. **Sin `noindex`**: la copia de pruebas puede salir en Google. Añadir
   `<meta name="robots" content="noindex" />` en `index.html` y `404.html`.
4. **Un proyecto sin `titulo` o `cliente` tumba la home** (`js/home.js`, el `toLowerCase`), y el
   mensaje dice que es el json. Usar `(p.titulo || "")` y `(p.cliente || "")`.
5. **Las fotos del loader mal escritas se descartan sin avisar** (`js/data.js`, `welcomeStills`).
   Un `console.warn` con las que no existen.
6. **El README explica cómo publicar en ladiegol.com (remoto `web`, rama `wip`, Cloudflare)**,
   copiado de `ladiegol`. Aquí solo hay `origin` y publica GitHub Pages. Cambiar la sección por
   "push a `main` → meowrhino.github.io/ladiegolv2".
7. **`index.html` y `404.html` hay que cambiarlos a la vez** (de ahí sale el 1). Como mínimo, una
   línea en el README: `cp index.html 404.html` al tocar el `<head>`.

## Estaría bien

8. **Una URL mal formada (`/%E0%A4%A`) da "no se ha podido cargar data.json"** en vez del 404
   (`js/main.js`, `decodeURIComponent` sin `try`).
9. **Textos desfasados**: `js/dom.js` dice "cuatro ayudas" (son tres); en el README, `nombre` ya
   no sale en el about y en "Pendiente" el welcome ya está activo.

No revisado: Safari / iOS, ejecutar `tools/build-assets.sh`.
