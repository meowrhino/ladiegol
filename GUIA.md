# Guía de la web

La web de LA DIEGOL: la home con los proyectos, una página por proyecto y el about.

> **Regla de oro: solo tocas `data/` y `projects/`.**
> Lo demás (build, css, js) es la maquinaria: no hace falta abrirlo.

Todo lo que cambia está en dos ficheros y una carpeta por proyecto:

```
data/site.json                 lo general: el nombre, el welcome y la lista de
                               proyectos (qué sale en la home y en qué orden)
data/about.json                el texto del about y los clientes
data/about/1.webp              la foto de detrás del about
projects/<slug>/project.json   un proyecto: título, cliente, tipo, vídeos y fotos
projects/<slug>/img/           sus fotos (1.webp, 2.webp…) y su loop (loop.webm)
```

**Un proyecto, una carpeta**: todo lo de un proyecto está junto. Para copiarlo,
borrarlo o cambiarlo de nombre, se hace con su carpeta entera.

Al subir un cambio a GitHub, **la web se actualiza sola** en un par de minutos.
Si algo está mal, **la web no se rompe**: se queda como estaba hasta que se
arregla (ver "Si sale en rojo", al final).

## La primera vez: preparar VS Code

Solo se hace una vez.

1. Instala **VS Code**: https://code.visualstudio.com
2. En VS Code: **Archivo → Nueva ventana**, y en la bienvenida, **Clonar
   repositorio Git…** → **Clonar desde GitHub**. Te pide entrar con tu cuenta
   de GitHub: acepta. Elige `web` (el tuyo, `ladiegol/web`) y una carpeta de tu
   ordenador. Si pide instalar Git, acepta.
3. Al abrirla, VS Code te propone instalar **Live Server** (abajo a la derecha):
   **Instalar**. Si no sale, búscalo en la pestaña de extensiones (los cuatro
   cuadraditos de la izquierda).
4. Listo: abajo a la derecha aparece **Go Live**.

## Añadir un proyecto, paso a paso

1. **Elige el slug**: el nombre de la carpeta, que es también la dirección del
   proyecto, `ladiegol.com/<slug>/`. Minúsculas, números y guiones, sin acentos
   ni espacios: `por-culpa-del-amor`. **No lo cambies nunca** una vez
   publicado: rompe los enlaces que ya circulan.
2. **Copia la carpeta** de otro proyecto dentro de `projects/`, ponle el slug de
   nombre y vacía su `img/`.
3. **Prepara las fotos y el loop** (ver "Preparar fotos y loop") y mételos en
   `img/`.
4. **Cambia los campos** de su `project.json` (ver la tabla).
5. **Ponlo en la lista**: en `data/site.json`, añade el slug a `lists` → `work`
   → `projects`, donde quieras que salga: **el primero de la lista es el primero
   de la home**.
6. **Revísalo con la vista previa** (ver abajo) y **súbelo**.

## Quitar un proyecto

- **Esconderlo, pero poder mandarlo** a alguien: en la lista, en vez del slug,
  `{ "project": "cerca", "visible": false }`. Tiene su página
  (`ladiegol.com/cerca/`), pero no sale en la home ni en Google. Para
  publicarlo, se vuelve a dejar solo el slug, en el mismo sitio.
- **Quitarlo de la web**: quita su slug de la lista. Su carpeta sigue ahí, por si
  vuelve. **No es privado**: el repositorio es público, así que las fotos se ven
  en GitHub.
- **Quitarlo del todo**: quita su slug de la lista **y** borra su carpeta
  `projects/<slug>/`.

## Los campos de un proyecto

El `project.json` de `projects/aftermatch/`:

```json
{
  "$schema": "../../schema/project.json",
  "title": "AFTERMATCH",
  "client": "FCBARCELONA",
  "type": "COMMERCIAL",
  "vimeo": ["1174739797"],
  "cover": "5",
  "photos": ["1", "2", "3", "4", "5"]
}
```

| campo | qué es |
|---|---|
| `title` | El título. Sale en la home, en la página y en Google. |
| `client` | Para quién. Sale debajo de la casilla de la home, al lado del título (si son iguales, como coches.net, solo una vez). |
| `type` | `COMMERCIAL`, `MUSIC VIDEO`… Cada tipo distinto es un botón del filtro de la home: escríbelo siempre igual. |
| `vimeo` | Los vídeos, por su número de Vimeo (`vimeo.com/1174739797` → `"1174739797"`), en orden. |
| `cover` | La portada: el número de la foto que sale en la casilla de la home, delante del primer vídeo y al compartir el enlace. |
| `photos` | Las fotos de la página, en orden, por su número: `"3"` es `img/3.webp`. |
| `featured` | `true`: en la home ocupa dos columnas y dos filas. Mejor dos o tres como mucho. Si no, no lo pongas. |
| `description` | Opcional: la frase que sale en Google y al compartir. Si no está, se hace sola con el título, el cliente y el tipo. |

Los números van **entre comillas**, y entre un elemento y otro de una lista,
**una coma** (después del último, no). VS Code subraya en rojo lo que está mal y,
si pasas el ratón por encima de un campo, te dice qué es.

## Preparar fotos y loop

- **Las fotos → [imgToWeb](https://meowrhino.github.io/imgToWeb/)**. **Ábrelo con
  Chrome o Firefox**, no con Safari: Safari no sabe hacer `.webp`. Arrastra las
  fotos, **ordénalas arrastrando** (el orden de la web es ese), deja la calidad
  en 85 % y el renombrado 1, 2, 3…, descarga el zip y mete las fotos en `img/`
  tal cual: `1.webp`, `2.webp`…
- **El loop de la home → [videoToWeb](https://meowrhino.github.io/videoToWeb/)**:
  modo **loop**, arrastra el gif o el vídeo corto y descarga el `.webm`. En
  `img/`, con el nombre **`loop.webm`**. Si un proyecto no tiene loop, en la home
  sale solo su foto.

## Ver los cambios antes de subirlos: Live Server

En VS Code, dale a **Go Live** (abajo a la derecha). Se abre la web entera,
leyendo tus JSON tal como están, y **se recarga sola cada vez que guardas**.

Lo que no cuadra sale aquí, antes de subir:

- **Lo que dejaría la web rota** (una coma, una foto de `photos` que no está en
  `img/`, un slug de la lista sin carpeta): en vez de la página sale el error, con
  el fichero y la línea donde mirar. Así tampoco se publicaría: arréglalo antes
  de subir.
- **Lo que solo conviene mirar** (un proyecto sin loop o sin vídeo): una franja
  amarilla arriba de la página. La web se publica igual.

La vista previa es la web de verdad, con una diferencia: las direcciones llevan
`?p=` (`http://127.0.0.1:5500/?p=/aftermatch/`).

## Subir los cambios desde VS Code

Live Server solo enseña: no sube nada. Para publicar:

1. Pestaña **Control de código fuente**, a la izquierda (el icono de las tres
   bolitas unidas). Salen los ficheros que has tocado o añadido.
2. Escribe arriba qué has hecho (`proyecto nuevo: por culpa del amor`) y dale a
   **Confirmar** (*Commit*). Si pregunta si quieres añadir todos los cambios: **Sí**.
3. Dale a **Sincronizar cambios** (*Sync*). Eso lo sube a GitHub.
4. En un par de minutos está en ladiegol.com. Si ves lo de antes, **Cmd+Shift+R**:
   el navegador guarda las fotos una hora.

**Antes de empezar a tocar**, dale también a **Sincronizar**: si has cambiado algo
desde la web de GitHub, así lo bajas y no se pisan.

## El resto: `data/site.json` y `data/about.json`

| campo | qué es |
|---|---|
| `name` | El nombre, arriba en todas las páginas y en el welcome. |
| `title` | El título de la home en la pestaña y en Google. |
| `description` | La frase de debajo en Google y al compartir la web. |
| `url` | El dominio: `"https://ladiegol.com"`. Con él, Google la indexa. |
| `email`, `social` → `instagram` | Salen al final del about. Vacíos (`""`), no salen. |
| `loopSlowdown` | La velocidad de los loops: `1` es la del gif, `1.3` un 30 % más lentos. |
| `welcome` | La portada de bienvenida: `on` (`true` o `false`), `mode` (`"stills"` o `"loop"`) y `photos`, las fotos del pase como `"proyecto/número"`: `"aftermatch/4"`. |
| `lists` → `work` → `projects` | Los proyectos de la home, en orden. Cada nombre es una carpeta de `projects/`. |

`data/about.json`: `text`, el texto del about, un párrafo por elemento de la
lista; `clients`, los clientes, en orden. **La foto** del about es
`data/about/1.webp`: para cambiarla, se sustituye ese fichero por otro con el
mismo nombre (de imgToWeb).

## Qué sale en Google y al compartir

| dónde | de qué campo |
|---|---|
| el título de la home | `title` de `site.json` |
| el título de un proyecto | su `title` y el `name` |
| la frase de debajo | la home: `description`; el about: su primer párrafo; un proyecto: su `description` o, si no hay, título, cliente y tipo |
| la imagen al compartir | un proyecto: su `cover`, recortada a 1200×630 al publicar; el about: su foto; la home: la portada del primer proyecto |

## Si sale en rojo

La web no se rompe: se queda como estaba hasta que se arregla. En GitHub, al lado
del último cambio, la bolita sale roja. Clícala, luego **Details**, y lee el
último mensaje, que dice el fichero y qué pasa:

- **"projects/cerca/project.json no es un JSON válido (línea 12, columna 5)"** →
  casi siempre **una coma** de más o de menos, o unas comillas sin cerrar, cerca
  de esa línea. Live Server te lo dice igual, antes de subir.
- **""cliente" no es un campo de aquí (¿mal escrito?)"**, **"falta "title""** →
  lo mismo que VS Code subraya en rojo: un campo mal escrito o uno que falta.
  El mensaje dice los que hay.
- **"la foto "7" no está: falta projects/cerca/img/7.webp"** → en `photos` (o en
  `cover`) hay una foto que no está en `img/`. Ponla, o quítala de la lista.
- **""cerca" no tiene carpeta"** → el nombre de la lista y el de la carpeta no son
  iguales.

Los avisos con ⚠ no paran nada. Si no sabes arreglarlo, escríbenos: lo vemos en
tu repositorio.
