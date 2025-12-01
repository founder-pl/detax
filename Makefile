# Bielik MVP - Makefile

include .env
export

.PHONY: help up down logs api-logs frontend-logs ps build clean \
	package package-upload test

help:
	@echo "Dostępne komendy:"
	@echo "  make up           - uruchom docker compose (używa .env)"
	@echo "  make down         - zatrzymaj kontenery"
	@echo "  make logs         - logi wszystkich serwisów"
	@echo "  make api-logs     - logi backendu API"
	@echo "  make frontend-logs- logi frontendu"
	@echo "  make build        - zbuduj obrazy docker"
	@echo "  make ps           - status kontenerów"
	@echo "  make package      - zbuduj paczkę Pythona dla API (sdist+wheel)"
	@echo "  make package-upload - wyślij paczkę na PyPI/TestPyPI (wymaga twine)"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

api-logs:
	docker compose logs -f api

frontend-logs:
	docker compose logs -f frontend

ps:
	docker compose ps

build:
	docker compose build

clean:
	docker compose down -v || true
	rm -rf dist/ build/ *.egg-info

# --- Python package (modules/api jako paczka) ---

package:
	cd modules/api && python -m build

package-upload:
	cd modules/api && twine upload dist/*

