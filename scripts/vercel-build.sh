#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Enabling Corepack-managed Yarn..."
corepack enable

echo "Installing dependencies..."
yarn install --immutable

echo "Building apps/web..."
yarn --cwd apps/web build

echo "Building apps/admin..."
yarn --cwd apps/admin build

echo "Building apps/chatgpt-app..."
yarn --cwd apps/chatgpt-app build

echo "Vercel helper build completed."
