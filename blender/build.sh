#!/usr/bin/env sh
# Linux and macOS: runs blender/build.py to make blender/saah.blend, src/data/saah.glb and src/data/strata.webp.
#   blender/build.sh             build the .blend and the web assets
#   blender/build.sh --render    also render docs/render-hero.jpg and docs/render-nisar.jpg with Cycles
# Needs Blender 5.2 or later. Set BLENDER=/path/to/blender if it is not found.
set -e
cd "$(dirname "$0")/.."
for b in "$BLENDER" blender "$HOME"/.local/opt/blender-*/blender /Applications/Blender.app/Contents/MacOS/Blender /snap/bin/blender; do
  if command -v "$b" >/dev/null 2>&1; then exec "$b" -b -P blender/build.py -- "$@"; fi
done
echo "Blender not found. Install 5.2 or later from https://www.blender.org/download/ or set BLENDER=/path/to/blender" >&2
exit 1
