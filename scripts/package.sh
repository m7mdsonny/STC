#!/usr/bin/env bash
set -euo pipefail

# Create a reproducible zip archive of the current repository state (tracked files only).
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

OUT_DIR="$ROOT/dist"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
REF="${1:-HEAD}"
ARCHIVE="$OUT_DIR/stc-solutions-${STAMP}.zip"

# Use git archive to avoid bundling untracked/generated files like node_modules or build artifacts.
git archive --format=zip --output="$ARCHIVE" "$REF"

# Provide a stable alias for the most recent archive.
ln -sf "$ARCHIVE" "$OUT_DIR/latest.zip"

echo "Created archive: $ARCHIVE"
echo "Latest archive symlink: $OUT_DIR/latest.zip"
