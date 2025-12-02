#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 04_b2b_module.sh - Moduł B2B (umowy, ryzyko)
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Moduł B2B                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

QUESTIONS=(
    "Jakie są kryteria PIP dla umów B2B?"
    "Kiedy umowa B2B może być uznana za stosunek pracy?"
    "Jak bezpiecznie zawrzeć umowę B2B?"
)

for Q in "${QUESTIONS[@]}"; do
    echo "❓ $Q"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$DETAX_API/api/v1/chat" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$Q\", \"module\": \"b2b\"}" 2>/dev/null)
    
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

echo "Więcej pytań: ./02_ask_question.sh \"pytanie\" b2b"
