# Detax.pl - Przykłady użycia API

Przykłady użycia API i CLI Detax.pl - AI Asystenta dla przedsiębiorców.

## Szybki start

```bash
# 1. Nadaj uprawnienia
chmod +x *.sh

# 2. Sprawdź status API
./01_health.sh

# 3. Zadaj pytanie
./02_ask_question.sh "Kiedy KSeF będzie obowiązkowy?"

# 4. Użyj modułu KSeF
./03_ksef_module.sh

# 5. Użyj modułu B2B
./04_b2b_module.sh
```

## Lista skryptów

| Skrypt | Opis |
|--------|------|
| `01_health.sh` | Sprawdzenie statusu API |
| `02_ask_question.sh` | Zadanie pytania do AI |
| `03_ksef_module.sh` | Moduł KSeF - e-Faktury |
| `04_b2b_module.sh` | Moduł B2B - umowy |
| `05_zus_module.sh` | Moduł ZUS - składki |
| `06_vat_module.sh` | Moduł VAT - rozliczenia |
| `07_interactive.sh` | Tryb interaktywny |
| `08_full_demo.sh` | Pełna demonstracja |

## CLI

```bash
# Instalacja
chmod +x ../cli/detax

# Użycie
../cli/detax ask "Pytanie"
../cli/detax ksef "Pytanie o KSeF"
../cli/detax b2b "Pytanie o B2B"
../cli/detax zus "Pytanie o ZUS"
../cli/detax vat "Pytanie o VAT"
../cli/detax interactive
```

## Moduły AI

| Moduł | Opis |
|-------|------|
| `default` | Ogólne pytania o prawo i podatki |
| `ksef` | Krajowy System e-Faktur |
| `b2b` | Umowy B2B, ryzyko, kryteria PIP |
| `zus` | Składki społeczne i zdrowotne |
| `vat` | JPK, VAT OSS, rozliczenia |

## API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/health` | GET | Status API |
| `/api/v1/chat` | POST | Czat z AI |
| `/api/v1/modules` | GET | Lista modułów |

## Przykład API

```bash
curl -X POST http://localhost:8005/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Kiedy KSeF będzie obowiązkowy?",
    "module": "ksef"
  }'
```

## Konfiguracja

```bash
export DETAX_API_URL=http://localhost:8005
```

## Demo konto

```
Email: demo@detax.pl
Hasło: demo123
```
