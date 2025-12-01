/**
 * ProjectsPanel Component - CQRS Project Management with Event Sourcing
 */
import { Component, ComponentConfig, api, EventBus } from '../core/Component';

interface Project {
  id: number;
  name: string;
  description: string;
  contact: string;
}

interface ProjectFile {
  id: number;
  project_id: number;
  filename: string;
  path: string;
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

interface Contact {
  name: string;
  projects: Project[];
}

type ViewMode = 'list' | 'edit' | 'files';

export class ProjectsPanel extends Component {
  private projects: Project[] = [];
  private contacts: string[] = [];
  private selectedProject: Project | null = null;
  private projectFiles: ProjectFile[] = [];
  private events: DomainEvent[] = [];
  private viewMode: ViewMode = 'list';
  private filterContact: string | null = null;

  render(): string {
    return `
      <div class="projects-panel-component">
        <div class="projects-header">
          <h3>📁 Projekty (CQRS)</h3>
          <div class="projects-actions">
            <button type="button" class="btn-icon" id="proj-refresh" title="Odśwież">🔄</button>
            <button type="button" class="btn-icon" id="proj-new" title="Nowy projekt">➕</button>
          </div>
        </div>

        <div class="projects-filter">
          <select id="contact-filter" class="filter-select">
            <option value="">Wszystkie kontakty</option>
            ${this.contacts.map(c => `
              <option value="${this.escapeHtml(c)}" ${this.filterContact === c ? 'selected' : ''}>
                ${this.escapeHtml(c)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="projects-content">
          ${this.viewMode === 'list' ? this.renderList() : ''}
          ${this.viewMode === 'edit' ? this.renderEditor() : ''}
          ${this.viewMode === 'files' ? this.renderFiles() : ''}
        </div>
      </div>
    `;
  }

  private renderList(): string {
    const filtered = this.filterContact 
      ? this.projects.filter(p => p.contact === this.filterContact)
      : this.projects;

    if (!filtered.length) {
      return '<div class="empty">Brak projektów. Kliknij ➕ aby dodać nowy.</div>';
    }

    // Group by contact
    const grouped = this.groupByContact(filtered);

    return `
      <div class="projects-grouped">
        ${Object.entries(grouped).map(([contact, projects]) => `
          <div class="contact-group">
            <div class="contact-header">
              <span class="contact-icon">👤</span>
              <span class="contact-name">${this.escapeHtml(contact || 'Bez kontaktu')}</span>
              <span class="contact-count">${projects.length}</span>
            </div>
            <ul class="projects-list-component">
              ${projects.map(proj => `
                <li class="project-item ${this.selectedProject?.id === proj.id ? 'selected' : ''}"
                    data-proj-id="${proj.id}">
                  <span class="project-icon">📋</span>
                  <div class="project-info">
                    <span class="project-name">${this.escapeHtml(proj.name)}</span>
                    <span class="project-desc">${this.escapeHtml(proj.description || '')}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderEditor(): string {
    const proj = this.selectedProject;
    const isNew = !proj?.id;

    return `
      <form class="project-editor-form" id="proj-editor-form">
        <div class="form-group">
          <label for="proj-name-input">Nazwa projektu</label>
          <input type="text" id="proj-name-input" class="form-input"
                 value="${proj ? this.escapeHtml(proj.name) : ''}"
                 placeholder="Nazwa projektu" required>
        </div>

        <div class="form-group">
          <label for="proj-contact-input">Kontakt</label>
          <input type="text" id="proj-contact-input" class="form-input"
                 value="${proj?.contact ? this.escapeHtml(proj.contact) : ''}"
                 placeholder="np. Kontrahent, Księgowa..."
                 list="contacts-datalist">
          <datalist id="contacts-datalist">
            ${this.contacts.map(c => `<option value="${this.escapeHtml(c)}">`).join('')}
          </datalist>
        </div>

        <div class="form-group">
          <label for="proj-desc-input">Opis</label>
          <textarea id="proj-desc-input" class="form-textarea" rows="4"
                    placeholder="Opis projektu...">${proj?.description ? this.escapeHtml(proj.description) : ''}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn secondary" id="proj-cancel">Anuluj</button>
          ${!isNew ? `
            <button type="button" class="btn info" id="proj-files">📄 Pliki</button>
            <button type="button" class="btn danger" id="proj-delete">Usuń</button>
          ` : ''}
          <button type="submit" class="btn primary">${isNew ? 'Utwórz' : 'Zapisz'}</button>
        </div>

        ${!isNew ? `
          <div class="editor-events-preview">
            <h4>📜 Historia zdarzeń</h4>
            <ul class="events-mini-list">
              ${this.events.slice(0, 3).map(e => `
                <li class="event-mini">
                  <span class="event-type">${e.event_type}</span>
                  <span class="event-time">${this.formatTime(e.created_at)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </form>
    `;
  }

  private renderFiles(): string {
    if (!this.selectedProject) {
      return '<div class="empty">Wybierz projekt</div>';
    }

    return `
      <div class="files-panel">
        <div class="files-header">
          <h4>📄 Pliki projektu: ${this.escapeHtml(this.selectedProject.name)}</h4>
          <button type="button" class="btn secondary btn-sm" id="files-back">← Wróć</button>
        </div>

        <form class="add-file-form" id="add-file-form">
          <div class="form-row">
            <input type="text" id="file-name-input" class="form-input" 
                   placeholder="Nazwa pliku (np. umowa.pdf)">
            <input type="text" id="file-path-input" class="form-input"
                   placeholder="Ścieżka (opcjonalna)">
            <button type="submit" class="btn primary btn-sm">Dodaj</button>
          </div>
        </form>

        <ul class="files-list-component">
          ${this.projectFiles.map(file => `
            <li class="file-item" data-file-id="${file.id}">
              <span class="file-icon">${this.getFileIcon(file.filename)}</span>
              <div class="file-info">
                <span class="file-name">${this.escapeHtml(file.filename)}</span>
                ${file.path ? `<span class="file-path">${this.escapeHtml(file.path)}</span>` : ''}
              </div>
              <button type="button" class="btn-icon danger" data-action="remove-file" data-file-id="${file.id}">🗑️</button>
            </li>
          `).join('')}
          ${!this.projectFiles.length ? '<li class="empty">Brak plików</li>' : ''}
        </ul>
      </div>
    `;
  }

  private groupByContact(projects: Project[]): Record<string, Project[]> {
    return projects.reduce((acc, proj) => {
      const contact = proj.contact || '';
      if (!acc[contact]) acc[contact] = [];
      acc[contact].push(proj);
      return acc;
    }, {} as Record<string, Project[]>);
  }

  private getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
      txt: '📄', jpg: '🖼️', png: '🖼️', zip: '📦',
    };
    return icons[ext || ''] || '📄';
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected async afterMount(): Promise<void> {
    await this.loadProjects();
  }

  private async loadProjects(): Promise<void> {
    try {
      this.projects = await api.get<Project[]>('/projects');
      this.contacts = [...new Set(this.projects.map(p => p.contact).filter(Boolean))];
      this.updateContent();
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  }

  private async loadProjectFiles(projectId: number): Promise<void> {
    try {
      this.projectFiles = await api.get<ProjectFile[]>(`/projects/${projectId}/files`);
    } catch (e) {
      console.error('Error loading project files:', e);
      this.projectFiles = [];
    }
  }

  private async loadEvents(projectId: number): Promise<void> {
    try {
      this.events = await api.get<DomainEvent[]>(`/events/projects/${projectId}`);
    } catch (e) {
      console.error('Error loading events:', e);
      this.events = [];
    }
  }

  private updateContent(): void {
    const content = this.$('.projects-content');
    const filter = this.$('.projects-filter');
    
    if (filter) {
      filter.innerHTML = `
        <select id="contact-filter" class="filter-select">
          <option value="">Wszystkie kontakty</option>
          ${this.contacts.map(c => `
            <option value="${this.escapeHtml(c)}" ${this.filterContact === c ? 'selected' : ''}>
              ${this.escapeHtml(c)}
            </option>
          `).join('')}
        </select>
      `;
      this.bindFilterEvents();
    }

    if (!content) return;

    if (this.viewMode === 'list') {
      content.innerHTML = this.renderList();
      this.bindListEvents();
    } else if (this.viewMode === 'edit') {
      content.innerHTML = this.renderEditor();
      this.bindEditorEvents();
    } else if (this.viewMode === 'files') {
      content.innerHTML = this.renderFiles();
      this.bindFilesEvents();
    }
  }

  protected bindEvents(): void {
    this.$('#proj-refresh')?.addEventListener('click', () => this.loadProjects());
    this.$('#proj-new')?.addEventListener('click', () => this.newProject());
    this.bindFilterEvents();
    this.bindListEvents();
  }

  private bindFilterEvents(): void {
    const filter = this.$('#contact-filter') as HTMLSelectElement;
    filter?.addEventListener('change', () => {
      this.filterContact = filter.value || null;
      this.updateContent();
    });
  }

  private bindListEvents(): void {
    this.$$('.project-item').forEach(item => {
      item.addEventListener('click', async () => {
        const projId = parseInt(item.dataset.projId || '0');
        await this.selectProject(projId);
      });
    });
  }

  private bindEditorEvents(): void {
    const form = this.$('#proj-editor-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProject();
    });

    this.$('#proj-cancel')?.addEventListener('click', () => {
      this.viewMode = 'list';
      this.selectedProject = null;
      this.updateContent();
    });

    this.$('#proj-files')?.addEventListener('click', async () => {
      if (this.selectedProject) {
        await this.loadProjectFiles(this.selectedProject.id);
        this.viewMode = 'files';
        this.updateContent();
      }
    });

    this.$('#proj-delete')?.addEventListener('click', async () => {
      if (this.selectedProject && confirm('Czy na pewno chcesz usunąć ten projekt?')) {
        await this.deleteProject(this.selectedProject.id);
      }
    });
  }

  private bindFilesEvents(): void {
    this.$('#files-back')?.addEventListener('click', () => {
      this.viewMode = 'edit';
      this.updateContent();
    });

    const form = this.$('#add-file-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addFile();
    });

    this.$$('[data-action="remove-file"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fileId = parseInt(btn.dataset.fileId || '0');
        if (fileId && confirm('Usunąć plik?')) {
          await this.removeFile(fileId);
        }
      });
    });
  }

  private async selectProject(projId: number): Promise<void> {
    try {
      this.selectedProject = await api.get<Project>(`/projects/${projId}`);
      await this.loadEvents(projId);
      this.viewMode = 'edit';
      this.updateContent();
      
      EventBus.emit('project:selected', this.selectedProject);
    } catch (e) {
      console.error('Error selecting project:', e);
    }
  }

  private newProject(): void {
    this.selectedProject = {
      id: 0,
      name: '',
      description: '',
      contact: '',
    };
    this.events = [];
    this.viewMode = 'edit';
    this.updateContent();
  }

  private async saveProject(): Promise<void> {
    const name = (this.$('#proj-name-input') as HTMLInputElement)?.value;
    const contact = (this.$('#proj-contact-input') as HTMLInputElement)?.value;
    const description = (this.$('#proj-desc-input') as HTMLTextAreaElement)?.value;

    if (!name) {
      alert('Podaj nazwę projektu');
      return;
    }

    try {
      if (this.selectedProject?.id) {
        await api.post('/commands/projects/update', {
          id: this.selectedProject.id,
          name,
          contact,
          description,
        });
        EventBus.emit('project:updated', this.selectedProject.id);
      } else {
        const result = await api.post<Project>('/commands/projects/create', {
          name,
          contact,
          description,
        });
        EventBus.emit('project:created', result.id);
      }

      await this.loadProjects();
      this.viewMode = 'list';
      this.selectedProject = null;
      this.updateContent();
    } catch (e) {
      console.error('Error saving project:', e);
      alert('Błąd zapisu projektu');
    }
  }

  private async deleteProject(projId: number): Promise<void> {
    try {
      await api.post('/commands/projects/delete', { id: projId });
      EventBus.emit('project:deleted', projId);
      
      await this.loadProjects();
      this.viewMode = 'list';
      this.selectedProject = null;
      this.updateContent();
    } catch (e) {
      console.error('Error deleting project:', e);
      alert('Błąd usuwania projektu');
    }
  }

  private async addFile(): Promise<void> {
    if (!this.selectedProject) return;

    const filename = (this.$('#file-name-input') as HTMLInputElement)?.value;
    const path = (this.$('#file-path-input') as HTMLInputElement)?.value;

    if (!filename) {
      alert('Podaj nazwę pliku');
      return;
    }

    try {
      await api.post('/commands/projects/files/add', {
        project_id: this.selectedProject.id,
        filename,
        path: path || null,
      });

      await this.loadProjectFiles(this.selectedProject.id);
      this.updateContent();
      
      EventBus.emit('file:added', { projectId: this.selectedProject.id, filename });
    } catch (e) {
      console.error('Error adding file:', e);
      alert('Błąd dodawania pliku');
    }
  }

  private async removeFile(fileId: number): Promise<void> {
    try {
      await api.post('/commands/projects/files/remove', { id: fileId });
      
      if (this.selectedProject) {
        await this.loadProjectFiles(this.selectedProject.id);
        this.updateContent();
      }
      
      EventBus.emit('file:removed', fileId);
    } catch (e) {
      console.error('Error removing file:', e);
      alert('Błąd usuwania pliku');
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
