#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 03_ksef_module.sh - Moduł KSeF (Krajowy System e-Faktur)
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Moduł KSeF                                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

QUESTIONS=(
    "Kiedy KSeF będzie obowiązkowy?"
    "Jakie są wymagania techniczne KSeF?"
    "Kto jest zwolniony z KSeF?"
)

for Q in "${QUESTIONS[@]}"; do
    echo "❓ $Q"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$DETAX_API/api/v1/chat" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$Q\", \"module\": \"ksef\"}" 2>/dev/null)
    
    echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    answer = data.get('response') or data.get('answer') or str(data)
    # Skróć odpowiedź
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

echo "Więcej pytań: ./02_ask_question.sh \"pytanie\" ksef"
