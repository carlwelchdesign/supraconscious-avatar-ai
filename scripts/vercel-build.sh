#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAUNCHER="$ROOT_DIR/.yarn/releases/yarn-4.cjs"
if [ ! -f "$LAUNCHER" ]; then
  echo "Yarn launcher not found at $LAUNCHER"
  exit 1
fi

echo "Running repository Yarn launcher install..."
node "$LAUNCHER" install --immutable

echo "Building apps/web..."
node "$LAUNCHER" --cwd apps/web build

echo "Building apps/admin..."
node "$LAUNCHER" --cwd apps/admin build

echo "Building apps/chatgpt-app..."
node "$LAUNCHER" --cwd apps/chatgpt-app build

echo "Vercel helper build completed."
