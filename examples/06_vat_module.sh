#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 06_vat_module.sh - Moduł VAT (rozliczenia)
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Moduł VAT                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

QUESTIONS=(
    "Kiedy trzeba zarejestrować się jako podatnik VAT?"
    "Co to jest JPK_VAT?"
    "Jak działa VAT OSS?"
)

for Q in "${QUESTIONS[@]}"; do
    echo "❓ $Q"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$DETAX_API/api/v1/chat" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$Q\", \"module\": \"vat\"}" 2>/dev/null)
    
    echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    answer = data.get('response') or data.get('answer') or str(data)
    if len(answer) > 500:
        answer = answer[:500] + '...'
    print(answer)
except:
    pass
" 2>/dev/null
    
    echo ""
    echo "─────────────────────────────────────────────────────────────"
    echo ""
done

echo "Więcej pytań: ./02_ask_question.sh \"pytanie\" vat"
