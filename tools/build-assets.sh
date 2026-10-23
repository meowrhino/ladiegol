#!/usr/bin/env bash
# Convierte los originales del cliente en los archivos de la web, con los MISMOS
# ajustes que las herramientas que usará el cliente, para que todo salga igual:
#
#   stills → imgToWeb   (WebP al 85 %, 2000 px como máximo, numerados 1, 2, 3…)
#   .gif   → videoToWeb (modo loop con un gif: WebM VP8, 960 px, sus fps, CRF 10, sin audio)
#
#   ./tools/build-assets.sh              → todos los proyectos
#   ./tools/build-assets.sh cerca        → solo ese slug
#
# Origen  : $SRC/projects/N - NOMBRE/{stills,gifs hover}
# Destino : projects/<slug>/img/1.webp…n.webp y loop.webm (el project.json, a mano)
#
# Requiere ffmpeg y webp (brew install ffmpeg webp).

set -euo pipefail

SRC="${SRC:-$HOME/Desktop/ladiegol v2}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO/projects"

# imgToWeb (js/convert-view.js y el selector de calidad)
IMG_MAX=2000
IMG_Q=85

# videoToWeb, modo "loop" con un gif (js/config.js: PRESETS.loop y su apartado gif)
LOOP_MAX=960
LOOP_CRF=10
LOOP_BITRATE=2500k

# slug|carpeta de origen
MAP=(
  "are-you-one-of-us|1- CUPRA - ARE YOU ONE OF US?"
  "aftermatch|2 - FC BARCELONA - AFTERMATCH"
  "no-te-hace-falta|3 - LEROY MERLIN"
  "stripper|4 - KYNE"
  "ringtone|5 - REHAB"
  "coches-net|6 - COCHES.NET"
  "llegir|7 - GENCAT"
  "made-to-remember|8 - PAW - MADE TO REMEMBER"
  "cerca|9 - CERCA - ELS LIMITS NO EXISTEIXEN"
  "yuyo-calm|10 - YUYO CALM"
  "flooded|11 - FRANSIE"
  "por-culpa-del-amor|12 - DOLLAR"
)

only="${1:-}"
TMP="$(mktemp -d -t ladiegol)"
trap 'rm -rf "$TMP"' EXIT

# Imágenes de una carpeta en orden natural (2 antes que 10), como imgToWeb.
# "0 PORTADA" es una copia de 1.png: la portada va en "cover" del project.json.
images_in() {
  find "$1" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) ! -iname '*PORTADA*' | sort -V
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
  mkdir -p "$dst/img"
  echo "▶ $slug"

  # ---- stills → img/1.webp, 2.webp, … ----
  n=0
  while IFS= read -r still; do
    n=$((n + 1))
    ffmpeg -nostdin -v error -i "$still" -vf "$(fit $IMG_MAX)" -y "$TMP/still.png"
    cwebp -quiet -q $IMG_Q "$TMP/still.png" -o "$dst/img/$n.webp"
  done < <(images_in "$src_dir/stills")
  echo "    $n stills · $(du -sh "$dst/img" | cut -f1)"

  # ---- gif → img/loop.webm (con sus fps: el ritmo entrecortado del gif se queda) ----
  gif="$(find "$src_dir/gifs hover" -maxdepth 1 -type f -iname '*.gif' | sort | head -1)"
  if [ -n "$gif" ]; then
    # el gif de REHAB viene aplastado (4096×1502): la peli es 2,39:1, se le devuelve el alto
    pre=""
    [ "$slug" = "ringtone" ] && pre="scale=iw:trunc(iw/2.39/2)*2,"
    ffmpeg -nostdin -v error -i "$gif" -c:v libvpx -crf $LOOP_CRF -b:v $LOOP_BITRATE -cpu-used 5 \
      -lag-in-frames 16 -auto-alt-ref 1 -an -threads 4 \
      -vf "${pre}scale='min($LOOP_MAX,iw)':'min($LOOP_MAX,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
      -pix_fmt yuv420p -y "$dst/img/loop.webm"
    echo "    loop.webm: $(du -h "$dst/img/loop.webm" | cut -f1)"
  else
    echo "    ⚠️  sin gif de hover"
  fi

  echo "    total: $(du -sh "$dst" | cut -f1)"
done

echo
echo "✅ listo. Peso total de projects: $(du -sh "$OUT" | cut -f1)"
echo "   Recuerda poner en cada project.json sus "photos"."
