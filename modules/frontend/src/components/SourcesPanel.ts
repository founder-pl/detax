/**
 * SourcesPanel Component - Panel źródeł danych prawnych
 */
import { Component, ComponentConfig, api, EventBus } from '../core/Component';

interface DataSource {
  id: string;
  name: string;
  type: 'official' | 'commercial';
  base_url: string;
  description: string;
  active: boolean;
}

interface LegalDocument {
  id: string;
  title: string;
  category: string;
  url: string;
}

interface SourcesPanelConfig extends ComponentConfig {
  onSourceSelect?: (source: DataSource) => void;
}

export class SourcesPanel extends Component<SourcesPanelConfig> {
  private sources: DataSource[] = [];
  private legalDocs: LegalDocument[] = [];
  private activeTab: 'sources' | 'documents' = 'sources';
  private filterType: 'all' | 'official' | 'commercial' = 'all';

  render(): string {
    return `
      <div class="sources-panel-component">
        <div class="sources-tabs">
          <button class="tab-btn ${this.activeTab === 'sources' ? 'active' : ''}" data-tab="sources">
            🔗 Źródła danych
          </button>
          <button class="tab-btn ${this.activeTab === 'documents' ? 'active' : ''}" data-tab="documents">
            📜 Akty prawne
          </button>
        </div>

        <div class="sources-filter">
          <select class="filter-select" id="source-type-filter">
            <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>Wszystkie</option>
            <option value="official" ${this.filterType === 'official' ? 'selected' : ''}>Urzędowe</option>
            <option value="commercial" ${this.filterType === 'commercial' ? 'selected' : ''}>Komercyjne</option>
          </select>
        </div>

        <div class="sources-content">
          ${this.activeTab === 'sources' ? this.renderSources() : this.renderDocuments()}
        </div>

        <div class="sources-verify">
          <h4>🔍 Weryfikacja podmiotu</h4>
          <div class="verify-form">
            <input type="text" id="verify-input" placeholder="NIP, KRS lub VAT UE (np. PL1234567890)">
            <select id="verify-type">
              <option value="nip">NIP (CEIDG)</option>
              <option value="krs">KRS</option>
              <option value="vat_eu">VAT UE (VIES)</option>
            </select>
            <button type="button" id="verify-btn" class="verify-button">Sprawdź</button>
          </div>
          <div id="verify-result" class="verify-result"></div>
        </div>
      </div>
    `;
  }

  private renderSources(): string {
    const filtered = this.sources.filter(s => 
      this.filterType === 'all' || s.type === this.filterType
    );

    if (!filtered.length) {
      return '<div class="sources-empty">Ładowanie źródeł...</div>';
    }

    return `
      <ul class="sources-list-component">
        ${filtered.map(source => `
          <li class="source-item ${source.active ? '' : 'inactive'}" data-source-id="${source.id}">
            <div class="source-header">
              <span class="source-type-badge ${source.type}">${source.type === 'official' ? '🏛️' : '💼'}</span>
              <span class="source-name">${this.escapeHtml(source.name)}</span>
              <span class="source-status ${source.active ? 'active' : 'inactive'}">
                ${source.active ? '✅' : '🔑'}
              </span>
            </div>
            <div class="source-description">${this.escapeHtml(source.description)}</div>
            <a href="${source.base_url}" target="_blank" class="source-url">${source.base_url}</a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  private renderDocuments(): string {
    if (!this.legalDocs.length) {
      return '<div class="sources-empty">Ładowanie dokumentów...</div>';
    }

    const grouped = this.groupByCategory(this.legalDocs);

    return `
      <div class="legal-docs-list">
        ${Object.entries(grouped).map(([category, docs]) => `
          <div class="docs-category">
            <h5 class="category-header">${this.getCategoryLabel(category)}</h5>
            <ul class="docs-list">
              ${docs.map(doc => `
                <li class="doc-item">
                  <a href="${doc.url}" target="_blank" class="doc-link">
                    <span class="doc-title">${this.escapeHtml(doc.title)}</span>
                    <span class="doc-id">${doc.id}</span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }

  private groupByCategory(docs: LegalDocument[]): Record<string, LegalDocument[]> {
    return docs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, LegalDocument[]>);
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      ksef: '📄 KSeF',
      vat: '💰 VAT',
      b2b: '💼 B2B / Prawo pracy',
      zus: '🏥 ZUS',
    };
    return labels[category] || category;
  }

  protected async afterMount(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const [sources, docs] = await Promise.all([
        api.get<DataSource[]>('/sources'),
        api.get<LegalDocument[]>('/legal-documents'),
      ]);
      this.sources = sources;
      this.legalDocs = docs;
      this.updateContent();
    } catch (e) {
      console.error('Error loading sources data:', e);
    }
  }

  private updateContent(): void {
    const content = this.$('.sources-content');
    if (content) {
      content.innerHTML = this.activeTab === 'sources' 
        ? this.renderSources() 
        : this.renderDocuments();
    }
  }

  protected bindEvents(): void {
    // Tab switching
    this.$$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab as 'sources' | 'documents';
        this.$$('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateContent();
      });
    });

    // Filter
    const filterSelect = this.$('#source-type-filter') as HTMLSelectElement;
    filterSelect?.addEventListener('change', () => {
      this.filterType = filterSelect.value as 'all' | 'official' | 'commercial';
      this.updateContent();
    });

    // Verify button
    const verifyBtn = this.$('#verify-btn');
    verifyBtn?.addEventListener('click', () => this.handleVerify());

    // Enter to verify
    const verifyInput = this.$('#verify-input') as HTMLInputElement;
    verifyInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleVerify();
    });
  }

  private async handleVerify(): Promise<void> {
    const input = this.$('#verify-input') as HTMLInputElement;
    const typeSelect = this.$('#verify-type') as HTMLSelectElement;
    const resultDiv = this.$('#verify-result');

    if (!input || !typeSelect || !resultDiv) return;

    const identifier = input.value.trim();
    if (!identifier) {
      resultDiv.innerHTML = '<span class="error">Wprowadź identyfikator</span>';
      return;
    }

    resultDiv.innerHTML = '<span class="loading">Weryfikuję...</span>';

    try {
      const result = await api.post<{
        valid: boolean;
        identifier: string;
        type: string;
        data?: any;
        error?: string;
      }>('/verify', {
        identifier,
        type: typeSelect.value,
      });

      if (result.valid) {
        resultDiv.innerHTML = `
          <div class="verify-success">
            <strong>✅ Zweryfikowano:</strong> ${this.escapeHtml(identifier)}<br>
            ${result.data?.name ? `<strong>Nazwa:</strong> ${this.escapeHtml(result.data.name)}<br>` : ''}
            ${result.data?.address ? `<strong>Adres:</strong> ${this.escapeHtml(result.data.address)}` : ''}
          </div>
        `;
        EventBus.emit('entity:verified', result);
      } else {
        resultDiv.innerHTML = `
          <div class="verify-error">
            ❌ ${result.error || 'Nie znaleziono'}
          </div>
        `;
      }
    } catch (e) {
      resultDiv.innerHTML = '<span class="error">Błąd weryfikacji</span>';
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
