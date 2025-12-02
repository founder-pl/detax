#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 05_zus_module.sh - Moduł ZUS (składki społeczne)
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Moduł ZUS                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

QUESTIONS=(
    "Jakie składki ZUS płaci przedsiębiorca w 2025?"
    "Co to jest mały ZUS plus?"
    "Kiedy można skorzystać z ulgi na start?"
)

for Q in "${QUESTIONS[@]}"; do
    echo "❓ $Q"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$DETAX_API/api/v1/chat" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$Q\", \"module\": \"zus\"}" 2>/dev/null)
    
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

echo "Więcej pytań: ./02_ask_question.sh \"pytanie\" zus"
