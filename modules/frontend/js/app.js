/**
 * Bielik MVP - Frontend Application
 * Chat interface with Polish LLM
 */

// Configuration
const API_URL = '/api/v1';
const MODULES = {
    default: { name: 'Ogólne', icon: '💬' },
    ksef: { name: 'KSeF', icon: '📄' },
    b2b: { name: 'B2B', icon: '💼' },
    zus: { name: 'ZUS', icon: '🏥' },
    vat: { name: 'VAT', icon: '💰' }
};

function getProjectIcon(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('ksef') || lower.includes('faktur')) return '📋';
    if (lower.includes('b2b') || lower.includes('umowa') || lower.includes('kontrakt')) return '💼';
    if (lower.includes('zus') || lower.includes('składk')) return '🏥';
    if (lower.includes('vat') || lower.includes('jpk')) return '💰';
    return '📁';
}

function initDocumentsPanel() {
    if (!elements.documentsList) return;

    elements.documentsRefresh.addEventListener('click', loadDocuments);
    elements.docNew.addEventListener('click', () => {
        currentDocumentId = null;
        clearDocumentEditor();
    });
    elements.docSave.addEventListener('click', saveDocument);
    elements.docDelete.addEventListener('click', deleteDocument);

    loadDocuments();
}

async function loadDocuments() {
    if (!elements.documentsList) return;
    try {
        const resp = await fetch(`${API_URL.replace('/api/v1', '')}/api/v1/documents?limit=50`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const docs = await resp.json();
        renderDocumentsList(docs || []);
    } catch (err) {
        console.error('Nie udało się pobrać dokumentów:', err);
    }
}

function renderDocumentsList(docs) {
    elements.documentsList.innerHTML = '';
    docs.forEach(doc => {
        const li = document.createElement('li');
        li.className = 'document-item';
        li.dataset.id = doc.id;
        li.textContent = `${doc.title} (${doc.category})`;
        li.addEventListener('click', () => {
            selectDocument(doc, li);
        });
        elements.documentsList.appendChild(li);
    });
}

function selectDocument(doc, element) {
    currentDocumentId = doc.id;
    document.querySelectorAll('.document-item').forEach(li => li.classList.remove('active'));
    if (element) element.classList.add('active');

    elements.docTitle.value = doc.title || '';
    elements.docCategory.value = doc.category || '';
    elements.docContent.value = doc.content || '';

    loadDocumentEvents(doc.id);
}

function clearDocumentEditor() {
    document.querySelectorAll('.document-item').forEach(li => li.classList.remove('active'));
    elements.docTitle.value = '';
    elements.docCategory.value = '';
    elements.docContent.value = '';
    if (elements.documentEvents) {
        elements.documentEvents.innerHTML = '';
    }
}

async function loadDocumentEvents(documentId) {
    if (!elements.documentEvents) return;
    try {
        const resp = await fetch(`${API_URL}/events/documents/${documentId}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const events = await resp.json();
        renderDocumentEvents(events || []);
    } catch (err) {
        console.error('Nie udało się pobrać historii dokumentu:', err);
    }
}

function renderDocumentEvents(events) {
    if (!elements.documentEvents) return;
    elements.documentEvents.innerHTML = events.map(ev => {
        const when = new Date(ev.created_at || ev.createdAt).toLocaleString('pl-PL');
        return `<li>[${when}] ${escapeHtml(ev.event_type || ev.eventType)}</li>`;
    }).join('');
}

async function saveDocument() {
    const title = elements.docTitle.value.trim();
    const category = elements.docCategory.value.trim() || 'default';
    const content = elements.docContent.value.trim();

    if (!title || !content) {
        alert('Tytuł i treść dokumentu nie mogą być puste.');
        return;
    }

    const payload = { title, category, content, source: null };

    try {
        let url;
        let body;

        if (currentDocumentId) {
            // CQRS: aktualizacja dokumentu
            url = `${API_URL}/commands/documents/update`;
            body = {
                id: currentDocumentId,
                title,
                source: null,
                category,
                content,
            };
        } else {
            // CQRS: utworzenie dokumentu
            url = `${API_URL}/commands/documents/create`;
            body = payload;
        }

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const doc = await resp.json();
        currentDocumentId = doc.id;
        await loadDocuments();
    } catch (err) {
        console.error('Nie udało się zapisać dokumentu:', err);
        alert('Nie udało się zapisać dokumentu. Sprawdź logi API.');
    }
}

async function deleteDocument() {
    if (!currentDocumentId) return;
    if (!confirm('Na pewno usunąć ten dokument?')) return;

    try {
        const resp = await fetch(`${API_URL}/commands/documents/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentDocumentId })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        currentDocumentId = null;
        clearDocumentEditor();
        await loadDocuments();
    } catch (err) {
        console.error('Nie udało się usunąć dokumentu:', err);
        alert('Nie udało się usunąć dokumentu.');
    }
}
};

const PROJECT_FILES = {
    'projekt-1': [
        'ksef_terminy.pdf',
        'instrukcja_e_faktury.docx',
        'umowa_klient_A.pdf'
    ],
    'projekt-2': [
        'analiza_umowy_b2b.pdf',
        'checklista_b2b.xlsx'
    ],
    'projekt-3': [
        'vat_oss_instrukcja.pdf',
        'jpk_vat_przyklad.xlsx'
    ],
    default: [
        'notatki_projektowe.txt'
    ]
};

// State
let currentModule = 'default';
let isLoading = false;
let lastSources = [];
let isEditMode = false;
let currentDocumentId = null;
let currentProjectId = null;
let currentFileId = null;
let currentContact = null;

// DOM Elements
const elements = {
    messages: document.getElementById('messages'),
    form: document.getElementById('chat-form'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    status: document.getElementById('status'),
    statusText: document.querySelector('.status-text'),
    currentModule: document.getElementById('current-module'),
    charCount: document.getElementById('char-count'),
    sourcesPanel: document.getElementById('sources-panel'),
    sourcesList: document.getElementById('sources-list'),
    closeSources: document.getElementById('close-sources'),
    quickQuestions: document.getElementById('quick-questions'),
    projectsList: document.getElementById('projects-list'),
    filesList: document.getElementById('files-list'),
    panelLeft: document.getElementById('panel-left'),
    panelRight: document.getElementById('panel-right'),
    editToggle: document.getElementById('edit-dashboard-toggle'),
    documentsList: document.getElementById('documents-list'),
    documentsRefresh: document.getElementById('documents-refresh'),
    docTitle: document.getElementById('doc-title'),
    docCategory: document.getElementById('doc-category'),
    docContent: document.getElementById('doc-content'),
    docNew: document.getElementById('doc-new'),
    docDelete: document.getElementById('doc-delete'),
    docSave: document.getElementById('doc-save'),
    documentEvents: document.getElementById('document-events')
};

let draggedModule = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initModuleButtons();
    initForm();
    initQuickQuestions();
    initSourcesPanel();
    initChannels();
    initProjects();
    initDocumentsPanel();
    initDashboardLayout();
    checkHealth();
    
    // Focus input
    elements.input.focus();
});

/**
 * Module buttons
 */
function initModuleButtons() {
    document.querySelectorAll('.module-btn').forEach(btn => {
        const module = btn.dataset.module;
        if (!module) return; // pomiń przycisk Edycji
        btn.addEventListener('click', () => {
            setModule(module);
        });
    });
}

function initChannels() {
    const channelItems = document.querySelectorAll('.channel-item');
    channelItems.forEach(item => {
        item.addEventListener('click', () => {
            const module = item.dataset.module;
            if (!module) return;
            channelItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            setModule(module);
        });
    });

    // Kontakty - kliknięcie
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', () => {
            contactItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentContact = item.textContent.trim();
            loadProjects();
        });
    });
}

function initProjects() {
    if (!elements.projectsList || !elements.filesList) return;
    loadProjects();
}
async function loadProjects() {
    if (!elements.projectsList) return;
    try {
        let url = `${API_URL}/projects?limit=50`;
        if (currentContact) {
            const encoded = encodeURIComponent(currentContact);
            url = `${API_URL}/projects?contact=${encoded}&limit=50`;
        }
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const projects = await resp.json();
        renderProjects(projects || []);
    } catch (err) {
        console.error('Nie udało się pobrać projektów:', err);
    }
}

function renderProjects(projects) {
    elements.projectsList.innerHTML = '';
    currentProjectId = null;
    currentFileId = null;
    elements.filesList.innerHTML = '';

    projects.forEach(project => {
        const li = document.createElement('li');
        li.className = 'project-item';
        li.dataset.projectId = project.id;

        const name = project.name || `Projekt ${project.id}`;
        const icon = getProjectIcon(name);
        li.innerHTML = `<span class="project-icon">${icon}</span> ${escapeHtml(name)}`;

        li.addEventListener('click', () => {
            document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            currentProjectId = project.id;
            loadProjectFiles(project.id);
            updateContextChannels();
        });

        elements.projectsList.appendChild(li);
    });
}

async function loadProjectFiles(projectId) {
    if (!elements.filesList) return;
    try {
        const resp = await fetch(`${API_URL}/projects/${projectId}/files`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const files = await resp.json();
        renderFiles(files || []);
    } catch (err) {
        console.error('Nie udało się pobrać plików projektu:', err);
    }
}

function renderFiles(files) {
    if (!elements.filesList) return;
    elements.filesList.innerHTML = '';
    currentFileId = null;

    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.fileId = file.id;
        const icon = getFileIcon(file.filename || '');
        li.innerHTML = `${icon} ${escapeHtml(file.filename || '')}`;

        li.addEventListener('click', () => {
            document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            currentFileId = file.id;
            updateContextChannels();
        });

        elements.filesList.appendChild(li);
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: '📑',
        doc: '📝', docx: '📝',
        xls: '📊', xlsx: '📊',
        txt: '📄',
        png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
        zip: '📦', rar: '📦'
    };
    return icons[ext] || '📄';
}

async function updateContextChannels() {
    try {
        const params = new URLSearchParams();
        if (currentContact) params.append('contact', currentContact);
        if (currentProjectId != null) params.append('project_id', String(currentProjectId));
        if (currentFileId != null) params.append('file_id', String(currentFileId));

        if (![...params.keys()].length) return; // brak kontekstu

        const resp = await fetch(`${API_URL}/context/channels?${params.toString()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        const channels = data.channels || [];
        if (channels.length === 0) return;

        // wybierz pierwszy kanał jako aktywny moduł
        const first = channels[0];
        if (MODULES[first.id]) {
            setModule(first.id);
        }

        // zaktualizuj podświetlenie kanałów w sidebarze
        const recommendedIds = new Set(channels.map(c => c.id));
        document.querySelectorAll('.channel-item').forEach(item => {
            const mod = item.dataset.module;
            if (!mod) return;
            item.classList.toggle('recommended', recommendedIds.has(mod));
        });

    } catch (err) {
        console.error('Nie udało się pobrać kanałów kontekstowych:', err);
    }
}

async function initDashboardLayout() {
    const modules = document.querySelectorAll('.dashboard-module');
    modules.forEach(el => {
        // Drag tylko w trybie edycji – domyślnie wyłączony
        el.classList.add('no-drag');
    });

    try {
        const response = await fetch(`${API_URL}/layout`);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.modules)) {
                applyLayoutFromConfig(data.modules);
            }
        }
    } catch (error) {
        console.error('Nie udało się pobrać układu dashboardu:', error);
    }

    initDragAndDrop();
    initEditToggle();
}

function applyLayoutFromConfig(configModules) {
    const allModules = {};
    document.querySelectorAll('.dashboard-module').forEach(el => {
        const id = el.dataset.moduleId;
        if (id) {
            allModules[id] = el;
        }
    });

    const leftPanel = elements.panelLeft;
    const rightPanel = elements.panelRight;
    if (!leftPanel || !rightPanel) return;

    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';

    const byColumn = {
        left: leftPanel,
        right: rightPanel
    };

    configModules
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(cfg => {
            const el = allModules[cfg.id];
            const panel = byColumn[cfg.column] || leftPanel;
            if (el && panel) {
                panel.appendChild(el);
            }
        });

    Object.keys(allModules).forEach(id => {
        const el = allModules[id];
        if (el && !el.parentElement) {
            leftPanel.appendChild(el);
        }
    });
}

function initDragAndDrop() {
    const modules = document.querySelectorAll('.dashboard-module');
    modules.forEach(el => {
        el.addEventListener('dragstart', onModuleDragStart);
        el.addEventListener('dragend', onModuleDragEnd);
    });

    [elements.panelLeft, elements.panelRight].forEach(panel => {
        if (!panel) return;
        panel.addEventListener('dragover', onPanelDragOver);
        panel.addEventListener('drop', onPanelDrop);
    });
}

function onModuleDragStart(event) {
    if (!isEditMode) {
        event.preventDefault();
        return;
    }
    draggedModule = event.currentTarget;
    event.dataTransfer.effectAllowed = 'move';
    draggedModule.classList.add('dragging');
}

function onModuleDragEnd() {
    if (draggedModule) {
        draggedModule.classList.remove('dragging');
        draggedModule = null;
    }
}

function onPanelDragOver(event) {
    if (!isEditMode) return;
    event.preventDefault();
}

function onPanelDrop(event) {
    if (!isEditMode) return;
    event.preventDefault();
    if (!draggedModule) return;
    const panel = event.currentTarget;
    const targetModule = event.target.closest('.dashboard-module');
    if (targetModule && targetModule !== draggedModule && targetModule.parentElement === panel) {
        panel.insertBefore(draggedModule, targetModule);
    } else {
        panel.appendChild(draggedModule);
    }

    draggedModule.classList.remove('dragging');
    draggedModule = null;
    saveCurrentLayout();
}

function saveCurrentLayout() {
    if (!elements.panelLeft || !elements.panelRight) return;

    const config = { modules: [] };

    [['left', elements.panelLeft], ['right', elements.panelRight]].forEach(([column, panel]) => {
        const mods = panel.querySelectorAll('.dashboard-module');
        mods.forEach((el, index) => {
            const id = el.dataset.moduleId;
            if (!id) return;
            config.modules.push({
                id,
                column,
                order: index
            });
        });
    });

    fetch(`${API_URL}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).catch(err => {
        console.error('Nie udało się zapisać układu dashboardu:', err);
    });
}

function initEditToggle() {
    if (!elements.editToggle) return;

    elements.editToggle.addEventListener('click', () => {
        isEditMode = !isEditMode;
        elements.editToggle.classList.toggle('active', isEditMode);
        elements.editToggle.setAttribute('aria-pressed', String(isEditMode));

        // Global klasa dla trybu edycji (siatka, ramki, ikony uchwytu)
        document.body.classList.toggle('dashboard-edit', isEditMode);

        const modules = document.querySelectorAll('.dashboard-module');
        modules.forEach(el => {
            if (isEditMode) {
                el.classList.remove('no-drag');
                el.setAttribute('draggable', 'true');
            } else {
                el.classList.add('no-drag');
                el.removeAttribute('draggable');
            }
        });
    });
}

function setModule(module) {
    currentModule = module;
    
    // Update buttons
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.module === module);
    });
    
    // Update hint
    elements.currentModule.textContent = `Moduł: ${MODULES[module].name}`;
    
    // Add info message
    const messages = {
        default: 'Zadaj dowolne pytanie dotyczące prowadzenia firmy w Polsce.',
        ksef: 'Pytaj o Krajowy System e-Faktur: terminy wdrożenia, wymagania techniczne, procedury.',
        b2b: 'Pomogę ocenić ryzyko Twojej umowy B2B według kryteriów Inspekcji Pracy.',
        zus: 'Obliczę składki ZUS i wyjaśnię zasady ubezpieczeń dla przedsiębiorców.',
        vat: 'Pomogę z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi.'
    };
    
    addMessage(messages[module], 'assistant');
    elements.input.focus();
}

/**
 * Form handling
 */
function initForm() {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = elements.input.value.trim();
        
        if (!message || isLoading) return;
        
        await sendMessage(message);
    });
    
    // Character count
    elements.input.addEventListener('input', () => {
        const count = elements.input.value.length;
        elements.charCount.textContent = `${count}/2000`;
    });
    
    // Enter to send
    elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.form.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Send message to API
 */
async function sendMessage(message) {
    isLoading = true;
    setLoadingState(true);
    
    // Hide quick questions after first message
    elements.quickQuestions.style.display = 'none';
    
    // Add user message
    addMessage(message, 'user');
    elements.input.value = '';
    elements.charCount.textContent = '0/2000';
    
    // Add loading indicator
    const loadingId = addMessage('', 'assistant', true);
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                module: currentModule
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading and add response
        removeMessage(loadingId);
        addMessage(data.response, 'assistant', false, data.sources);
        
        // Store sources
        lastSources = data.sources || [];
        
    } catch (error) {
        console.error('Error:', error);
        removeMessage(loadingId);
        addMessage(
            'Przepraszam, wystąpił błąd połączenia. Sprawdź czy serwisy działają (docker compose ps) i spróbuj ponownie.',
            'assistant'
        );
    } finally {
        isLoading = false;
        setLoadingState(false);
        elements.input.focus();
    }
}

/**
 * Add message to chat
 */
function addMessage(text, role, isLoading = false, sources = null) {
    const id = `msg-${Date.now()}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.id = id;
    messageDiv.className = `message ${role}${isLoading ? ' loading' : ''}`;
    
    const avatar = role === 'user' ? '👤' : '🦅';
    
    let contentHtml = formatMessage(text);
    
    // Add sources link if available
    if (sources && sources.length > 0) {
        contentHtml += `
            <div class="sources-link" onclick="showSources()">
                📚 Zobacz źródła (${sources.length})
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${contentHtml}</div>
    `;
    
    elements.messages.appendChild(messageDiv);
    scrollToBottom();
    
    return id;
}

/**
 * Remove message
 */
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

/**
 * Format message text
 */
function formatMessage(text) {
    if (!text) return '';
    
    // Escape HTML
    text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert markdown-like formatting
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Line breaks
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    
    // Wrap in paragraph
    if (!text.startsWith('<p>')) {
        text = `<p>${text}</p>`;
    }
    
    return text;
}

/**
 * Scroll to bottom of messages
 */
function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

/**
 * Loading state
 */
function setLoadingState(loading) {
    elements.sendBtn.disabled = loading;
    elements.input.disabled = loading;
}

/**
 * Quick questions
 */
function initQuickQuestions() {
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            const module = btn.dataset.module;
            
            if (module && module !== currentModule) {
                setModule(module);
            }
            
            elements.input.value = question;
            elements.form.dispatchEvent(new Event('submit'));
        });
    });
}

/**
 * Sources panel
 */
function initSourcesPanel() {
    elements.closeSources.addEventListener('click', hideSources);
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!elements.sourcesPanel.contains(e.target) && 
            !e.target.classList.contains('sources-link')) {
            hideSources();
        }
    });
}

function showSources() {
    if (lastSources.length === 0) return;
    
    elements.sourcesList.innerHTML = lastSources.map(source => `
        <li>
            <div class="source-title">${escapeHtml(source.title)}</div>
            <div class="source-meta">
                ${escapeHtml(source.source)}
                <span class="source-similarity">${Math.round(source.similarity * 100)}%</span>
            </div>
        </li>
    `).join('');
    
    elements.sourcesPanel.classList.remove('hidden');
    elements.sourcesPanel.classList.add('visible');
}

function hideSources() {
    elements.sourcesPanel.classList.remove('visible');
    setTimeout(() => {
        elements.sourcesPanel.classList.add('hidden');
    }, 300);
}

/**
 * Health check
 */
async function checkHealth() {
    try {
        const response = await fetch(`${API_URL.replace('/api/v1', '')}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            elements.status.classList.add('healthy');
            elements.status.classList.remove('unhealthy');
            elements.statusText.textContent = 'Połączono z Bielikiem';
        } else if (data.status === 'degraded') {
            elements.statusText.textContent = 'Częściowo dostępny';
            
            if (data.services?.model === 'not_loaded') {
                elements.statusText.textContent = 'Ładowanie modelu...';
            }
        } else {
            elements.status.classList.add('unhealthy');
            elements.statusText.textContent = 'Błąd połączenia';
        }
    } catch (error) {
        console.error('Health check failed:', error);
        elements.status.classList.add('unhealthy');
        elements.statusText.textContent = 'Brak połączenia';
    }
    
    // Check again in 30s
    setTimeout(checkHealth, 30000);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make showSources available globally for onclick
window.showSources = showSources;
