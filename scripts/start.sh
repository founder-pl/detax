#!/bin/bash
# Bielik MVP - Start Script
# Uruchamia stack Docker + używa lokalnej Ollamy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load .env if exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Defaults
API_PORT=${API_PORT:-8005}
FRONTEND_PORT=${FRONTEND_PORT:-3005}
 wczeOLLAMA_MODEL=${OLLAMA_MODEL:-qwen2.5:14b}
OLLAMA_MODEL_FALLBACK=${OLLAMA_MODEL_FALLBACK:-llama3.2}

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║     🦅 BIELIK MVP - Uruchamianie        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check local Ollama
echo -e "${BLUE}🤖 Sprawdzam lokalną Ollamę...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama nie jest zainstalowana!${NC}"
    echo "Zainstaluj: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

if ! curl -s http://localhost:11434/ &>/dev/null; then
    echo -e "${YELLOW}⚠ Ollama nie działa, uruchamiam...${NC}"
    ollama serve &>/dev/null &
    sleep 3
fi

if curl -s http://localhost:11434/ &>/dev/null; then
    echo -e "${GREEN}✓ Ollama działa (lokalna)${NC}"
else
    echo -e "${RED}❌ Nie można uruchomić Ollamy${NC}"
    echo "Spróbuj ręcznie: ollama serve"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker nie jest zainstalowany!${NC}"
    echo "Zainstaluj Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon nie działa!${NC}"
    echo "Uruchom Docker Desktop lub: sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}✓ Docker działa${NC}"

# Check docker compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose v2 nie jest dostępny!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose v2 dostępny${NC}"

# Check/pull model
echo ""
echo -e "${BLUE}🤖 Sprawdzam model: ${OLLAMA_MODEL}...${NC}"

# Funkcja do sprawdzenia czy model jest załadowany
check_model() {
    local model_name="$1"
    curl -s http://localhost:11434/api/tags 2>/dev/null | grep -q "\"name\":\"${model_name}\""
}

# Funkcja do pobrania modelu
pull_model() {
    local model_name="$1"
    echo -e "${YELLOW}⏳ Pobieram model ${model_name}...${NC}"
    if ollama pull "$model_name" 2>/dev/null; then
        echo -e "${GREEN}✓ Model ${model_name} pobrany${NC}"
        return 0
    else
        echo -e "${RED}✗ Nie udało się pobrać ${model_name}${NC}"
        return 1
    fi
}

# Sprawdź główny model
if check_model "$OLLAMA_MODEL"; then
    echo -e "${GREEN}✓ Model ${OLLAMA_MODEL} załadowany${NC}"
else
    # Próbuj pobrać główny model
    if ! pull_model "$OLLAMA_MODEL"; then
        # Fallback na zapasowy model
        echo -e "${YELLOW}⚠ Próbuję model zapasowy: ${OLLAMA_MODEL_FALLBACK}${NC}"
        if check_model "$OLLAMA_MODEL_FALLBACK"; then
            echo -e "${GREEN}✓ Model ${OLLAMA_MODEL_FALLBACK} załadowany${NC}"
            OLLAMA_MODEL="$OLLAMA_MODEL_FALLBACK"
        else
            pull_model "$OLLAMA_MODEL_FALLBACK" || true
            OLLAMA_MODEL="$OLLAMA_MODEL_FALLBACK"
        fi
    fi
fi

echo -e "${BLUE}   Używany model: ${OLLAMA_MODEL}${NC}"

# Start services
echo ""
echo -e "${BLUE}🚀 Uruchamiam serwisy Docker...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Czekam na start serwisów...${NC}"
sleep 5

# Check services
echo ""
echo -e "${BLUE}🔍 Sprawdzam status...${NC}"

# PostgreSQL
if docker compose exec -T postgres pg_isready -U bielik &>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL działa${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL uruchamia się...${NC}"
fi

# API
if curl -s http://localhost:${API_PORT}/ &>/dev/null; then
    echo -e "${GREEN}✓ API działa${NC}"
else
    echo -e "${YELLOW}⚠ API uruchamia się...${NC}"
fi

# Frontend
if curl -s http://localhost:${FRONTEND_PORT}/ &>/dev/null; then
    echo -e "${GREEN}✓ Frontend działa${NC}"
else
    echo -e "${YELLOW}⚠ Frontend uruchamia się...${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║           ✅ GOTOWE!                     ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  🌐 Frontend: http://localhost:${FRONTEND_PORT}      ║"
echo "║  📡 API:      http://localhost:${API_PORT}/docs ║"
echo "║  🤖 Ollama:   http://localhost:11434     ║"
echo "║  🗄️  PostgreSQL: localhost:5432          ║"
echo "║                                          ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Przydatne komendy:                      ║"
echo "║  • make logs                            ║"
echo "║  • make ps                              ║"
echo "║  • make stop                            ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Open browser (optional)
if command -v xdg-open &> /dev/null; then
    read -p "Otworzyć przeglądarkę? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:${FRONTEND_PORT}
    fi
elif command -v open &> /dev/null; then
    read -p "Otworzyć przeglądarkę? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:${FRONTEND_PORT}
    fi
fi
