#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 01_health.sh - Sprawdzenie statusu API Detax.pl
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Status API                                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "URL: $DETAX_API"
echo ""

RESPONSE=$(curl -s "$DETAX_API/health" 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
    echo "✅ API online"
    echo ""
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ API offline lub niedostępne"
    echo ""
    echo "Uruchom Detax.pl:"
    echo "  cd /home/tom/github/founder-pl/detax"
    echo "  docker-compose up -d"
fi
