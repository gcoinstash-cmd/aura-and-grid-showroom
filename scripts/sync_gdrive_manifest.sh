#!/usr/bin/env bash
# ==============================================================================
# GhostFactoryOS × Aura & Grid — Google Drive Vault Backup & Manifest Sync
# ==============================================================================
# Synchronizes core dealership documentation, catalog schemas, and the
# Acquire.com Tier 1 Micro-APA Pilot data room (`docs/`, `catalog/`,
# `packages/track3-acquire-pilot/`, and `CATALOG_MANIFEST.json`) to Google Drive.
#
# Strictly excludes heavy transient directories (`node_modules/`, `.git/`,
# `__pycache__/`, `.venv/`, `.pytest_cache/`, `dist/`, `.vite/`, `.DS_Store`)
# to prevent cloud file-provider locks and inode saturation.
#
# Usage:
#   ./scripts/sync_gdrive_manifest.sh [--dry-run] [DEST_DIR]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DRY_RUN_FLAG=""
if [[ "${1:-}" == "--dry-run" || "${1:-}" == "-n" ]]; then
  DRY_RUN_FLAG="--dry-run"
  shift
fi

# Resolve default Google Drive backup destination
DEFAULT_GDRIVE_VAULT="${HOME}/Google Drive/My Drive/Ghost_Factory_Master_Vault"
FALLBACK_GDRIVE_VAULT="${HOME}/Google Drive/AuraGrid_Vault_Backup"

if [[ -n "${1:-}" ]]; then
  DEST_ROOT="$1"
elif [[ -d "${HOME}/Google Drive/My Drive" ]]; then
  DEST_ROOT="${DEFAULT_GDRIVE_VAULT}"
else
  DEST_ROOT="${FALLBACK_GDRIVE_VAULT}"
fi

RSYNC_EXCLUDES=(
  --exclude='node_modules'
  --exclude='node_modules/**'
  --exclude='.git'
  --exclude='.git/**'
  --exclude='__pycache__'
  --exclude='__pycache__/**'
  --exclude='.venv'
  --exclude='.venv/**'
  --exclude='venv'
  --exclude='.pytest_cache'
  --exclude='.pytest_cache/**'
  --exclude='dist'
  --exclude='dist/**'
  --exclude='.vite'
  --exclude='.DS_Store'
  --exclude='*.pyc'
  --exclude='*.pyo'
  --exclude='*.tmp'
  --exclude='*.log'
)

echo "=================================================================="
echo "GhostFactoryOS x Aura & Grid — Google Drive Manifest Sync"
echo "Source Root : ${PROJECT_ROOT}"
echo "Target Vault: ${DEST_ROOT}"
echo "Mode        : ${DRY_RUN_FLAG:-LIVE_SYNC}"
echo "=================================================================="

# Ensure target subdirectories exist when writable (or for dry-run destination resolution)
mkdir -p "${DEST_ROOT}/docs" "${DEST_ROOT}/catalog" "${DEST_ROOT}/packages/track3-acquire-pilot" 2>/dev/null || true

# 1. Sync Master Catalog Manifest
echo "[1/4] Syncing CATALOG_MANIFEST.json..."
rsync -av ${DRY_RUN_FLAG} "${RSYNC_EXCLUDES[@]}" \
  "${PROJECT_ROOT}/CATALOG_MANIFEST.json" \
  "${DEST_ROOT}/CATALOG_MANIFEST.json"

# 2. Sync Dealership Documentation & Audits (docs/)
echo "[2/4] Syncing docs/ (including audits/ACQUIRE_TIER1_STRATEGY.md)..."
rsync -av ${DRY_RUN_FLAG} "${RSYNC_EXCLUDES[@]}" \
  "${PROJECT_ROOT}/docs/" \
  "${DEST_ROOT}/docs/"

# 3. Sync Catalog Schemas & Engine Blueprints (catalog/)
if [[ -d "${PROJECT_ROOT}/catalog" ]]; then
  echo "[3/4] Syncing catalog/..."
  rsync -av ${DRY_RUN_FLAG} "${RSYNC_EXCLUDES[@]}" \
    "${PROJECT_ROOT}/catalog/" \
    "${DEST_ROOT}/catalog/"
fi

# 4. Sync Acquire.com Tier 1 Micro-APA Pilot Bundle (packages/track3-acquire-pilot/)
echo "[4/4] Syncing packages/track3-acquire-pilot/..."
rsync -av ${DRY_RUN_FLAG} "${RSYNC_EXCLUDES[@]}" \
  "${PROJECT_ROOT}/packages/track3-acquire-pilot/" \
  "${DEST_ROOT}/packages/track3-acquire-pilot/"

echo "=================================================================="
echo "Sync routine completed successfully (${DRY_RUN_FLAG:-LIVE_SYNC})."
echo "=================================================================="
