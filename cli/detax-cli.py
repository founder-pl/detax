#!/usr/bin/env python3
"""
Detax.pl CLI - Interfejs wiersza poleceń
DSL do interakcji z AI Asystentem dla przedsiębiorców
"""

import argparse
import json
import os
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("Instaluję requests...")
    os.system("pip install requests")
    import requests

# Konfiguracja
API_URL = os.getenv("DETAX_API_URL", "http://localhost:8005")
TOKEN_FILE = os.path.expanduser("~/.detax_token")
HISTORY_FILE = os.path.expanduser("~/.detax_history")

# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def save_token(token: str):
    with open(TOKEN_FILE, "w") as f:
        f.write(token)

def load_token() -> str:
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return f.read().strip()
    return None

def get_headers():
    token = load_token()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def save_history(question: str, answer: str, module: str):
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            try:
                history = json.load(f)
            except:
                history = []
    
    history.append({
        "timestamp": datetime.now().isoformat(),
        "module": module,
        "question": question,
        "answer": answer[:500]
    })
    
    # Zachowaj ostatnie 100 wpisów
    history = history[-100:]
    
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def print_wrapped(text: str, width: int = 80):
    """Drukuj tekst z zawijaniem"""
    words = text.split()
    line = ""
    for word in words:
        if len(line) + len(word) + 1 <= width:
            line += (" " if line else "") + word
        else:
            print(line)
            line = word
    if line:
        print(line)

# ═══════════════════════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════════════════════

def cmd_ask(args):
    """Zadaj pytanie AI"""
    question = args.question or input("Pytanie: ")
    module = args.module or "default"
    
    print(f"\n🤖 Detax AI ({module})\n")
    print(f"❓ {question}\n")
    print("─" * 60)
    print("Odpowiedź:\n")
    
    try:
        r = requests.post(f"{API_URL}/api/v1/chat", headers=get_headers(), json={
            "message": question,
            "module": module
        }, timeout=120)
        
        if r.status_code == 200:
            data = r.json()
            answer = data.get("response") or data.get("answer") or data.get("content") or str(data)
            print_wrapped(answer)
            save_history(question, answer, module)
        else:
            print(f"❌ Błąd: {r.text}")
    except requests.exceptions.Timeout:
        print("⏱️ Przekroczono czas oczekiwania. AI generuje odpowiedź...")
    except Exception as e:
        print(f"❌ Błąd połączenia: {e}")
    
    print("\n" + "─" * 60)

def cmd_ksef(args):
    """Pytania o KSeF"""
    args.module = "ksef"
    cmd_ask(args)

def cmd_b2b(args):
    """Pytania o umowy B2B"""
    args.module = "b2b"
    cmd_ask(args)

def cmd_zus(args):
    """Pytania o ZUS"""
    args.module = "zus"
    cmd_ask(args)

def cmd_vat(args):
    """Pytania o VAT"""
    args.module = "vat"
    cmd_ask(args)

def cmd_modules(args):
    """Lista dostępnych modułów"""
    print("\n📚 Dostępne moduły Detax.pl:\n")
    
    modules = [
        ("default", "Ogólne pytania", "Pytania o prawo, podatki, działalność"),
        ("ksef", "KSeF", "Krajowy System e-Faktur, terminy, wymagania"),
        ("b2b", "B2B", "Umowy B2B, ryzyko, kryteria PIP"),
        ("zus", "ZUS", "Składki społeczne i zdrowotne"),
        ("vat", "VAT", "JPK, VAT OSS, rozliczenia"),
    ]
    
    for mid, name, desc in modules:
        print(f"  📖 {mid:<10} - {name}")
        print(f"     {desc}\n")
    
    print("Użycie: detax ask --module <moduł> \"pytanie\"")
    print("   lub: detax ksef \"pytanie\"")

def cmd_history(args):
    """Historia rozmów"""
    if not os.path.exists(HISTORY_FILE):
        print("📭 Brak historii")
        return
    
    with open(HISTORY_FILE, "r") as f:
        history = json.load(f)
    
    limit = args.limit or 10
    history = history[-limit:]
    
    print(f"\n📜 Historia ({len(history)} ostatnich):\n")
    
    for i, h in enumerate(history, 1):
        print(f"{i}. [{h['module']}] {h['timestamp'][:10]}")
        print(f"   Q: {h['question'][:60]}...")
        print(f"   A: {h['answer'][:60]}...")
        print()

def cmd_clear_history(args):
    """Wyczyść historię"""
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)
    print("✅ Historia wyczyszczona")

def cmd_health(args):
    """Sprawdź status API"""
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Detax.pl API: online")
            print(f"   URL: {API_URL}")
            if "model" in data:
                print(f"   Model: {data['model']}")
        else:
            print(f"⚠️ Status: {r.status_code}")
    except Exception as e:
        print(f"❌ Nie można połączyć z {API_URL}")
        print(f"   Błąd: {e}")

def cmd_interactive(args):
    """Tryb interaktywny"""
    module = args.module or "default"
    
    print(f"\n🤖 Detax.pl - Tryb interaktywny (moduł: {module})")
    print("   Wpisz 'quit' aby wyjść, 'module <nazwa>' aby zmienić moduł\n")
    
    while True:
        try:
            question = input("❓ ").strip()
            
            if not question:
                continue
            
            if question.lower() == "quit":
                print("👋 Do widzenia!")
                break
            
            if question.lower().startswith("module "):
                module = question.split(" ", 1)[1]
                print(f"📖 Zmieniono moduł na: {module}")
                continue
            
            args.question = question
            args.module = module
            cmd_ask(args)
            
        except KeyboardInterrupt:
            print("\n👋 Do widzenia!")
            break
        except EOFError:
            break

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Detax.pl CLI - AI Asystent dla przedsiębiorców",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Przykłady:
  detax ask "Kiedy KSeF będzie obowiązkowy?"
  detax ksef "Jakie są wymagania KSeF?"
  detax b2b "Czy moja umowa B2B jest bezpieczna?"
  detax zus "Jakie składki płaci przedsiębiorca?"
  detax vat "Jak rozliczyć VAT OSS?"
  detax interactive --module ksef
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Dostępne komendy")
    
    # ask
    p = subparsers.add_parser("ask", help="Zadaj pytanie")
    p.add_argument("question", nargs="?", help="Pytanie")
    p.add_argument("-m", "--module", default="default", help="Moduł (ksef, b2b, zus, vat)")
    p.set_defaults(func=cmd_ask)
    
    # ksef
    p = subparsers.add_parser("ksef", help="Pytania o KSeF")
    p.add_argument("question", nargs="?", help="Pytanie")
    p.set_defaults(func=cmd_ksef)
    
    # b2b
    p = subparsers.add_parser("b2b", help="Pytania o B2B")
    p.add_argument("question", nargs="?", help="Pytanie")
    p.set_defaults(func=cmd_b2b)
    
    # zus
    p = subparsers.add_parser("zus", help="Pytania o ZUS")
    p.add_argument("question", nargs="?", help="Pytanie")
    p.set_defaults(func=cmd_zus)
    
    # vat
    p = subparsers.add_parser("vat", help="Pytania o VAT")
    p.add_argument("question", nargs="?", help="Pytanie")
    p.set_defaults(func=cmd_vat)
    
    # modules
    p = subparsers.add_parser("modules", help="Lista modułów")
    p.set_defaults(func=cmd_modules)
    
    # history
    p = subparsers.add_parser("history", help="Historia rozmów")
    p.add_argument("-n", "--limit", type=int, default=10, help="Liczba wpisów")
    p.set_defaults(func=cmd_history)
    
    # clear-history
    p = subparsers.add_parser("clear-history", help="Wyczyść historię")
    p.set_defaults(func=cmd_clear_history)
    
    # health
    p = subparsers.add_parser("health", help="Status API")
    p.set_defaults(func=cmd_health)
    
    # interactive
    p = subparsers.add_parser("interactive", aliases=["i"], help="Tryb interaktywny")
    p.add_argument("-m", "--module", default="default", help="Moduł startowy")
    p.set_defaults(func=cmd_interactive)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        sys.exit(0)
    
    args.func(args)

if __name__ == "__main__":
    main()
