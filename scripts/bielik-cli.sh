#!/bin/bash
#
# 🦅 BIELIK CLI - Shell DSL for CQRS Event Sourcing API
# ======================================================
# Kontrola API przez polecenia shell
#
# Użycie:
#   ./bielik-cli.sh <command> [options]
#
# Przykłady:
#   ./bielik-cli.sh health
#   ./bielik-cli.sh doc:create "Tytuł" "ksef" "Treść dokumentu"
#   ./bielik-cli.sh chat "Kiedy KSeF będzie obowiązkowy?" --module ksef
#   ./bielik-cli.sh events:list documents 1
#

set -e

# ============================================
# KONFIGURACJA
# ============================================

API_BASE="${BIELIK_API_URL:-http://localhost:8005}"
API_V1="${API_BASE}/api/v1"
VERBOSE="${BIELIK_VERBOSE:-false}"

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ============================================
# FUNKCJE POMOCNICZE
# ============================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_debug() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${CYAN}🔍${NC} $1"
    fi
}

# Formatowanie JSON
format_json() {
    if command -v python3 &> /dev/null; then
        python3 -m json.tool 2>/dev/null || cat
    elif command -v jq &> /dev/null; then
        jq . 2>/dev/null || cat
    else
        cat
    fi
}

# HTTP GET
http_get() {
    local endpoint="$1"
    log_debug "GET ${API_V1}${endpoint}"
    curl -s "${API_V1}${endpoint}"
}

# HTTP POST
http_post() {
    local endpoint="$1"
    local data="$2"
    log_debug "POST ${API_V1}${endpoint}"
    log_debug "Data: $data"
    curl -s -X POST "${API_V1}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "$data"
}

# HTTP DELETE
http_delete() {
    local endpoint="$1"
    log_debug "DELETE ${API_V1}${endpoint}"
    curl -s -X DELETE "${API_V1}${endpoint}"
}

# ============================================
# HEALTH & STATUS
# ============================================

cmd_health() {
    echo -e "${BOLD}🦅 Bielik System Health${NC}"
    echo "================================"
    
    local response=$(curl -s "${API_BASE}/health")
    local status=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null)
    
    if [ "$status" = "healthy" ]; then
        log_success "System is healthy"
    else
        log_warning "System status: $status"
    fi
    
    echo ""
    echo "$response" | format_json
}

cmd_status() {
    echo -e "${BOLD}📊 System Status${NC}"
    echo "================================"
    
    echo -e "\n${CYAN}API:${NC}"
    curl -s "${API_BASE}/" | format_json
    
    echo -e "\n${CYAN}Documents:${NC}"
    local doc_count=$(http_get "/documents" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
    echo "  Total documents: $doc_count"
    
    echo -e "\n${CYAN}Projects:${NC}"
    local proj_count=$(http_get "/projects" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
    echo "  Total projects: $proj_count"
    
    echo -e "\n${CYAN}Sources:${NC}"
    local src_count=$(http_get "/sources" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
    echo "  Available sources: $src_count"
}

# ============================================
# DOCUMENTS - CQRS COMMANDS
# ============================================

cmd_doc_list() {
    echo -e "${BOLD}📄 Documents List${NC}"
    echo "================================"
    http_get "/documents" | format_json
}

cmd_doc_get() {
    local id="$1"
    if [ -z "$id" ]; then
        log_error "Usage: doc:get <id>"
        exit 1
    fi
    
    echo -e "${BOLD}📄 Document #${id}${NC}"
    echo "================================"
    http_get "/documents/${id}" | format_json
}

cmd_doc_create() {
    local title="$1"
    local category="$2"
    local content="$3"
    local source="${4:-}"
    
    if [ -z "$title" ] || [ -z "$category" ] || [ -z "$content" ]; then
        log_error "Usage: doc:create <title> <category> <content> [source]"
        log_info "Categories: ksef, b2b, zus, vat"
        exit 1
    fi
    
    echo -e "${BOLD}📝 Creating Document${NC}"
    echo "================================"
    log_info "Title: $title"
    log_info "Category: $category"
    
    local json_data=$(python3 -c "
import json
print(json.dumps({
    'title': '''$title''',
    'category': '''$category''',
    'content': '''$content''',
    'source': '''$source''' if '''$source''' else None
}))
")
    
    local response=$(http_post "/commands/documents/create" "$json_data")
    local doc_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
    
    if [ -n "$doc_id" ]; then
        log_success "Document created with ID: $doc_id"
        echo ""
        echo "$response" | format_json
        
        # Show event
        echo -e "\n${CYAN}📜 Event Created:${NC}"
        http_get "/events/documents/${doc_id}" | format_json
    else
        log_error "Failed to create document"
        echo "$response"
    fi
}

cmd_doc_update() {
    local id="$1"
    local title="$2"
    local category="$3"
    local content="$4"
    
    if [ -z "$id" ] || [ -z "$title" ] || [ -z "$category" ] || [ -z "$content" ]; then
        log_error "Usage: doc:update <id> <title> <category> <content>"
        exit 1
    fi
    
    echo -e "${BOLD}✏️ Updating Document #${id}${NC}"
    echo "================================"
    
    local json_data=$(python3 -c "
import json
print(json.dumps({
    'id': $id,
    'title': '''$title''',
    'category': '''$category''',
    'content': '''$content'''
}))
")
    
    local response=$(http_post "/commands/documents/update" "$json_data")
    log_success "Document updated"
    echo "$response" | format_json
    
    # Show events
    echo -e "\n${CYAN}📜 Event History:${NC}"
    http_get "/events/documents/${id}" | format_json
}

cmd_doc_delete() {
    local id="$1"
    
    if [ -z "$id" ]; then
        log_error "Usage: doc:delete <id>"
        exit 1
    fi
    
    echo -e "${BOLD}🗑️ Deleting Document #${id}${NC}"
    echo "================================"
    
    local response=$(http_post "/commands/documents/delete" "{\"id\": $id}")
    log_success "Document deleted"
    echo "$response" | format_json
    
    # Show final events
    echo -e "\n${CYAN}📜 Final Event History:${NC}"
    http_get "/events/documents/${id}" | format_json
}

cmd_doc_stats() {
    echo -e "${BOLD}📊 Document Statistics${NC}"
    echo "================================"
    http_get "/documents/stats" | format_json
}

# ============================================
# PROJECTS - CQRS COMMANDS
# ============================================

cmd_project_list() {
    local contact="$1"
    
    echo -e "${BOLD}📁 Projects List${NC}"
    echo "================================"
    
    if [ -n "$contact" ]; then
        log_info "Filtering by contact: $contact"
        http_get "/projects?contact=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$contact'))")" | format_json
    else
        http_get "/projects" | format_json
    fi
}

cmd_project_get() {
    local id="$1"
    
    if [ -z "$id" ]; then
        log_error "Usage: project:get <id>"
        exit 1
    fi
    
    echo -e "${BOLD}📁 Project #${id}${NC}"
    echo "================================"
    http_get "/projects/${id}" | format_json
    
    echo -e "\n${CYAN}📄 Project Files:${NC}"
    http_get "/projects/${id}/files" | format_json
}

cmd_project_create() {
    local name="$1"
    local description="$2"
    local contact="$3"
    
    if [ -z "$name" ]; then
        log_error "Usage: project:create <name> [description] [contact]"
        exit 1
    fi
    
    echo -e "${BOLD}📁 Creating Project${NC}"
    echo "================================"
    log_info "Name: $name"
    
    local json_data=$(python3 -c "
import json
print(json.dumps({
    'name': '''$name''',
    'description': '''${description:-}''',
    'contact': '''${contact:-}'''
}))
")
    
    local response=$(http_post "/commands/projects/create" "$json_data")
    local proj_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
    
    if [ -n "$proj_id" ]; then
        log_success "Project created with ID: $proj_id"
        echo ""
        echo "$response" | format_json
        
        # Show event
        echo -e "\n${CYAN}📜 Event Created:${NC}"
        http_get "/events/projects/${proj_id}" | format_json
    else
        log_error "Failed to create project"
        echo "$response"
    fi
}

cmd_project_delete() {
    local id="$1"
    
    if [ -z "$id" ]; then
        log_error "Usage: project:delete <id>"
        exit 1
    fi
    
    echo -e "${BOLD}🗑️ Deleting Project #${id}${NC}"
    echo "================================"
    
    local response=$(http_post "/commands/projects/delete" "{\"id\": $id}")
    log_success "Project deleted"
    echo "$response" | format_json
}

cmd_project_add_file() {
    local project_id="$1"
    local filename="$2"
    local path="$3"
    
    if [ -z "$project_id" ] || [ -z "$filename" ]; then
        log_error "Usage: project:add-file <project_id> <filename> [path]"
        exit 1
    fi
    
    echo -e "${BOLD}📎 Adding File to Project #${project_id}${NC}"
    echo "================================"
    
    local json_data=$(python3 -c "
import json
print(json.dumps({
    'project_id': $project_id,
    'filename': '''$filename''',
    'path': '''${path:-}'''
}))
")
    
    local response=$(http_post "/commands/projects/files/add" "$json_data")
    log_success "File added"
    echo "$response" | format_json
}

# ============================================
# EVENTS
# ============================================

cmd_events_list() {
    local type="$1"  # documents, projects
    local id="$2"
    
    if [ -z "$type" ] || [ -z "$id" ]; then
        log_error "Usage: events:list <type> <id>"
        log_info "Types: documents, projects"
        exit 1
    fi
    
    echo -e "${BOLD}📜 Event History: ${type} #${id}${NC}"
    echo "================================"
    http_get "/events/${type}/${id}" | format_json
}

# ============================================
# CHAT
# ============================================

cmd_chat() {
    local message="$1"
    local module="${2:-default}"
    
    if [ -z "$message" ]; then
        log_error "Usage: chat <message> [module]"
        log_info "Modules: default, ksef, b2b, zus, vat"
        exit 1
    fi
    
    echo -e "${BOLD}💬 Chat with Bielik${NC}"
    echo "================================"
    log_info "Module: $module"
    log_info "Question: $message"
    echo ""
    
    local json_data=$(python3 -c "
import json
print(json.dumps({
    'message': '''$message''',
    'module': '''$module'''
}))
")
    
    local response=$(http_post "/chat" "$json_data")
    
    echo -e "${CYAN}🦅 Bielik:${NC}"
    echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('response', 'No response'))
print()
sources = data.get('sources', [])
if sources:
    print('📚 Sources:')
    for s in sources:
        sim = int(s.get('similarity', 0) * 100)
        print(f\"  - {s.get('title', 'Unknown')} ({sim}%)\")
" 2>/dev/null || echo "$response" | format_json
}

# ============================================
# CONTEXT
# ============================================

cmd_context_hierarchy() {
    echo -e "${BOLD}🏗️ Context Hierarchy${NC}"
    echo "================================"
    http_get "/context/hierarchy" | format_json
}

cmd_context_channels() {
    local contact="$1"
    local project_id="$2"
    
    echo -e "${BOLD}📢 Recommended Channels${NC}"
    echo "================================"
    
    local params=""
    if [ -n "$contact" ]; then
        params="contact=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$contact'))")"
    fi
    if [ -n "$project_id" ]; then
        [ -n "$params" ] && params="${params}&"
        params="${params}project_id=${project_id}"
    fi
    
    http_get "/context/channels?${params}" | format_json
}

# ============================================
# SOURCES
# ============================================

cmd_sources_list() {
    local type="$1"
    
    echo -e "${BOLD}🔗 Data Sources${NC}"
    echo "================================"
    
    if [ -n "$type" ]; then
        log_info "Filtering by type: $type"
        http_get "/sources?source_type=${type}" | format_json
    else
        http_get "/sources" | format_json
    fi
}

cmd_sources_legal() {
    echo -e "${BOLD}📜 Key Legal Documents${NC}"
    echo "================================"
    http_get "/legal-documents" | format_json
}

cmd_verify() {
    local type="$1"
    local identifier="$2"
    
    if [ -z "$type" ] || [ -z "$identifier" ]; then
        log_error "Usage: verify <type> <identifier>"
        log_info "Types: nip, krs, vat_eu"
        log_info "Example: verify vat_eu PL5260250995"
        exit 1
    fi
    
    echo -e "${BOLD}🔍 Verifying ${type}: ${identifier}${NC}"
    echo "================================"
    
    local json_data="{\"type\": \"$type\", \"identifier\": \"$identifier\"}"
    http_post "/verify" "$json_data" | format_json
}

cmd_verify_vat() {
    local vat_number="$1"
    
    if [ -z "$vat_number" ]; then
        log_error "Usage: verify:vat <vat_number>"
        log_info "Example: verify:vat PL5260250995"
        exit 1
    fi
    
    echo -e "${BOLD}🔍 Verifying VAT: ${vat_number}${NC}"
    echo "================================"
    http_get "/verify/vat/${vat_number}" | format_json
}

# ============================================
# INTERACTIVE MODE
# ============================================

cmd_interactive() {
    echo -e "${BOLD}🦅 Bielik CLI - Interactive Mode${NC}"
    echo "================================"
    echo "Type 'help' for available commands, 'exit' to quit"
    echo ""
    
    while true; do
        echo -en "${GREEN}bielik>${NC} "
        read -r line
        
        if [ "$line" = "exit" ] || [ "$line" = "quit" ]; then
            echo "Bye! 👋"
            break
        fi
        
        if [ -z "$line" ]; then
            continue
        fi
        
        # Execute command
        eval "$0 $line" 2>&1 || true
        echo ""
    done
}

# ============================================
# HELP
# ============================================

cmd_help() {
    echo -e "${BOLD}🦅 Bielik CLI - Shell DSL for CQRS Event Sourcing API${NC}"
    echo "========================================================"
    echo ""
    echo -e "${CYAN}USAGE:${NC}"
    echo "  ./bielik-cli.sh <command> [options]"
    echo ""
    echo -e "${CYAN}HEALTH & STATUS:${NC}"
    echo "  health              Check system health"
    echo "  status              Show system status"
    echo ""
    echo -e "${CYAN}DOCUMENTS (CQRS):${NC}"
    echo "  doc:list            List all documents"
    echo "  doc:get <id>        Get document by ID"
    echo "  doc:create <title> <category> <content> [source]"
    echo "                      Create new document"
    echo "  doc:update <id> <title> <category> <content>"
    echo "                      Update existing document"
    echo "  doc:delete <id>     Delete document"
    echo "  doc:stats           Show document statistics"
    echo ""
    echo -e "${CYAN}PROJECTS (CQRS):${NC}"
    echo "  project:list [contact]    List projects (optionally filter by contact)"
    echo "  project:get <id>          Get project with files"
    echo "  project:create <name> [description] [contact]"
    echo "                            Create new project"
    echo "  project:delete <id>       Delete project"
    echo "  project:add-file <project_id> <filename> [path]"
    echo "                            Add file to project"
    echo ""
    echo -e "${CYAN}EVENTS:${NC}"
    echo "  events:list <type> <id>   List events for aggregate"
    echo "                            Types: documents, projects"
    echo ""
    echo -e "${CYAN}CHAT:${NC}"
    echo "  chat <message> [module]   Chat with Bielik"
    echo "                            Modules: default, ksef, b2b, zus, vat"
    echo ""
    echo -e "${CYAN}CONTEXT:${NC}"
    echo "  context:hierarchy         Show full context hierarchy"
    echo "  context:channels [contact] [project_id]"
    echo "                            Get recommended channels"
    echo ""
    echo -e "${CYAN}SOURCES:${NC}"
    echo "  sources:list [type]       List data sources"
    echo "                            Types: official, commercial"
    echo "  sources:legal             List key legal documents"
    echo "  verify <type> <id>        Verify entity (nip, krs, vat_eu)"
    echo "  verify:vat <number>       Quick VAT EU verification"
    echo ""
    echo -e "${CYAN}OTHER:${NC}"
    echo "  interactive               Start interactive mode"
    echo "  help                      Show this help"
    echo ""
    echo -e "${CYAN}ENVIRONMENT:${NC}"
    echo "  BIELIK_API_URL    API base URL (default: http://localhost:8005)"
    echo "  BIELIK_VERBOSE    Enable debug output (true/false)"
    echo ""
    echo -e "${CYAN}EXAMPLES:${NC}"
    echo "  ./bielik-cli.sh health"
    echo "  ./bielik-cli.sh doc:create \"KSeF FAQ\" \"ksef\" \"Pytania o KSeF...\""
    echo "  ./bielik-cli.sh chat \"Kiedy KSeF?\" ksef"
    echo "  ./bielik-cli.sh verify:vat PL5260250995"
    echo "  ./bielik-cli.sh events:list documents 1"
}

# ============================================
# MAIN
# ============================================

main() {
    local cmd="${1:-help}"
    shift || true
    
    case "$cmd" in
        # Health & Status
        health)           cmd_health ;;
        status)           cmd_status ;;
        
        # Documents
        doc:list)         cmd_doc_list ;;
        doc:get)          cmd_doc_get "$@" ;;
        doc:create)       cmd_doc_create "$@" ;;
        doc:update)       cmd_doc_update "$@" ;;
        doc:delete)       cmd_doc_delete "$@" ;;
        doc:stats)        cmd_doc_stats ;;
        
        # Projects
        project:list)     cmd_project_list "$@" ;;
        project:get)      cmd_project_get "$@" ;;
        project:create)   cmd_project_create "$@" ;;
        project:delete)   cmd_project_delete "$@" ;;
        project:add-file) cmd_project_add_file "$@" ;;
        
        # Events
        events:list)      cmd_events_list "$@" ;;
        
        # Chat
        chat)             cmd_chat "$@" ;;
        
        # Context
        context:hierarchy) cmd_context_hierarchy ;;
        context:channels)  cmd_context_channels "$@" ;;
        
        # Sources
        sources:list)     cmd_sources_list "$@" ;;
        sources:legal)    cmd_sources_legal ;;
        verify)           cmd_verify "$@" ;;
        verify:vat)       cmd_verify_vat "$@" ;;
        
        # Other
        interactive|i)    cmd_interactive ;;
        help|--help|-h)   cmd_help ;;
        
        *)
            log_error "Unknown command: $cmd"
            echo "Run './bielik-cli.sh help' for available commands"
            exit 1
            ;;
    esac
}

main "$@"
