const API_URL = '/api/v1';

interface ProjectDto {
  id: number;
  name: string;
  description?: string | null;
  contact?: string | null;
}

interface ProjectFileDto {
  id: number;
  project_id?: number;
  projectId?: number;
  filename: string;
  path?: string | null;
}

interface ContextChannel {
  id: string;
  name: string;
}

interface ContextChannelsResponse {
  channels: ContextChannel[];
}

let currentProjectId: number | null = null;
let currentFileId: number | null = null;
let currentContact: string | null = null;

function getElements() {
  return {
    projectsList: document.getElementById('projects-list') as HTMLUListElement | null,
    filesList: document.getElementById('files-list') as HTMLUListElement | null,
  };
}

export function initProjectsPanel(): void {
  const els = getElements();
  if (!els.projectsList || !els.filesList) return;

  const contactItems = document.querySelectorAll<HTMLElement>('.contact-item');
  contactItems.forEach((item) => {
    item.addEventListener('click', () => {
      contactItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      currentContact = item.textContent?.trim() || null;
      void loadProjects();
    });
  });

  void loadProjects();
}

async function loadProjects(): Promise<void> {
  const els = getElements();
  if (!els.projectsList) return;
  try {
    let url = `${API_URL}/projects?limit=50`;
    if (currentContact) {
      const encoded = encodeURIComponent(currentContact);
      url = `${API_URL}/projects?contact=${encoded}&limit=50`;
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const projects = (await resp.json()) as ProjectDto[];
    renderProjects(projects || []);
  } catch (err) {
    console.error('Nie udało się pobrać projektów:', err);
  }
}

function renderProjects(projects: ProjectDto[]): void {
  const els = getElements();
  if (!els.projectsList || !els.filesList) return;

  els.projectsList.innerHTML = '';
  currentProjectId = null;
  currentFileId = null;
  els.filesList.innerHTML = '';

  projects.forEach((project) => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.dataset.projectId = String(project.id);

    const name = project.name || `Projekt ${project.id}`;
    const icon = getProjectIcon(name);
    li.innerHTML = `<span class="project-icon">${icon}</span> ${escapeHtml(name)}`;

    li.addEventListener('click', () => {
      document.querySelectorAll('.project-item').forEach((i) => i.classList.remove('active'));
      li.classList.add('active');
      currentProjectId = project.id;
      void loadProjectFiles(project.id);
      void updateContextChannels();
    });

    els.projectsList!.appendChild(li);
  });
}

async function loadProjectFiles(projectId: number): Promise<void> {
  const els = getElements();
  if (!els.filesList) return;
  try {
    const resp = await fetch(`${API_URL}/projects/${projectId}/files`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const files = (await resp.json()) as ProjectFileDto[];
    renderFiles(files || []);
  } catch (err) {
    console.error('Nie udało się pobrać plików projektu:', err);
  }
}

function renderFiles(files: ProjectFileDto[]): void {
  const els = getElements();
  if (!els.filesList) return;
  els.filesList.innerHTML = '';
  currentFileId = null;

  files.forEach((file) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.fileId = String(file.id);
    const icon = getFileIcon(file.filename || '');
    li.innerHTML = `${icon} ${escapeHtml(file.filename || '')}`;

    li.addEventListener('click', () => {
      document.querySelectorAll('.file-item').forEach((i) => i.classList.remove('active'));
      li.classList.add('active');
      currentFileId = file.id;
      void updateContextChannels();
    });

    els.filesList!.appendChild(li);
  });
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    pdf: '📑',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    txt: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    zip: '📦',
    rar: '📦',
  };
  return icons[ext] || '📄';
}

function getProjectIcon(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('ksef') || lower.includes('faktur')) return '📋';
  if (lower.includes('b2b') || lower.includes('umowa') || lower.includes('kontrakt')) return '💼';
  if (lower.includes('zus') || lower.includes('składk')) return '🏥';
  if (lower.includes('vat') || lower.includes('jpk')) return '💰';
  return '📁';
}

async function updateContextChannels(): Promise<void> {
  try {
    const params = new URLSearchParams();
    if (currentContact) params.append('contact', currentContact);
    if (currentProjectId != null) params.append('project_id', String(currentProjectId));
    if (currentFileId != null) params.append('file_id', String(currentFileId));

    if (![...params.keys()].length) {
      resetContextChannels();
      return;
    }

    const resp = await fetch(`${API_URL}/context/channels?${params.toString()}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as ContextChannelsResponse;

    const channels = data.channels || [];
    if (channels.length === 0) {
      resetContextChannels();
      return;
    }

    const first = channels[0];
    if (first?.id && window.setModule) {
      window.setModule(first.id as any);
    }

    const recommendedIds = new Set(channels.map((c) => c.id));
    document.querySelectorAll<HTMLElement>('.channel-item').forEach((item) => {
      const mod = item.dataset.module;
      if (!mod) return;
      item.classList.toggle('recommended', recommendedIds.has(mod));
    });
  } catch (err) {
    console.error('Nie udało się pobrać kanałów kontekstowych:', err);
    resetContextChannels();
  }
}

function resetContextChannels(): void {
  if (window.setModule) {
    window.setModule('default' as any);
  }
  document.querySelectorAll<HTMLElement>('.channel-item').forEach((item) => {
    const mod = item.dataset.module;
    if (!mod) return;
    item.classList.remove('recommended');
    item.classList.toggle('active', mod === 'default');
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

