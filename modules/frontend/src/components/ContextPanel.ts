/**
 * ContextPanel Component - Hierarchia kontekstu: Kontakty → Projekty → Pliki → Kanały
 */
import { Component, ComponentConfig, api, EventBus } from '../core/Component';

interface Contact {
  name: string;
  projects: Project[];
}

interface Project {
  id: number;
  name: string;
  description: string;
  files: ProjectFile[];
}

interface ProjectFile {
  id: number;
  filename: string;
  path: string;
}

interface Channel {
  id: string;
  name: string;
}

interface ContextState {
  selectedContact: string | null;
  selectedProject: Project | null;
  selectedFile: ProjectFile | null;
  recommendedChannels: Channel[];
}

export class ContextPanel extends Component {
  private contacts: Contact[] = [];
  private state: ContextState = {
    selectedContact: null,
    selectedProject: null,
    selectedFile: null,
    recommendedChannels: [],
  };

  render(): string {
    return `
      <div class="context-panel">
        <div class="context-section contacts-section">
          <h3>👥 Kontakty</h3>
          <ul class="contacts-list" id="context-contacts">
            ${this.renderContacts()}
          </ul>
        </div>

        <div class="context-section projects-section">
          <h3>📁 Projekty</h3>
          <ul class="projects-list" id="context-projects">
            ${this.renderProjects()}
          </ul>
        </div>

        <div class="context-section files-section">
          <h3>📄 Pliki</h3>
          <ul class="files-list" id="context-files">
            ${this.renderFiles()}
          </ul>
        </div>

        <div class="context-section channels-section">
          <h3>📢 Rekomendowane kanały</h3>
          <ul class="channels-list" id="context-channels">
            ${this.renderChannels()}
          </ul>
        </div>

        <div class="context-summary" id="context-summary">
          ${this.renderSummary()}
        </div>
      </div>
    `;
  }

  private renderContacts(): string {
    if (!this.contacts.length) {
      return '<li class="empty">Ładowanie...</li>';
    }

    return this.contacts.map(contact => `
      <li class="contact-item ${this.state.selectedContact === contact.name ? 'active' : ''}" 
          data-contact="${this.escapeHtml(contact.name)}">
        <span class="contact-icon">👤</span>
        <span class="contact-name">${this.escapeHtml(contact.name)}</span>
        <span class="contact-count">${contact.projects.length}</span>
      </li>
    `).join('');
  }

  private renderProjects(): string {
    if (!this.state.selectedContact) {
      return '<li class="empty">Wybierz kontakt</li>';
    }

    const contact = this.contacts.find(c => c.name === this.state.selectedContact);
    if (!contact || !contact.projects.length) {
      return '<li class="empty">Brak projektów</li>';
    }

    return contact.projects.map(project => `
      <li class="project-item ${this.state.selectedProject?.id === project.id ? 'active' : ''}"
          data-project-id="${project.id}">
        <span class="project-icon">📋</span>
        <div class="project-info">
          <span class="project-name">${this.escapeHtml(project.name)}</span>
          <span class="project-desc">${this.escapeHtml(project.description || '')}</span>
        </div>
        <span class="project-files-count">${project.files.length} plików</span>
      </li>
    `).join('');
  }

  private renderFiles(): string {
    if (!this.state.selectedProject) {
      return '<li class="empty">Wybierz projekt</li>';
    }

    if (!this.state.selectedProject.files.length) {
      return '<li class="empty">Brak plików</li>';
    }

    return this.state.selectedProject.files.map(file => `
      <li class="file-item ${this.state.selectedFile?.id === file.id ? 'active' : ''}"
          data-file-id="${file.id}">
        <span class="file-icon">${this.getFileIcon(file.filename)}</span>
        <span class="file-name">${this.escapeHtml(file.filename)}</span>
      </li>
    `).join('');
  }

  private renderChannels(): string {
    if (!this.state.recommendedChannels.length) {
      return '<li class="empty">Wybierz kontekst, aby zobaczyć kanały</li>';
    }

    return this.state.recommendedChannels.map(channel => `
      <li class="channel-item" data-channel="${channel.id}">
        <span class="channel-hash">#</span>
        <span class="channel-name">${this.escapeHtml(channel.name)}</span>
      </li>
    `).join('');
  }

  private renderSummary(): string {
    const parts: string[] = [];
    
    if (this.state.selectedContact) {
      parts.push(`👤 ${this.state.selectedContact}`);
    }
    if (this.state.selectedProject) {
      parts.push(`📁 ${this.state.selectedProject.name}`);
    }
    if (this.state.selectedFile) {
      parts.push(`📄 ${this.state.selectedFile.filename}`);
    }

    if (!parts.length) {
      return '<span class="summary-empty">Wybierz kontekst do rozmowy z Bielikiem</span>';
    }

    return `
      <div class="summary-path">${parts.join(' → ')}</div>
      <button class="clear-context-btn" id="clear-context">Wyczyść</button>
    `;
  }

  private getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      xls: '📗',
      xlsx: '📗',
      txt: '📄',
      jpg: '🖼️',
      png: '🖼️',
    };
    return icons[ext || ''] || '📄';
  }

  protected async afterMount(): Promise<void> {
    await this.loadHierarchy();
  }

  private async loadHierarchy(): Promise<void> {
    try {
      const data = await api.get<{ contacts: Contact[] }>('/context/hierarchy');
      this.contacts = data.contacts;
      this.updateUI();
    } catch (e) {
      console.error('Error loading context hierarchy:', e);
    }
  }

  private async loadChannels(): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (this.state.selectedContact) {
        params.set('contact', this.state.selectedContact);
      }
      if (this.state.selectedProject) {
        params.set('project_id', String(this.state.selectedProject.id));
      }
      if (this.state.selectedFile) {
        params.set('file_id', String(this.state.selectedFile.id));
      }

      const data = await api.get<{ channels: Channel[] }>(`/context/channels?${params}`);
      this.state.recommendedChannels = data.channels;
      this.updateChannelsUI();
      
      // Emit context change event
      EventBus.emit('context:changed', this.state);
    } catch (e) {
      console.error('Error loading channels:', e);
    }
  }

  private updateUI(): void {
    const contactsList = this.$('#context-contacts');
    const projectsList = this.$('#context-projects');
    const filesList = this.$('#context-files');
    const summary = this.$('#context-summary');

    if (contactsList) contactsList.innerHTML = this.renderContacts();
    if (projectsList) projectsList.innerHTML = this.renderProjects();
    if (filesList) filesList.innerHTML = this.renderFiles();
    if (summary) summary.innerHTML = this.renderSummary();

    this.rebindEvents();
  }

  private updateChannelsUI(): void {
    const channelsList = this.$('#context-channels');
    if (channelsList) channelsList.innerHTML = this.renderChannels();
    this.bindChannelEvents();
  }

  protected bindEvents(): void {
    this.rebindEvents();
  }

  private rebindEvents(): void {
    // Contacts
    this.$$('#context-contacts .contact-item').forEach(item => {
      item.addEventListener('click', () => {
        const contact = item.dataset.contact;
        if (contact) this.selectContact(contact);
      });
    });

    // Projects
    this.$$('#context-projects .project-item').forEach(item => {
      item.addEventListener('click', () => {
        const projectId = parseInt(item.dataset.projectId || '0');
        if (projectId) this.selectProject(projectId);
      });
    });

    // Files
    this.$$('#context-files .file-item').forEach(item => {
      item.addEventListener('click', () => {
        const fileId = parseInt(item.dataset.fileId || '0');
        if (fileId) this.selectFile(fileId);
      });
    });

    // Clear button
    const clearBtn = this.$('#clear-context');
    clearBtn?.addEventListener('click', () => this.clearContext());

    this.bindChannelEvents();
  }

  private bindChannelEvents(): void {
    this.$$('#context-channels .channel-item').forEach(item => {
      item.addEventListener('click', () => {
        const channelId = item.dataset.channel;
        if (channelId) {
          EventBus.emit('channel:selected', channelId);
        }
      });
    });
  }

  private selectContact(contactName: string): void {
    this.state.selectedContact = contactName;
    this.state.selectedProject = null;
    this.state.selectedFile = null;
    this.state.recommendedChannels = [];
    this.updateUI();
    this.loadChannels();
  }

  private selectProject(projectId: number): void {
    const contact = this.contacts.find(c => c.name === this.state.selectedContact);
    const project = contact?.projects.find(p => p.id === projectId);
    
    if (project) {
      this.state.selectedProject = project;
      this.state.selectedFile = null;
      this.updateUI();
      this.loadChannels();
    }
  }

  private selectFile(fileId: number): void {
    const file = this.state.selectedProject?.files.find(f => f.id === fileId);
    if (file) {
      this.state.selectedFile = file;
      this.updateUI();
      this.loadChannels();
    }
  }

  private clearContext(): void {
    this.state = {
      selectedContact: null,
      selectedProject: null,
      selectedFile: null,
      recommendedChannels: [],
    };
    this.updateUI();
    this.updateChannelsUI();
    EventBus.emit('context:cleared');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
