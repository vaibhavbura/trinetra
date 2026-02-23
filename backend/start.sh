#!/usr/bin/env bash
set -euo pipefail

# Render sets PORT automatically
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
