#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 02_ask_question.sh - Zadanie pytania do AI
# ═══════════════════════════════════════════════════════════════

DETAX_API="${DETAX_API_URL:-http://localhost:8005}"

QUESTION="${1:-Jakie są podstawowe obowiązki przedsiębiorcy w Polsce?}"
MODULE="${2:-default}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Detax.pl - Pytanie do AI                                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Moduł:   $MODULE"
echo "Pytanie: $QUESTION"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Odpowiedź:"
echo ""

RESPONSE=$(curl -s -X POST "$DETAX_API/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"$QUESTION\",
    \"module\": \"$MODULE\"
  }" 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
    echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    answer = data.get('response') or data.get('answer') or data.get('content') or str(data)
    print(answer)
except Exception as e:
    print(f'Błąd: {e}')
" 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Błąd połączenia z API"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
