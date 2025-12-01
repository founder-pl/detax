const API_URL = '/api/v1';

interface DocumentDto {
  id: number;
  title: string;
  source?: string | null;
  category: string;
  content: string;
}

interface DomainEventDto {
  id: string;
  event_type?: string;
  eventType?: string;
  created_at?: string;
  createdAt?: string;
}

let currentDocumentId: number | null = null;

function getElements() {
  return {
    documentsList: document.getElementById('documents-list') as HTMLUListElement | null,
    documentsRefresh: document.getElementById('documents-refresh') as HTMLButtonElement | null,
    docTitle: document.getElementById('doc-title') as HTMLInputElement | null,
    docCategory: document.getElementById('doc-category') as HTMLInputElement | null,
    docContent: document.getElementById('doc-content') as HTMLTextAreaElement | null,
    docNew: document.getElementById('doc-new') as HTMLButtonElement | null,
    docDelete: document.getElementById('doc-delete') as HTMLButtonElement | null,
    docSave: document.getElementById('doc-save') as HTMLButtonElement | null,
    documentEvents: document.getElementById('document-events') as HTMLUListElement | null,
  };
}

export function initDocumentsPanel(): void {
  const els = getElements();
  if (!els.documentsList) return;

  els.documentsRefresh?.addEventListener('click', loadDocuments);
  els.docNew?.addEventListener('click', () => {
    currentDocumentId = null;
    clearDocumentEditor();
  });
  els.docSave?.addEventListener('click', saveDocument);
  els.docDelete?.addEventListener('click', deleteDocument);

  void loadDocuments();
}

async function loadDocuments(): Promise<void> {
  const els = getElements();
  if (!els.documentsList) return;
  try {
    const resp = await fetch(`${API_URL.replace('/api/v1', '')}/api/v1/documents?limit=50`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const docs = (await resp.json()) as DocumentDto[];
    renderDocumentsList(docs || []);
  } catch (err) {
    console.error('Nie udało się pobrać dokumentów:', err);
  }
}

function renderDocumentsList(docs: DocumentDto[]): void {
  const els = getElements();
  if (!els.documentsList) return;

  els.documentsList.innerHTML = '';
  docs.forEach((doc) => {
    const li = document.createElement('li');
    li.className = 'document-item';
    li.dataset.id = String(doc.id);
    li.textContent = `${doc.title} (${doc.category})`;
    li.addEventListener('click', () => {
      selectDocument(doc, li);
    });
    els.documentsList!.appendChild(li);
  });
}

function selectDocument(doc: DocumentDto, element: HTMLLIElement | null): void {
  currentDocumentId = doc.id;
  document.querySelectorAll<HTMLLIElement>('.document-item').forEach((li) => li.classList.remove('active'));
  if (element) element.classList.add('active');

  const els = getElements();
  if (els.docTitle) els.docTitle.value = doc.title || '';
  if (els.docCategory) els.docCategory.value = doc.category || '';
  if (els.docContent) els.docContent.value = doc.content || '';

  void loadDocumentEvents(doc.id);
}

function clearDocumentEditor(): void {
  document.querySelectorAll<HTMLLIElement>('.document-item').forEach((li) => li.classList.remove('active'));
  const els = getElements();
  if (els.docTitle) els.docTitle.value = '';
  if (els.docCategory) els.docCategory.value = '';
  if (els.docContent) els.docContent.value = '';
  if (els.documentEvents) {
    els.documentEvents.innerHTML = '';
  }
}

async function loadDocumentEvents(documentId: number): Promise<void> {
  const els = getElements();
  if (!els.documentEvents) return;
  try {
    const resp = await fetch(`${API_URL}/events/documents/${documentId}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const events = (await resp.json()) as DomainEventDto[];
    renderDocumentEvents(events || []);
  } catch (err) {
    console.error('Nie udało się pobrać historii dokumentu:', err);
  }
}

function renderDocumentEvents(events: DomainEventDto[]): void {
  const els = getElements();
  if (!els.documentEvents) return;

  els.documentEvents.innerHTML = events
    .map((ev) => {
      const ts = ev.created_at || ev.createdAt;
      const when = ts ? new Date(ts).toLocaleString('pl-PL') : '';
      const type = ev.event_type || ev.eventType || '';
      return `<li>[${when}] ${escapeHtml(type)}</li>`;
    })
    .join('');
}

async function saveDocument(): Promise<void> {
  const els = getElements();
  if (!els.docTitle || !els.docCategory || !els.docContent) return;

  const title = els.docTitle.value.trim();
  const category = els.docCategory.value.trim() || 'default';
  const content = els.docContent.value.trim();

  if (!title || !content) {
    alert('Tytuł i treść dokumentu nie mogą być puste.');
    return;
  }

  const payload = { title, category, content, source: null as string | null };

  try {
    let url: string;
    let body: any;

    if (currentDocumentId) {
      url = `${API_URL}/commands/documents/update`;
      body = {
        id: currentDocumentId,
        title,
        source: null,
        category,
        content,
      };
    } else {
      url = `${API_URL}/commands/documents/create`;
      body = payload;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const doc = (await resp.json()) as DocumentDto;
    currentDocumentId = doc.id;
    await loadDocuments();
  } catch (err) {
    console.error('Nie udało się zapisać dokumentu:', err);
    alert('Nie udało się zapisać dokumentu. Sprawdź logi API.');
  }
}

async function deleteDocument(): Promise<void> {
  if (!currentDocumentId) return;
  if (!confirm('Na pewno usunąć ten dokument?')) return;

  try {
    const resp = await fetch(`${API_URL}/commands/documents/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentDocumentId }),
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

