#!/usr/bin/env bash
# Convierte los originales del cliente en los archivos de la web, con los MISMOS
# ajustes que las herramientas que usará el cliente, para que todo salga igual:
#
#   stills → imgToWeb (WebP al 85 %, 2000 px como máximo, numerados 1, 2, 3…)
#   .gif   → imgToWeb (WebP animado, cada fotograma al 85 % y 2000 px)
#
#   ./tools/build-assets.sh              → todos los proyectos
#   ./tools/build-assets.sh cerca        → solo ese slug
#
# Origen  : $SRC/projects/N - NOMBRE/{stills,gifs hover}
# Destino : _PROJECTS/<slug>/stills/1.webp…n.webp y hover.webp
#
# Requiere ffmpeg y webp (brew install ffmpeg webp).

set -euo pipefail

SRC="${SRC:-$HOME/Desktop/ladiegol}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO/_PROJECTS"

# imgToWeb (js/convert-view.js y el selector de calidad)
IMG_MAX=2000
IMG_Q=85

# slug|carpeta de origen
MAP=(
  "are-you-one-of-us|1- CUPRA - ARE YOU ONE OF US?"
  "aftermatch|2 - FC BARCELONA - AFTERMATCH"
  "stripper|3 - KYNE"
  "ringtone|4 - REHAB"
  "made-to-remember|5 - PAW - MADE TO REMEMBER"
  "llegir|6 - GENERALITAT"
  "no-te-hace-falta|7 - LEROY MERLIN"
  "cerca|8 - CERCA"
  "coches-net|9 - COCHES.NET"
  "flooded|10 - FRANSIE"
  "yuyo-calm|11 - YUYO CALM"
  "por-culpa-del-amor|12 - DOLLAR"
)

only="${1:-}"
TMP="$(mktemp -d -t ladiegol)"
trap 'rm -rf "$TMP"' EXIT

# Imágenes de una carpeta en orden natural (2 antes que 10), como imgToWeb.
images_in() {
  find "$1" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort -V
}

# El filtro de escalado de imgToWeb: cabe en MAX×MAX sin ampliar nunca.
fit() {
  echo "scale='if(gte(iw,ih),min($1,iw),-2)':'if(gte(iw,ih),-2,min($1,ih))':flags=lanczos"
}

for entry in "${MAP[@]}"; do
  IFS='|' read -r slug folder <<< "$entry"
  [ -n "$only" ] && [ "$only" != "$slug" ] && continue

  src_dir="$SRC/projects/$folder"
  if [ ! -d "$src_dir" ]; then
    echo "  ⚠️  no encuentro $src_dir — me lo salto"
    continue
  fi

  # no borra nada: si un proyecto tiene ahora menos stills que antes, quita a mano los que sobren
  dst="$OUT/$slug"
  mkdir -p "$dst/stills"
  echo "▶ $slug"

  # ---- stills → stills/1.webp, 2.webp, … ----
  n=0
  while IFS= read -r still; do
    n=$((n + 1))
    ffmpeg -nostdin -v error -i "$still" -vf "$(fit $IMG_MAX)" -y "$TMP/still.png"
    cwebp -quiet -q $IMG_Q "$TMP/still.png" -o "$dst/stills/$n.webp"
  done < <(images_in "$src_dir/stills")
  echo "    $n stills · $(du -sh "$dst/stills" | cut -f1)"

  # ---- gif → hover.webp animado (fotograma a fotograma, como imgToWeb) ----
  gif="$(find "$src_dir/gifs hover" -maxdepth 1 -type f -iname '*.gif' | sort | head -1)"
  if [ -n "$gif" ]; then
    rm -rf "$TMP/frames" && mkdir "$TMP/frames"
    ffmpeg -nostdin -v error -i "$gif" -vf "$(fit $IMG_MAX)" -fps_mode passthrough "$TMP/frames/%04d.png"
    # duración de cada fotograma en ms, tal cual viene en el gif
    durations=()
    while IFS= read -r d; do durations+=("$(awk -v d="$d" 'BEGIN { printf "%d", d * 1000 + 0.5 }')"); done \
      < <(ffprobe -v error -select_streams v:0 -show_entries packet=duration_time -of csv=p=0 "$gif")
    args=()
    i=0
    for png in "$TMP"/frames/*.png; do
      cwebp -quiet -q $IMG_Q "$png" -o "${png%.png}.webp"
      args+=(-frame "${png%.png}.webp" "+${durations[$i]:-100}+0+0+0-b")
      i=$((i + 1))
    done
    webpmux "${args[@]}" -loop 0 -o "$dst/hover.webp" >/dev/null
    echo "    hover.webp: $(du -h "$dst/hover.webp" | cut -f1) · $i fotogramas"
  else
    echo "    ⚠️  sin gif de hover"
  fi

  echo "    total: $(du -sh "$dst" | cut -f1)"
done

echo
echo "✅ listo. Peso total de _PROJECTS: $(du -sh "$OUT" | cut -f1)"
echo "   Recuerda poner en data.json cuántos stills tiene cada proyecto."
