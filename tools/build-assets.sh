#!/usr/bin/env bash
# Convierte los originales (stills PNG + gifs de hover) en assets ligeros para la web.
#
#   ./tools/build-assets.sh              → procesa todos los proyectos
#   ./tools/build-assets.sh yuyo-calm    → procesa solo ese slug
#
# Origen  : $SRC (carpeta con "projects/N - NOMBRE/{stills,gifs hover}")
# Destino : _PROJECTS/<slug>/  → poster.webp, hover.webm, hover.mp4, 1.webp…n.webp
#
# Requiere ffmpeg y cwebp (brew install ffmpeg webp).

set -euo pipefail

SRC="${SRC:-$HOME/Desktop/ladiegol}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO/_PROJECTS"

# Ajustes (cámbialos aquí si algo pesa demasiado o se ve feo)
STILL_W=1600      # ancho de las fotos de la galería
POSTER_W=900      # ancho de la portada del grid de la home
WEBP_Q=80         # calidad webp 0-100
HOVER_W=960       # ancho del video de hover
HOVER_FPS=12      # fps del video de hover
HOVER_CRF=38      # calidad VP9: más alto = más ligero y más feo

# slug|carpeta de origen|still que se usa de portada (opcional, por defecto el 1)
MAP=(
  "are-you-one-of-us|1- CUPRA - ARE YOU ONE OF US?|1"
  "aftermatch|2 - FC BARCELONA - AFTERMATCH|5"
  "no-te-hace-falta|3 - LEROY MERLIN|1"
  "coches-net|4 - COCHES.NET|1"
  "llegir|5 - GENERALITAT|1"
  "yuyo-calm|6 - YUYO CALM|1"
)

only="${1:-}"

# Detecta las barras negras de una imagen y devuelve "w:h:x:y" (o vacío).
detect_crop() {
  ffmpeg -nostdin -hide_banner -f image2 -pattern_type none -loop 1 -t 0.2 -i "$1" \
    -vf "cropdetect=limit=0.05:round=2:skip=0:reset=0" -f null - 2>&1 \
    | grep -o "crop=[0-9]*:[0-9]*:[0-9]*:[0-9]*" | tail -1 | sed 's/^crop=//' || true
}

# Los stills de un proyecto son capturas del mismo reproductor, así que las barras
# negras son siempre las mismas. Un plano oscuro engaña al detector (recorta de más),
# así que nos quedamos con la UNIÓN de los recortes de todos los stills.
project_crop() {
  local dir="$1" x1=999999 y1=999999 x2=0 y2=0 found=0
  while IFS= read -r img; do
    local c; c="$(detect_crop "$img")"
    [ -z "$c" ] && continue
    local w h x y
    IFS=: read -r w h x y <<< "$c"
    [ "$x" -lt "$x1" ] && x1=$x
    [ "$y" -lt "$y1" ] && y1=$y
    [ $((x + w)) -gt "$x2" ] && x2=$((x + w))
    [ $((y + h)) -gt "$y2" ] && y2=$((y + h))
    found=1
  done < <(find "$dir" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort)
  [ "$found" -eq 0 ] && return

  # la unión puede salirse de la imagen: la recortamos a lo que existe de verdad
  local first size iw ih
  first="$(find "$dir" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort | head -1)"
  size="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$first")"
  IFS=, read -r iw ih <<< "$size"
  [ "$x2" -gt "$iw" ] && x2=$iw
  [ "$y2" -gt "$ih" ] && y2=$ih

  local w=$(((x2 - x1) / 2 * 2)) h=$(((y2 - y1) / 2 * 2))
  # si el recorte es casi toda la imagen, no recortamos nada
  [ "$w" -ge "$iw" ] && [ "$h" -ge "$ih" ] && return
  # con min() el recorte se adapta solo si algún still es más pequeño que los demás
  echo "crop=min($w\\,in_w-$x1):min($h\\,in_h-$y1):$x1:$y1"
}

for entry in "${MAP[@]}"; do
  IFS='|' read -r slug folder poster_n <<< "$entry"
  poster_n="${poster_n:-1}"
  [ -n "$only" ] && [ "$only" != "$slug" ] && continue

  src_dir="$SRC/projects/$folder"
  if [ ! -d "$src_dir" ]; then
    echo "  ⚠️  no encuentro $src_dir — me lo salto"
    continue
  fi

  dst="$OUT/$slug"
  mkdir -p "$dst"
  echo "▶ $slug"

  # ---- stills → 1.webp, 2.webp, … (recortando las barras negras) ----
  crop="$(project_crop "$src_dir/stills")"
  n=0
  while IFS= read -r still; do
    n=$((n + 1))
    tmp="$(mktemp -t ladiegol).png"
    ffmpeg -nostdin -v error -f image2 -pattern_type none -i "$still" -vf "${crop:+$crop,}scale='min($STILL_W,iw)':-2:flags=lanczos" -y "$tmp"
    cwebp -quiet -q $WEBP_Q "$tmp" -o "$dst/$n.webp"
    if [ "$n" -eq "$poster_n" ]; then
      ffmpeg -nostdin -v error -f image2 -pattern_type none -i "$still" -vf "${crop:+$crop,}scale='min($POSTER_W,iw)':-2:flags=lanczos" -y "$tmp"
      cwebp -quiet -q $WEBP_Q "$tmp" -o "$dst/poster.webp"
    fi
    rm -f "$tmp"
  done < <(find "$src_dir/stills" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort)
  echo "    $n stills · portada: still $poster_n · recorte: ${crop:-ninguno}"

  # ---- gif de hover → hover.webm (VP9) + hover.mp4 (fallback Safari viejo) ----
  gif="$(find "$src_dir" -type f -iname '*.gif' | sort | head -1)"
  if [ -n "$gif" ] && [ "$dst/hover.webm" -nt "$gif" ] && [ -z "${FORCE:-}" ]; then
    echo "    hover: ya estaba hecho (FORCE=1 para rehacerlo)"
  elif [ -n "$gif" ]; then
    vf="scale='min($HOVER_W,iw)':-2:flags=lanczos,fps=$HOVER_FPS"
    ffmpeg -nostdin -v error -i "$gif" -vf "$vf" -c:v libvpx-vp9 -crf $HOVER_CRF -b:v 0 \
      -an -row-mt 1 -pix_fmt yuv420p -y "$dst/hover.webm"
    ffmpeg -nostdin -v error -i "$gif" -vf "$vf" -c:v libx264 -crf 26 -preset slow \
      -an -pix_fmt yuv420p -movflags +faststart -y "$dst/hover.mp4"
    echo "    hover: $(du -h "$dst/hover.webm" | cut -f1) webm · $(du -h "$dst/hover.mp4" | cut -f1) mp4  (gif original: $(du -h "$gif" | cut -f1))"
  else
    echo "    ⚠️  sin gif de hover"
  fi

  echo "    total carpeta: $(du -sh "$dst" | cut -f1)"
done

echo
echo "✅ listo. Peso total de _PROJECTS: $(du -sh "$OUT" | cut -f1)"
echo "   Recuerda actualizar \"stills\" en data.json si ha cambiado el número de fotos."
