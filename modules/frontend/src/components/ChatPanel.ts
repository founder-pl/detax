/**
 * ChatPanel Component - Panel czatu z Bielikiem
 */
import { Component, ComponentConfig, api, EventBus } from '../core/Component';

type ModuleId = 'default' | 'ksef' | 'b2b' | 'zus' | 'vat';

interface ChatSource {
  title: string;
  source: string | null;
  similarity: number;
}

interface ChatResponse {
  response: string;
  sources?: ChatSource[];
  module: string;
  conversation_id: string;
}

const MODULES: Record<ModuleId, { name: string; icon: string; hint: string }> = {
  default: { 
    name: 'Ogólne', 
    icon: '💬',
    hint: 'Zadaj dowolne pytanie dotyczące prowadzenia firmy w Polsce.'
  },
  ksef: { 
    name: 'KSeF', 
    icon: '📄',
    hint: 'Pytaj o Krajowy System e-Faktur: terminy wdrożenia, wymagania techniczne, procedury.'
  },
  b2b: { 
    name: 'B2B', 
    icon: '💼',
    hint: 'Pomogę ocenić ryzyko Twojej umowy B2B według kryteriów Inspekcji Pracy.'
  },
  zus: { 
    name: 'ZUS', 
    icon: '🏥',
    hint: 'Obliczę składki ZUS i wyjaśnię zasady ubezpieczeń dla przedsiębiorców.'
  },
  vat: { 
    name: 'VAT', 
    icon: '💰',
    hint: 'Pomogę z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi.'
  },
};

const QUICK_QUESTIONS = [
  { question: 'Kiedy KSeF będzie obowiązkowy?', module: 'ksef' as ModuleId, label: 'KSeF' },
  { question: 'Jak ocenić czy moja umowa B2B jest bezpieczna?', module: 'b2b' as ModuleId, label: 'B2B' },
  { question: 'Ile wynosi składka zdrowotna na ryczałcie w 2025?', module: 'zus' as ModuleId, label: 'ZUS' },
  { question: 'Co to jest VAT OSS i kiedy go stosować?', module: 'vat' as ModuleId, label: 'VAT' },
];

export class ChatPanel extends Component {
  private currentModule: ModuleId = 'default';
  private isLoading = false;
  private lastSources: ChatSource[] = [];
  private showQuickQuestions = true;

  render(): string {
    return `
      <div class="chat-panel-component">
        <div class="chat-channels">
          <h4>📢 Kanały</h4>
          <ul class="channels-list">
            ${Object.entries(MODULES).map(([id, mod]) => `
              <li class="channel-item ${id === this.currentModule ? 'active' : ''}" 
                  data-module="${id}">
                <span class="channel-icon">${mod.icon}</span>
                <span class="channel-name"># ${mod.name.toLowerCase()}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <main class="chat-container">
          <div id="chat-messages" class="messages">
            ${this.renderWelcomeMessage()}
          </div>

          <div class="quick-questions ${this.showQuickQuestions ? '' : 'hidden'}" id="quick-questions">
            <span class="quick-label">Szybkie pytania:</span>
            <div class="quick-btns">
              ${QUICK_QUESTIONS.map(q => `
                <button class="quick-btn" data-question="${q.question}" data-module="${q.module}">
                  ${q.label}
                </button>
              `).join('')}
            </div>
          </div>

          <form id="chat-form" class="input-area">
            <div class="input-wrapper">
              <input 
                type="text" 
                id="chat-input" 
                placeholder="Zadaj pytanie..." 
                autocomplete="off"
                maxlength="2000"
              >
              <button type="submit" id="send-btn" ${this.isLoading ? 'disabled' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div class="input-hints">
              <span class="current-module" id="current-module">Moduł: ${MODULES[this.currentModule].name}</span>
              <span class="char-count" id="char-count">0/2000</span>
            </div>
          </form>
        </main>

        <aside id="sources-panel" class="sources-panel hidden">
          <div class="sources-header">
            <h3>📚 Źródła</h3>
            <button class="close-btn" id="close-sources">×</button>
          </div>
          <ul id="sources-list" class="sources-list"></ul>
        </aside>
      </div>
    `;
  }

  private renderWelcomeMessage(): string {
    return `
      <div class="message assistant">
        <div class="message-avatar">🦅</div>
        <div class="message-content">
          <p>Cześć! Jestem <strong>Bielikiem</strong> - polskim asystentem AI dla przedsiębiorców.</p>
          <p>Mogę pomóc Ci z:</p>
          <ul>
            <li><strong>KSeF</strong> - terminy, wymagania, procedury e-faktur</li>
            <li><strong>B2B</strong> - ryzyko przekwalifikowania umowy na etat</li>
            <li><strong>ZUS</strong> - składki, ubezpieczenia, obliczenia</li>
            <li><strong>VAT</strong> - JPK, VAT OSS, rozliczenia</li>
          </ul>
          <p>Wybierz kanał po lewej i zadaj pytanie!</p>
        </div>
      </div>
    `;
  }

  protected afterMount(): void {
    // Listen for channel selection from ContextPanel
    EventBus.on('channel:selected', (channelId: string) => {
      if (channelId in MODULES) {
        this.setModule(channelId as ModuleId);
      }
    });
  }

  protected bindEvents(): void {
    // Channel selection
    this.$$('.channel-item').forEach(item => {
      item.addEventListener('click', () => {
        const moduleId = item.dataset.module as ModuleId;
        if (moduleId) this.setModule(moduleId);
      });
    });

    // Form submission
    const form = this.$('#chat-form') as HTMLFormElement;
    const input = this.$('#chat-input') as HTMLInputElement;
    const charCount = this.$('#char-count');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input?.value.trim();
      if (message && !this.isLoading) {
        await this.sendMessage(message);
      }
    });

    input?.addEventListener('input', () => {
      if (charCount) {
        charCount.textContent = `${input.value.length}/2000`;
      }
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form?.dispatchEvent(new Event('submit'));
      }
    });

    // Quick questions
    this.$$('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        const moduleId = btn.dataset.module as ModuleId;
        
        if (moduleId && moduleId !== this.currentModule) {
          this.setModule(moduleId);
        }
        
        if (question && input) {
          input.value = question;
          form?.dispatchEvent(new Event('submit'));
        }
      });
    });

    // Sources panel
    const closeBtn = this.$('#close-sources');
    closeBtn?.addEventListener('click', () => this.hideSources());

    // Focus input
    input?.focus();
  }

  private setModule(module: ModuleId): void {
    this.currentModule = module;

    // Update channel list
    this.$$('.channel-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === module);
    });

    // Update module indicator
    const moduleIndicator = this.$('#current-module');
    if (moduleIndicator) {
      moduleIndicator.textContent = `Moduł: ${MODULES[module].name}`;
    }

    // Add hint message
    this.addMessage(MODULES[module].hint, 'assistant');
    
    (this.$('#chat-input') as HTMLInputElement)?.focus();
  }

  private async sendMessage(message: string): Promise<void> {
    this.isLoading = true;
    this.setLoadingState(true);

    // Hide quick questions
    const quickEl = this.$('#quick-questions');
    if (quickEl) quickEl.classList.add('hidden');
    this.showQuickQuestions = false;

    // Add user message
    this.addMessage(message, 'user');

    // Clear input
    const input = this.$('#chat-input') as HTMLInputElement;
    const charCount = this.$('#char-count');
    if (input) input.value = '';
    if (charCount) charCount.textContent = '0/2000';

    // Add loading message
    const loadingId = this.addMessage('', 'assistant', true);

    try {
      const data = await api.post<ChatResponse>('/chat', {
        message,
        module: this.currentModule,
      });

      this.removeMessage(loadingId);
      this.addMessage(data.response, 'assistant', false, data.sources);
      this.lastSources = data.sources || [];
    } catch (e) {
      console.error('Chat error:', e);
      this.removeMessage(loadingId);
      this.addMessage(
        'Przepraszam, wystąpił błąd połączenia. Sprawdź czy serwisy działają i spróbuj ponownie.',
        'assistant'
      );
    } finally {
      this.isLoading = false;
      this.setLoadingState(false);
      input?.focus();
    }
  }

  private addMessage(
    text: string, 
    role: 'user' | 'assistant', 
    isLoading = false,
    sources?: ChatSource[]
  ): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const messagesEl = this.$('#chat-messages');
    if (!messagesEl) return id;

    const avatar = role === 'user' ? '👤' : '🦅';
    let contentHtml = this.formatMessage(text);

    if (sources && sources.length > 0) {
      contentHtml += `
        <div class="sources-link" data-action="show-sources">
          📚 Zobacz źródła (${sources.length})
        </div>
      `;
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = id;
    messageDiv.className = `message ${role}${isLoading ? ' loading' : ''}`;
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">${contentHtml}</div>
    `;

    // Bind sources link
    const sourcesLink = messageDiv.querySelector('[data-action="show-sources"]');
    sourcesLink?.addEventListener('click', () => this.showSources());

    messagesEl.appendChild(messageDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    return id;
  }

  private removeMessage(id: string): void {
    document.getElementById(id)?.remove();
  }

  private formatMessage(text: string): string {
    if (!text) return '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    safe = safe.replace(/`(.+?)`/g, '<code>$1</code>');
    safe = safe.replace(/\n\n/g, '</p><p>');
    safe = safe.replace(/\n/g, '<br>');

    if (!safe.startsWith('<p>') && !safe.startsWith('<div')) {
      safe = `<p>${safe}</p>`;
    }

    return safe;
  }

  private setLoadingState(loading: boolean): void {
    const sendBtn = this.$('#send-btn') as HTMLButtonElement;
    const input = this.$('#chat-input') as HTMLInputElement;
    
    if (sendBtn) sendBtn.disabled = loading;
    if (input) input.disabled = loading;
  }

  private showSources(): void {
    const panel = this.$('#sources-panel');
    const list = this.$('#sources-list');
    
    if (!panel || !list || !this.lastSources.length) return;

    list.innerHTML = this.lastSources.map(source => `
      <li>
        <div class="source-title">${this.escapeHtml(source.title)}</div>
        <div class="source-meta">
          ${source.source ? this.escapeHtml(source.source) : 'Brak źródła'}
          <span class="source-similarity">${Math.round(source.similarity * 100)}%</span>
        </div>
      </li>
    `).join('');

    panel.classList.remove('hidden');
    panel.classList.add('visible');
  }

  private hideSources(): void {
    const panel = this.$('#sources-panel');
    if (!panel) return;
    
    panel.classList.remove('visible');
    setTimeout(() => panel.classList.add('hidden'), 300);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
