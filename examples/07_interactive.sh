#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 07_interactive.sh - Tryb interaktywny
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Tryb interaktywny                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Sprawdź czy CLI istnieje
if [ -f "$SCRIPT_DIR/../cli/detax-cli.py" ]; then
    python3 "$SCRIPT_DIR/../cli/detax-cli.py" interactive "$@"
else
    echo "CLI nie znalezione. Użyj bezpośrednio API:"
    echo ""
    echo "  curl -X POST http://localhost:8005/api/v1/chat \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"message\": \"pytanie\", \"module\": \"default\"}'"
fi
