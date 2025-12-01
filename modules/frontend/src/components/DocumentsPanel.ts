/**
 * DocumentsPanel Component - CQRS Document Management with Event Sourcing
 */
import { Component, ComponentConfig, api, EventBus } from '../core/Component';

interface Document {
  id: number;
  title: string;
  source: string | null;
  category: string;
  content: string;
}

interface DomainEvent {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

interface DocumentStats {
  total_documents: number;
  total_chunks: number;
  categories: { category: string; count: number }[];
}

type ViewMode = 'list' | 'edit' | 'events';

export class DocumentsPanel extends Component {
  private documents: Document[] = [];
  private selectedDocument: Document | null = null;
  private events: DomainEvent[] = [];
  private stats: DocumentStats | null = null;
  private viewMode: ViewMode = 'list';
  private isLoading = false;

  render(): string {
    return `
      <div class="documents-panel-component">
        <div class="documents-header">
          <h3>📚 Dokumenty (CQRS)</h3>
          <div class="documents-actions">
            <button type="button" class="btn-icon" id="doc-refresh" title="Odśwież">🔄</button>
            <button type="button" class="btn-icon" id="doc-new" title="Nowy dokument">➕</button>
            <button type="button" class="btn-icon ${this.viewMode === 'events' ? 'active' : ''}" 
                    id="doc-toggle-events" title="Historia zdarzeń">📜</button>
          </div>
        </div>

        <div class="documents-stats" id="doc-stats">
          ${this.renderStats()}
        </div>

        <div class="documents-content">
          ${this.viewMode === 'list' ? this.renderList() : ''}
          ${this.viewMode === 'edit' ? this.renderEditor() : ''}
          ${this.viewMode === 'events' ? this.renderEvents() : ''}
        </div>
      </div>
    `;
  }

  private renderStats(): string {
    if (!this.stats) {
      return '<div class="stats-loading">Ładowanie...</div>';
    }

    return `
      <div class="stats-row">
        <span class="stat-item">
          <strong>${this.stats.total_documents}</strong> dokumentów
        </span>
        <span class="stat-item">
          <strong>${this.stats.total_chunks}</strong> chunków
        </span>
      </div>
      <div class="stats-categories">
        ${this.stats.categories.map(c => `
          <span class="category-badge ${c.category}">${c.category}: ${c.count}</span>
        `).join('')}
      </div>
    `;
  }

  private renderList(): string {
    if (this.isLoading) {
      return '<div class="loading">Ładowanie dokumentów...</div>';
    }

    if (!this.documents.length) {
      return '<div class="empty">Brak dokumentów. Kliknij ➕ aby dodać nowy.</div>';
    }

    return `
      <ul class="documents-list-component">
        ${this.documents.map(doc => `
          <li class="document-item ${this.selectedDocument?.id === doc.id ? 'selected' : ''}"
              data-doc-id="${doc.id}">
            <div class="document-info">
              <span class="document-title">${this.escapeHtml(doc.title)}</span>
              <span class="document-category ${doc.category}">${doc.category}</span>
            </div>
            <div class="document-meta">
              ${doc.source ? `<span class="document-source">${this.escapeHtml(doc.source)}</span>` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  private renderEditor(): string {
    const doc = this.selectedDocument;
    const isNew = !doc?.id;

    return `
      <form class="document-editor-form" id="doc-editor-form">
        <div class="form-group">
          <label for="doc-title-input">Tytuł</label>
          <input type="text" id="doc-title-input" class="form-input" 
                 value="${doc ? this.escapeHtml(doc.title) : ''}" 
                 placeholder="Tytuł dokumentu" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="doc-category-input">Kategoria</label>
            <select id="doc-category-input" class="form-select" required>
              <option value="">Wybierz...</option>
              <option value="ksef" ${doc?.category === 'ksef' ? 'selected' : ''}>KSeF</option>
              <option value="b2b" ${doc?.category === 'b2b' ? 'selected' : ''}>B2B</option>
              <option value="zus" ${doc?.category === 'zus' ? 'selected' : ''}>ZUS</option>
              <option value="vat" ${doc?.category === 'vat' ? 'selected' : ''}>VAT</option>
            </select>
          </div>
          <div class="form-group">
            <label for="doc-source-input">Źródło</label>
            <input type="text" id="doc-source-input" class="form-input"
                   value="${doc?.source ? this.escapeHtml(doc.source) : ''}"
                   placeholder="np. Dz.U. 2024 poz. 123">
          </div>
        </div>

        <div class="form-group">
          <label for="doc-content-input">Treść</label>
          <textarea id="doc-content-input" class="form-textarea" rows="10" 
                    placeholder="Treść dokumentu..." required>${doc ? this.escapeHtml(doc.content) : ''}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn secondary" id="doc-cancel">Anuluj</button>
          ${!isNew ? `<button type="button" class="btn danger" id="doc-delete">Usuń</button>` : ''}
          <button type="submit" class="btn primary">${isNew ? 'Utwórz' : 'Zapisz'}</button>
        </div>

        ${!isNew ? `
          <div class="editor-events-preview">
            <h4>📜 Ostatnie zdarzenia</h4>
            <ul class="events-mini-list">
              ${this.events.slice(0, 3).map(e => `
                <li class="event-mini">
                  <span class="event-type">${e.event_type}</span>
                  <span class="event-time">${this.formatTime(e.created_at)}</span>
                </li>
              `).join('')}
            </ul>
            <button type="button" class="btn-link" id="doc-show-all-events">
              Zobacz wszystkie zdarzenia →
            </button>
          </div>
        ` : ''}
      </form>
    `;
  }

  private renderEvents(): string {
    if (!this.selectedDocument) {
      return '<div class="empty">Wybierz dokument, aby zobaczyć historię zdarzeń</div>';
    }

    if (!this.events.length) {
      return '<div class="empty">Brak zdarzeń dla tego dokumentu</div>';
    }

    return `
      <div class="events-panel">
        <div class="events-header">
          <h4>📜 Historia zdarzeń: ${this.escapeHtml(this.selectedDocument.title)}</h4>
          <button type="button" class="btn secondary btn-sm" id="events-back">← Wróć</button>
        </div>
        <ul class="events-list">
          ${this.events.map(event => `
            <li class="event-item ${event.event_type.toLowerCase()}">
              <div class="event-icon">${this.getEventIcon(event.event_type)}</div>
              <div class="event-details">
                <div class="event-header">
                  <span class="event-type">${event.event_type}</span>
                  <span class="event-time">${this.formatTime(event.created_at)}</span>
                </div>
                <div class="event-payload">
                  <pre>${JSON.stringify(event.payload, null, 2)}</pre>
                </div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  private getEventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      'DocumentCreated': '✨',
      'DocumentUpdated': '✏️',
      'DocumentDeleted': '🗑️',
    };
    return icons[eventType] || '📌';
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected async afterMount(): Promise<void> {
    await Promise.all([
      this.loadDocuments(),
      this.loadStats(),
    ]);
  }

  private async loadDocuments(): Promise<void> {
    this.isLoading = true;
    try {
      this.documents = await api.get<Document[]>('/documents');
      this.updateList();
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadStats(): Promise<void> {
    try {
      this.stats = await api.get<DocumentStats>('/documents/stats');
      this.updateStats();
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  }

  private async loadEvents(docId: number): Promise<void> {
    try {
      this.events = await api.get<DomainEvent[]>(`/events/documents/${docId}`);
    } catch (e) {
      console.error('Error loading events:', e);
      this.events = [];
    }
  }

  private updateList(): void {
    const content = this.$('.documents-content');
    if (content && this.viewMode === 'list') {
      content.innerHTML = this.renderList();
      this.bindListEvents();
    }
  }

  private updateStats(): void {
    const stats = this.$('#doc-stats');
    if (stats) {
      stats.innerHTML = this.renderStats();
    }
  }

  private updateContent(): void {
    const content = this.$('.documents-content');
    if (!content) return;

    if (this.viewMode === 'list') {
      content.innerHTML = this.renderList();
      this.bindListEvents();
    } else if (this.viewMode === 'edit') {
      content.innerHTML = this.renderEditor();
      this.bindEditorEvents();
    } else if (this.viewMode === 'events') {
      content.innerHTML = this.renderEvents();
      this.bindEventsEvents();
    }
  }

  protected bindEvents(): void {
    // Header actions
    this.$('#doc-refresh')?.addEventListener('click', () => this.loadDocuments());
    this.$('#doc-new')?.addEventListener('click', () => this.newDocument());
    this.$('#doc-toggle-events')?.addEventListener('click', () => this.toggleEventsView());

    this.bindListEvents();
  }

  private bindListEvents(): void {
    this.$$('.document-item').forEach(item => {
      item.addEventListener('click', async () => {
        const docId = parseInt(item.dataset.docId || '0');
        await this.selectDocument(docId);
      });
    });
  }

  private bindEditorEvents(): void {
    const form = this.$('#doc-editor-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveDocument();
    });

    this.$('#doc-cancel')?.addEventListener('click', () => {
      this.viewMode = 'list';
      this.selectedDocument = null;
      this.updateContent();
    });

    this.$('#doc-delete')?.addEventListener('click', async () => {
      if (this.selectedDocument && confirm('Czy na pewno chcesz usunąć ten dokument?')) {
        await this.deleteDocument(this.selectedDocument.id);
      }
    });

    this.$('#doc-show-all-events')?.addEventListener('click', () => {
      this.viewMode = 'events';
      this.updateContent();
    });
  }

  private bindEventsEvents(): void {
    this.$('#events-back')?.addEventListener('click', () => {
      this.viewMode = 'edit';
      this.updateContent();
    });
  }

  private async selectDocument(docId: number): Promise<void> {
    try {
      this.selectedDocument = await api.get<Document>(`/documents/${docId}`);
      await this.loadEvents(docId);
      this.viewMode = 'edit';
      this.updateContent();
    } catch (e) {
      console.error('Error selecting document:', e);
    }
  }

  private newDocument(): void {
    this.selectedDocument = {
      id: 0,
      title: '',
      source: null,
      category: '',
      content: '',
    };
    this.events = [];
    this.viewMode = 'edit';
    this.updateContent();
  }

  private async saveDocument(): Promise<void> {
    const title = (this.$('#doc-title-input') as HTMLInputElement)?.value;
    const category = (this.$('#doc-category-input') as HTMLSelectElement)?.value;
    const source = (this.$('#doc-source-input') as HTMLInputElement)?.value;
    const content = (this.$('#doc-content-input') as HTMLTextAreaElement)?.value;

    if (!title || !category || !content) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      if (this.selectedDocument?.id) {
        // Update via CQRS command
        await api.post('/commands/documents/update', {
          id: this.selectedDocument.id,
          title,
          category,
          content,
          source: source || null,
        });
        EventBus.emit('document:updated', this.selectedDocument.id);
      } else {
        // Create via CQRS command
        const result = await api.post<Document>('/commands/documents/create', {
          title,
          category,
          content,
          source: source || null,
        });
        EventBus.emit('document:created', result.id);
      }

      await this.loadDocuments();
      await this.loadStats();
      this.viewMode = 'list';
      this.selectedDocument = null;
      this.updateContent();
    } catch (e) {
      console.error('Error saving document:', e);
      alert('Błąd zapisu dokumentu');
    }
  }

  private async deleteDocument(docId: number): Promise<void> {
    try {
      await api.post('/commands/documents/delete', { id: docId });
      EventBus.emit('document:deleted', docId);
      
      await this.loadDocuments();
      await this.loadStats();
      this.viewMode = 'list';
      this.selectedDocument = null;
      this.updateContent();
    } catch (e) {
      console.error('Error deleting document:', e);
      alert('Błąd usuwania dokumentu');
    }
  }

  private toggleEventsView(): void {
    if (this.viewMode === 'events') {
      this.viewMode = this.selectedDocument ? 'edit' : 'list';
    } else {
      this.viewMode = 'events';
    }
    this.updateContent();
    
    // Update toggle button state
    const btn = this.$('#doc-toggle-events');
    btn?.classList.toggle('active', this.viewMode === 'events');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
