"use strict";
(() => {
  // src/ui/chat.ts
  var API_URL = "/api/v1";
  var MODULES = {
    default: { name: "Og\xF3lne", icon: "\u{1F4AC}" },
    ksef: { name: "KSeF", icon: "\u{1F4C4}" },
    b2b: { name: "B2B", icon: "\u{1F4BC}" },
    zus: { name: "ZUS", icon: "\u{1F3E5}" },
    vat: { name: "VAT", icon: "\u{1F4B0}" }
  };
  function initChannels() {
    const channelItems = document.querySelectorAll(".channel-item");
    if (!channelItems.length) return;
    channelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const moduleId = item.dataset.module;
        if (!moduleId) return;
        channelItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        setModule(moduleId);
      });
    });
  }
  var elements = {
    messages: document.getElementById("messages"),
    form: document.getElementById("chat-form"),
    input: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    status: document.getElementById("status"),
    statusText: document.querySelector(".status-text"),
    currentModule: document.getElementById("current-module"),
    charCount: document.getElementById("char-count"),
    sourcesPanel: document.getElementById("sources-panel"),
    sourcesList: document.getElementById("sources-list"),
    closeSources: document.getElementById("close-sources"),
    quickQuestions: document.getElementById("quick-questions")
  };
  var currentModule = "default";
  var isLoading = false;
  var lastSources = [];
  function initChat() {
    if (!elements.form || !elements.input || !elements.messages) return;
    initModuleButtons();
    initChannels();
    initForm();
    initQuickQuestions();
    initSourcesPanel();
    void checkHealth();
    elements.input.focus();
  }
  function initModuleButtons() {
    const buttons = document.querySelectorAll(".module-btn");
    buttons.forEach((btn) => {
      const moduleId = btn.dataset.module;
      if (!moduleId) return;
      btn.addEventListener("click", () => {
        setModule(moduleId);
      });
    });
  }
  function initForm() {
    const { form, input, charCount } = elements;
    if (!form || !input) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message || isLoading) return;
      await sendMessage(message);
    });
    input.addEventListener("input", () => {
      if (!charCount) return;
      const count = input.value.length;
      charCount.textContent = `${count}/2000`;
    });
    input.addEventListener("keydown", (e) => {
      const ev = e;
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });
  }
  async function sendMessage(message) {
    isLoading = true;
    setLoadingState(true);
    if (elements.quickQuestions) {
      elements.quickQuestions.style.display = "none";
    }
    addMessage(message, "user");
    if (elements.input && elements.charCount) {
      elements.input.value = "";
      elements.charCount.textContent = "0/2000";
    }
    const loadingId = addMessage("", "assistant", true);
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          module: currentModule
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      removeMessage(loadingId);
      addMessage(data.response, "assistant", false, data.sources || []);
      lastSources = data.sources || [];
    } catch (error) {
      console.error("Error:", error);
      removeMessage(loadingId);
      addMessage(
        "Przepraszam, wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia. Sprawd\u017A czy serwisy dzia\u0142aj\u0105 (docker compose ps) i spr\xF3buj ponownie.",
        "assistant"
      );
    } finally {
      isLoading = false;
      setLoadingState(false);
      elements.input?.focus();
    }
  }
  function addMessage(text, role, isLoadingMsg = false, sources) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!elements.messages) return id;
    const messageDiv = document.createElement("div");
    messageDiv.id = id;
    messageDiv.className = `message ${role}${isLoadingMsg ? " loading" : ""}`;
    const avatar = role === "user" ? "\u{1F464}" : "\u{1F985}";
    let contentHtml = formatMessage(text);
    if (sources && sources.length > 0) {
      contentHtml += `
            <div class="sources-link" onclick="showSources()">
                \u{1F4DA} Zobacz \u017Ar\xF3d\u0142a (${sources.length})
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
  function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
  function formatMessage(text) {
    if (!text) return "";
    let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    safe = safe.replace(/`(.+?)`/g, "<code>$1</code>");
    safe = safe.replace(/\n\n/g, "</p><p>");
    safe = safe.replace(/\n/g, "<br>");
    if (!safe.startsWith("<p>")) {
      safe = `<p>${safe}</p>`;
    }
    return safe;
  }
  function scrollToBottom() {
    if (!elements.messages) return;
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  function setLoadingState(loading) {
    if (elements.sendBtn) elements.sendBtn.disabled = loading;
    if (elements.input) elements.input.disabled = loading;
  }
  function initQuickQuestions() {
    const buttons = document.querySelectorAll(".quick-btn");
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const question = btn.dataset.question || "";
        const moduleId = btn.dataset.module;
        if (moduleId && moduleId !== currentModule) {
          setModule(moduleId);
        }
        if (elements.input) {
          elements.input.value = question;
          elements.form?.dispatchEvent(new Event("submit"));
        }
      });
    });
  }
  function initSourcesPanel() {
    if (elements.closeSources) {
      elements.closeSources.addEventListener("click", hideSources);
    }
    document.addEventListener("click", (e) => {
      if (!elements.sourcesPanel) return;
      const target = e.target;
      if (!target) return;
      const clickedInsidePanel = elements.sourcesPanel.contains(target);
      const isSourcesLink = target.classList.contains("sources-link");
      if (!clickedInsidePanel && !isSourcesLink) {
        hideSources();
      }
    });
  }
  function showSources() {
    if (!elements.sourcesPanel || !elements.sourcesList) return;
    if (!lastSources.length) return;
    elements.sourcesList.innerHTML = lastSources.map(
      (source) => `
        <li>
            <div class="source-title">${escapeHtml(source.title)}</div>
            <div class="source-meta">
                ${escapeHtml(source.source)}
                <span class="source-similarity">${Math.round(source.similarity * 100)}%</span>
            </div>
        </li>
    `
    ).join("");
    elements.sourcesPanel.classList.remove("hidden");
    elements.sourcesPanel.classList.add("visible");
  }
  function hideSources() {
    if (!elements.sourcesPanel) return;
    elements.sourcesPanel.classList.remove("visible");
    setTimeout(() => {
      elements.sourcesPanel && elements.sourcesPanel.classList.add("hidden");
    }, 300);
  }
  async function checkHealth() {
    try {
      const baseUrl = API_URL.replace("/api/v1", "");
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      if (!elements.status || !elements.statusText) return;
      if (data.status === "healthy") {
        elements.status.classList.add("healthy");
        elements.status.classList.remove("unhealthy");
        elements.statusText.textContent = "Po\u0142\u0105czono z Bielikiem";
      } else if (data.status === "degraded") {
        elements.statusText.textContent = "Cz\u0119\u015Bciowo dost\u0119pny";
        if (data.services?.model === "not_loaded") {
          elements.statusText.textContent = "\u0141adowanie modelu...";
        }
      } else {
        elements.status.classList.add("unhealthy");
        elements.statusText.textContent = "B\u0142\u0105d po\u0142\u0105czenia";
      }
    } catch (error) {
      console.error("Health check failed:", error);
      if (elements.status && elements.statusText) {
        elements.status.classList.add("unhealthy");
        elements.statusText.textContent = "Brak po\u0142\u0105czenia";
      }
    } finally {
      setTimeout(() => {
        void checkHealth();
      }, 3e4);
    }
  }
  function setModule(module) {
    currentModule = module;
    document.querySelectorAll(".module-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.module === module);
    });
    if (elements.currentModule) {
      const info = MODULES[module];
      elements.currentModule.textContent = `Modu\u0142: ${info.name}`;
    }
    const messages = {
      default: "Zadaj dowolne pytanie dotycz\u0105ce prowadzenia firmy w Polsce.",
      ksef: "Pytaj o Krajowy System e-Faktur: terminy wdro\u017Cenia, wymagania techniczne, procedury.",
      b2b: "Pomog\u0119 oceni\u0107 ryzyko Twojej umowy B2B wed\u0142ug kryteri\xF3w Inspekcji Pracy.",
      zus: "Oblicz\u0119 sk\u0142adki ZUS i wyja\u015Bni\u0119 zasady ubezpiecze\u0144 dla przedsi\u0119biorc\xF3w.",
      vat: "Pomog\u0119 z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi."
    };
    addMessage(messages[module], "assistant");
    elements.input?.focus();
  }
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  if (typeof window !== "undefined") {
    window.showSources = showSources;
    window.setModule = setModule;
  }

  // src/ui/documents.ts
  var API_URL2 = "/api/v1";
  var currentDocumentId = null;
  function getElements() {
    return {
      documentsList: document.getElementById("documents-list"),
      documentsRefresh: document.getElementById("documents-refresh"),
      docTitle: document.getElementById("doc-title"),
      docCategory: document.getElementById("doc-category"),
      docContent: document.getElementById("doc-content"),
      docNew: document.getElementById("doc-new"),
      docDelete: document.getElementById("doc-delete"),
      docSave: document.getElementById("doc-save"),
      documentEvents: document.getElementById("document-events")
    };
  }
  function initDocumentsPanel() {
    const els = getElements();
    if (!els.documentsList) return;
    els.documentsRefresh?.addEventListener("click", loadDocuments);
    els.docNew?.addEventListener("click", () => {
      currentDocumentId = null;
      clearDocumentEditor();
    });
    els.docSave?.addEventListener("click", saveDocument);
    els.docDelete?.addEventListener("click", deleteDocument);
    void loadDocuments();
  }
  async function loadDocuments() {
    const els = getElements();
    if (!els.documentsList) return;
    try {
      const resp = await fetch(`${API_URL2.replace("/api/v1", "")}/api/v1/documents?limit=50`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const docs = await resp.json();
      renderDocumentsList(docs || []);
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 dokument\xF3w:", err);
    }
  }
  function renderDocumentsList(docs) {
    const els = getElements();
    if (!els.documentsList) return;
    els.documentsList.innerHTML = "";
    docs.forEach((doc) => {
      const li = document.createElement("li");
      li.className = "document-item";
      li.dataset.id = String(doc.id);
      li.textContent = `${doc.title} (${doc.category})`;
      li.addEventListener("click", () => {
        selectDocument(doc, li);
      });
      els.documentsList.appendChild(li);
    });
  }
  function selectDocument(doc, element) {
    currentDocumentId = doc.id;
    document.querySelectorAll(".document-item").forEach((li) => li.classList.remove("active"));
    if (element) element.classList.add("active");
    const els = getElements();
    if (els.docTitle) els.docTitle.value = doc.title || "";
    if (els.docCategory) els.docCategory.value = doc.category || "";
    if (els.docContent) els.docContent.value = doc.content || "";
    void loadDocumentEvents(doc.id);
  }
  function clearDocumentEditor() {
    document.querySelectorAll(".document-item").forEach((li) => li.classList.remove("active"));
    const els = getElements();
    if (els.docTitle) els.docTitle.value = "";
    if (els.docCategory) els.docCategory.value = "";
    if (els.docContent) els.docContent.value = "";
    if (els.documentEvents) {
      els.documentEvents.innerHTML = "";
    }
  }
  async function loadDocumentEvents(documentId) {
    const els = getElements();
    if (!els.documentEvents) return;
    try {
      const resp = await fetch(`${API_URL2}/events/documents/${documentId}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const events = await resp.json();
      renderDocumentEvents(events || []);
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 historii dokumentu:", err);
    }
  }
  function renderDocumentEvents(events) {
    const els = getElements();
    if (!els.documentEvents) return;
    els.documentEvents.innerHTML = events.map((ev) => {
      const ts = ev.created_at || ev.createdAt;
      const when = ts ? new Date(ts).toLocaleString("pl-PL") : "";
      const type = ev.event_type || ev.eventType || "";
      return `<li>[${when}] ${escapeHtml2(type)}</li>`;
    }).join("");
  }
  async function saveDocument() {
    const els = getElements();
    if (!els.docTitle || !els.docCategory || !els.docContent) return;
    const title = els.docTitle.value.trim();
    const category = els.docCategory.value.trim() || "default";
    const content = els.docContent.value.trim();
    if (!title || !content) {
      alert("Tytu\u0142 i tre\u015B\u0107 dokumentu nie mog\u0105 by\u0107 puste.");
      return;
    }
    const payload = { title, category, content, source: null };
    try {
      let url;
      let body;
      if (currentDocumentId) {
        url = `${API_URL2}/commands/documents/update`;
        body = {
          id: currentDocumentId,
          title,
          source: null,
          category,
          content
        };
      } else {
        url = `${API_URL2}/commands/documents/create`;
        body = payload;
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const doc = await resp.json();
      currentDocumentId = doc.id;
      await loadDocuments();
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 zapisa\u0107 dokumentu:", err);
      alert("Nie uda\u0142o si\u0119 zapisa\u0107 dokumentu. Sprawd\u017A logi API.");
    }
  }
  async function deleteDocument() {
    if (!currentDocumentId) return;
    if (!confirm("Na pewno usun\u0105\u0107 ten dokument?")) return;
    try {
      const resp = await fetch(`${API_URL2}/commands/documents/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentDocumentId })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      currentDocumentId = null;
      clearDocumentEditor();
      await loadDocuments();
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 usun\u0105\u0107 dokumentu:", err);
      alert("Nie uda\u0142o si\u0119 usun\u0105\u0107 dokumentu.");
    }
  }
  function escapeHtml2(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/ui/projects.ts
  var API_URL3 = "/api/v1";
  var currentProjectId = null;
  var currentFileId = null;
  var currentContact = null;
  function getElements2() {
    return {
      projectsList: document.getElementById("projects-list"),
      filesList: document.getElementById("files-list")
    };
  }
  function initProjectsPanel() {
    const els = getElements2();
    if (!els.projectsList || !els.filesList) return;
    const contactItems = document.querySelectorAll(".contact-item");
    contactItems.forEach((item) => {
      item.addEventListener("click", () => {
        contactItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        currentContact = item.textContent?.trim() || null;
        void loadProjects();
      });
    });
    void loadProjects();
  }
  async function loadProjects() {
    const els = getElements2();
    if (!els.projectsList) return;
    try {
      let url = `${API_URL3}/projects?limit=50`;
      if (currentContact) {
        const encoded = encodeURIComponent(currentContact);
        url = `${API_URL3}/projects?contact=${encoded}&limit=50`;
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const projects = await resp.json();
      renderProjects(projects || []);
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 projekt\xF3w:", err);
    }
  }
  function renderProjects(projects) {
    const els = getElements2();
    if (!els.projectsList || !els.filesList) return;
    els.projectsList.innerHTML = "";
    currentProjectId = null;
    currentFileId = null;
    els.filesList.innerHTML = "";
    projects.forEach((project) => {
      const li = document.createElement("li");
      li.className = "project-item";
      li.dataset.projectId = String(project.id);
      const name = project.name || `Projekt ${project.id}`;
      const icon = getProjectIcon(name);
      li.innerHTML = `<span class="project-icon">${icon}</span> ${escapeHtml3(name)}`;
      li.addEventListener("click", () => {
        document.querySelectorAll(".project-item").forEach((i) => i.classList.remove("active"));
        li.classList.add("active");
        currentProjectId = project.id;
        void loadProjectFiles(project.id);
        void updateContextChannels();
      });
      els.projectsList.appendChild(li);
    });
  }
  async function loadProjectFiles(projectId) {
    const els = getElements2();
    if (!els.filesList) return;
    try {
      const resp = await fetch(`${API_URL3}/projects/${projectId}/files`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const files = await resp.json();
      renderFiles(files || []);
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 plik\xF3w projektu:", err);
    }
  }
  function renderFiles(files) {
    const els = getElements2();
    if (!els.filesList) return;
    els.filesList.innerHTML = "";
    currentFileId = null;
    files.forEach((file) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.dataset.fileId = String(file.id);
      const icon = getFileIcon(file.filename || "");
      li.innerHTML = `${icon} ${escapeHtml3(file.filename || "")}`;
      li.addEventListener("click", () => {
        document.querySelectorAll(".file-item").forEach((i) => i.classList.remove("active"));
        li.classList.add("active");
        currentFileId = file.id;
        void updateContextChannels();
      });
      els.filesList.appendChild(li);
    });
  }
  function getFileIcon(filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const icons = {
      pdf: "\u{1F4D1}",
      doc: "\u{1F4DD}",
      docx: "\u{1F4DD}",
      xls: "\u{1F4CA}",
      xlsx: "\u{1F4CA}",
      txt: "\u{1F4C4}",
      png: "\u{1F5BC}\uFE0F",
      jpg: "\u{1F5BC}\uFE0F",
      jpeg: "\u{1F5BC}\uFE0F",
      gif: "\u{1F5BC}\uFE0F",
      zip: "\u{1F4E6}",
      rar: "\u{1F4E6}"
    };
    return icons[ext] || "\u{1F4C4}";
  }
  function getProjectIcon(name) {
    const lower = (name || "").toLowerCase();
    if (lower.includes("ksef") || lower.includes("faktur")) return "\u{1F4CB}";
    if (lower.includes("b2b") || lower.includes("umowa") || lower.includes("kontrakt")) return "\u{1F4BC}";
    if (lower.includes("zus") || lower.includes("sk\u0142adk")) return "\u{1F3E5}";
    if (lower.includes("vat") || lower.includes("jpk")) return "\u{1F4B0}";
    return "\u{1F4C1}";
  }
  async function updateContextChannels() {
    try {
      const params = new URLSearchParams();
      if (currentContact) params.append("contact", currentContact);
      if (currentProjectId != null) params.append("project_id", String(currentProjectId));
      if (currentFileId != null) params.append("file_id", String(currentFileId));
      if (![...params.keys()].length) {
        resetContextChannels();
        return;
      }
      const resp = await fetch(`${API_URL3}/context/channels?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const channels = data.channels || [];
      if (channels.length === 0) {
        resetContextChannels();
        return;
      }
      const first = channels[0];
      if (first?.id && window.setModule) {
        window.setModule(first.id);
      }
      const recommendedIds = new Set(channels.map((c) => c.id));
      document.querySelectorAll(".channel-item").forEach((item) => {
        const mod = item.dataset.module;
        if (!mod) return;
        item.classList.toggle("recommended", recommendedIds.has(mod));
      });
    } catch (err) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 kana\u0142\xF3w kontekstowych:", err);
      resetContextChannels();
    }
  }
  function resetContextChannels() {
    if (window.setModule) {
      window.setModule("default");
    }
    document.querySelectorAll(".channel-item").forEach((item) => {
      const mod = item.dataset.module;
      if (!mod) return;
      item.classList.remove("recommended");
      item.classList.toggle("active", mod === "default");
    });
  }
  function escapeHtml3(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/ui/dashboard.ts
  var API_URL4 = "/api/v1";
  var isEditMode = false;
  var draggedModule = null;
  function getElements3() {
    return {
      panelLeft: document.getElementById("panel-left"),
      panelRight: document.getElementById("panel-right"),
      editToggle: document.getElementById("edit-dashboard-toggle")
    };
  }
  async function initDashboardLayout() {
    const modules = document.querySelectorAll(".dashboard-module");
    modules.forEach((el) => {
      el.classList.add("no-drag");
    });
    try {
      const response = await fetch(`${API_URL4}/layout`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.modules)) {
          applyLayoutFromConfig(data.modules);
        }
      }
    } catch (error) {
      console.error("Nie uda\u0142o si\u0119 pobra\u0107 uk\u0142adu dashboardu:", error);
    }
    initDragAndDrop();
    initEditToggle();
  }
  function applyLayoutFromConfig(configModules) {
    const allModules = {};
    document.querySelectorAll(".dashboard-module").forEach((el) => {
      const id = el.dataset.moduleId;
      if (id) {
        allModules[id] = el;
      }
    });
    const { panelLeft, panelRight } = getElements3();
    if (!panelLeft || !panelRight) return;
    panelLeft.innerHTML = "";
    panelRight.innerHTML = "";
    const byColumn = {
      left: panelLeft,
      right: panelRight
    };
    configModules.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((cfg) => {
      const el = allModules[cfg.id];
      const panel = byColumn[cfg.column] || panelLeft;
      if (el && panel) {
        panel.appendChild(el);
      }
    });
    Object.keys(allModules).forEach((id) => {
      const el = allModules[id];
      if (el && !el.parentElement) {
        panelLeft.appendChild(el);
      }
    });
  }
  function initDragAndDrop() {
    const modules = document.querySelectorAll(".dashboard-module");
    modules.forEach((el) => {
      el.addEventListener("dragstart", onModuleDragStart);
      el.addEventListener("dragend", onModuleDragEnd);
    });
    const { panelLeft, panelRight } = getElements3();
    [panelLeft, panelRight].forEach((panel) => {
      if (!panel) return;
      panel.addEventListener("dragover", onPanelDragOver);
      panel.addEventListener("drop", onPanelDrop);
    });
  }
  function onModuleDragStart(event) {
    if (!isEditMode) {
      event.preventDefault();
      return;
    }
    const target = event.currentTarget;
    if (!target) return;
    draggedModule = target;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
    draggedModule.classList.add("dragging");
  }
  function onModuleDragEnd() {
    if (draggedModule) {
      draggedModule.classList.remove("dragging");
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
    if (!panel) return;
    const targetElement = event.target?.closest(".dashboard-module");
    if (targetElement && targetElement !== draggedModule && targetElement.parentElement === panel) {
      panel.insertBefore(draggedModule, targetElement);
    } else {
      panel.appendChild(draggedModule);
    }
    draggedModule.classList.remove("dragging");
    draggedModule = null;
    saveCurrentLayout();
  }
  function saveCurrentLayout() {
    const { panelLeft, panelRight } = getElements3();
    if (!panelLeft || !panelRight) return;
    const config2 = { modules: [] };
    const columns = [
      ["left", panelLeft],
      ["right", panelRight]
    ];
    columns.forEach(([column, panel]) => {
      const mods = panel.querySelectorAll(".dashboard-module");
      mods.forEach((el, index) => {
        const id = el.dataset.moduleId;
        if (!id) return;
        config2.modules.push({
          id,
          column,
          order: index
        });
      });
    });
    fetch(`${API_URL4}/layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config2)
    }).catch((err) => {
      console.error("Nie uda\u0142o si\u0119 zapisa\u0107 uk\u0142adu dashboardu:", err);
    });
  }
  function initEditToggle() {
    const { editToggle } = getElements3();
    if (!editToggle) return;
    editToggle.addEventListener("click", () => {
      isEditMode = !isEditMode;
      editToggle.classList.toggle("active", isEditMode);
      editToggle.setAttribute("aria-pressed", String(isEditMode));
      document.body.classList.toggle("dashboard-edit", isEditMode);
      const modules = document.querySelectorAll(".dashboard-module");
      modules.forEach((el) => {
        if (isEditMode) {
          el.classList.remove("no-drag");
          el.setAttribute("draggable", "true");
        } else {
          el.classList.add("no-drag");
          el.removeAttribute("draggable");
        }
      });
    });
  }

  // src/core/Component.ts
  var Component = class {
    constructor(config2) {
      this.mounted = false;
      this.config = config2;
      this.container = typeof config2.container === "string" ? document.querySelector(config2.container) : config2.container;
    }
    mount() {
      if (!this.container) {
        console.warn(`Container not found for component`);
        return;
      }
      this.container.innerHTML = this.render();
      this.mounted = true;
      this.afterMount();
      this.bindEvents();
    }
    afterMount() {
    }
    bindEvents() {
    }
    $(selector) {
      return this.container?.querySelector(selector) || null;
    }
    $$(selector) {
      return this.container?.querySelectorAll(selector) || document.querySelectorAll("__none__");
    }
    destroy() {
      if (this.container) {
        this.container.innerHTML = "";
      }
      this.mounted = false;
    }
  };
  var EventBusClass = class {
    constructor() {
      this.events = /* @__PURE__ */ new Map();
    }
    on(event, callback) {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event).push(callback);
    }
    off(event, callback) {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    }
    emit(event, ...args) {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => cb(...args));
      }
    }
  };
  var EventBus = new EventBusClass();
  var ApiClient = class _ApiClient {
    constructor(baseUrl = "/api/v1") {
      this.baseUrl = baseUrl;
    }
    static getInstance() {
      if (!_ApiClient.instance) {
        _ApiClient.instance = new _ApiClient();
      }
      return _ApiClient.instance;
    }
    async get(endpoint) {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
    async post(endpoint, data) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
    async delete(endpoint) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
    getBaseUrl() {
      return this.baseUrl.replace("/api/v1", "");
    }
  };
  var api = ApiClient.getInstance();

  // src/components/Header.ts
  var Header = class extends Component {
    constructor() {
      super(...arguments);
      this.status = "checking";
      this.statusMessage = "Sprawdzam po\u0142\u0105czenie...";
    }
    render() {
      return `
      <header class="header">
        <div class="logo">
          <h1 class="detax-logo">
            <span class="de">de</span><span class="tax">tax</span>
          </h1>
        </div>
        <p class="tagline">Odetchnij od podatk\xF3w</p>
        <div class="status ${this.status}" id="app-status">
          <span class="status-dot"></span>
          <span class="status-text">${this.statusMessage}</span>
        </div>
      </header>
    `;
    }
    async afterMount() {
      await this.checkHealth();
    }
    async checkHealth() {
      try {
        const baseUrl = api.getBaseUrl();
        const response = await fetch(`${baseUrl}/health`);
        const data = await response.json();
        this.status = data.status;
        if (data.status === "healthy") {
          this.statusMessage = "Po\u0142\u0105czono z Bielikiem";
        } else if (data.status === "degraded") {
          this.statusMessage = data.services?.model === "not_loaded" ? "\u0141adowanie modelu..." : "Cz\u0119\u015Bciowo dost\u0119pny";
        } else {
          this.statusMessage = "B\u0142\u0105d po\u0142\u0105czenia";
        }
      } catch (e) {
        this.status = "unhealthy";
        this.statusMessage = "Brak po\u0142\u0105czenia";
      }
      this.updateStatus();
      setTimeout(() => this.checkHealth(), 3e4);
    }
    updateStatus() {
      const statusEl = this.$("#app-status");
      const statusText = this.$(".status-text");
      if (statusEl) {
        statusEl.className = `status ${this.status}`;
      }
      if (statusText) {
        statusText.textContent = this.statusMessage;
      }
    }
  };

  // src/components/ChatPanel.ts
  var MODULES2 = {
    default: {
      name: "Og\xF3lne",
      icon: "\u{1F4AC}",
      hint: "Zadaj dowolne pytanie dotycz\u0105ce prowadzenia firmy w Polsce."
    },
    ksef: {
      name: "KSeF",
      icon: "\u{1F4C4}",
      hint: "Pytaj o Krajowy System e-Faktur: terminy wdro\u017Cenia, wymagania techniczne, procedury."
    },
    b2b: {
      name: "B2B",
      icon: "\u{1F4BC}",
      hint: "Pomog\u0119 oceni\u0107 ryzyko Twojej umowy B2B wed\u0142ug kryteri\xF3w Inspekcji Pracy."
    },
    zus: {
      name: "ZUS",
      icon: "\u{1F3E5}",
      hint: "Oblicz\u0119 sk\u0142adki ZUS i wyja\u015Bni\u0119 zasady ubezpiecze\u0144 dla przedsi\u0119biorc\xF3w."
    },
    vat: {
      name: "VAT",
      icon: "\u{1F4B0}",
      hint: "Pomog\u0119 z JPK_VAT, VAT OSS i innymi rozliczeniami podatkowymi."
    }
  };
  var QUICK_QUESTIONS = [
    { question: "Kiedy KSeF b\u0119dzie obowi\u0105zkowy?", module: "ksef", label: "KSeF" },
    { question: "Jak oceni\u0107 czy moja umowa B2B jest bezpieczna?", module: "b2b", label: "B2B" },
    { question: "Ile wynosi sk\u0142adka zdrowotna na rycza\u0142cie w 2025?", module: "zus", label: "ZUS" },
    { question: "Co to jest VAT OSS i kiedy go stosowa\u0107?", module: "vat", label: "VAT" }
  ];
  var ChatPanel = class extends Component {
    constructor() {
      super(...arguments);
      this.currentModule = "default";
      this.isLoading = false;
      this.lastSources = [];
      this.showQuickQuestions = true;
    }
    render() {
      return `
      <div class="chat-panel-component">
        <div class="chat-channels">
          <h4>\u{1F4E2} Kana\u0142y</h4>
          <ul class="channels-list">
            ${Object.entries(MODULES2).map(([id, mod]) => `
              <li class="channel-item ${id === this.currentModule ? "active" : ""}" 
                  data-module="${id}">
                <span class="channel-icon">${mod.icon}</span>
                <span class="channel-name"># ${mod.name.toLowerCase()}</span>
              </li>
            `).join("")}
          </ul>
        </div>

        <main class="chat-container">
          <div id="chat-messages" class="messages">
            ${this.renderWelcomeMessage()}
          </div>

          <div class="quick-questions ${this.showQuickQuestions ? "" : "hidden"}" id="quick-questions">
            <span class="quick-label">Szybkie pytania:</span>
            <div class="quick-btns">
              ${QUICK_QUESTIONS.map((q) => `
                <button class="quick-btn" data-question="${q.question}" data-module="${q.module}">
                  ${q.label}
                </button>
              `).join("")}
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
              <button type="submit" id="send-btn" ${this.isLoading ? "disabled" : ""}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div class="input-hints">
              <span class="current-module" id="current-module">Modu\u0142: ${MODULES2[this.currentModule].name}</span>
              <span class="char-count" id="char-count">0/2000</span>
            </div>
          </form>
        </main>

        <aside id="sources-panel" class="sources-panel hidden">
          <div class="sources-header">
            <h3>\u{1F4DA} \u0179r\xF3d\u0142a</h3>
            <button class="close-btn" id="close-sources">\xD7</button>
          </div>
          <ul id="sources-list" class="sources-list"></ul>
        </aside>
      </div>
    `;
    }
    renderWelcomeMessage() {
      return `
      <div class="message assistant">
        <div class="message-avatar">\u{1F985}</div>
        <div class="message-content">
          <p>Cze\u015B\u0107! Jestem <strong>Bielikiem</strong> - polskim asystentem AI dla przedsi\u0119biorc\xF3w.</p>
          <p>Mog\u0119 pom\xF3c Ci z:</p>
          <ul>
            <li><strong>KSeF</strong> - terminy, wymagania, procedury e-faktur</li>
            <li><strong>B2B</strong> - ryzyko przekwalifikowania umowy na etat</li>
            <li><strong>ZUS</strong> - sk\u0142adki, ubezpieczenia, obliczenia</li>
            <li><strong>VAT</strong> - JPK, VAT OSS, rozliczenia</li>
          </ul>
          <p>Wybierz kana\u0142 po lewej i zadaj pytanie!</p>
        </div>
      </div>
    `;
    }
    afterMount() {
      EventBus.on("channel:selected", (channelId) => {
        if (channelId in MODULES2) {
          this.setModule(channelId);
        }
      });
    }
    bindEvents() {
      this.$$(".channel-item").forEach((item) => {
        item.addEventListener("click", () => {
          const moduleId = item.dataset.module;
          if (moduleId) this.setModule(moduleId);
        });
      });
      const form = this.$("#chat-form");
      const input = this.$("#chat-input");
      const charCount = this.$("#char-count");
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = input?.value.trim();
        if (message && !this.isLoading) {
          await this.sendMessage(message);
        }
      });
      input?.addEventListener("input", () => {
        if (charCount) {
          charCount.textContent = `${input.value.length}/2000`;
        }
      });
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          form?.dispatchEvent(new Event("submit"));
        }
      });
      this.$$(".quick-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const question = btn.dataset.question;
          const moduleId = btn.dataset.module;
          if (moduleId && moduleId !== this.currentModule) {
            this.setModule(moduleId);
          }
          if (question && input) {
            input.value = question;
            form?.dispatchEvent(new Event("submit"));
          }
        });
      });
      const closeBtn = this.$("#close-sources");
      closeBtn?.addEventListener("click", () => this.hideSources());
      input?.focus();
    }
    setModule(module) {
      this.currentModule = module;
      this.$$(".channel-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.module === module);
      });
      const moduleIndicator = this.$("#current-module");
      if (moduleIndicator) {
        moduleIndicator.textContent = `Modu\u0142: ${MODULES2[module].name}`;
      }
      this.addMessage(MODULES2[module].hint, "assistant");
      this.$("#chat-input")?.focus();
    }
    async sendMessage(message) {
      this.isLoading = true;
      this.setLoadingState(true);
      const quickEl = this.$("#quick-questions");
      if (quickEl) quickEl.classList.add("hidden");
      this.showQuickQuestions = false;
      this.addMessage(message, "user");
      const input = this.$("#chat-input");
      const charCount = this.$("#char-count");
      if (input) input.value = "";
      if (charCount) charCount.textContent = "0/2000";
      const loadingId = this.addMessage("", "assistant", true);
      try {
        const data = await api.post("/chat", {
          message,
          module: this.currentModule
        });
        this.removeMessage(loadingId);
        this.addMessage(data.response, "assistant", false, data.sources);
        this.lastSources = data.sources || [];
      } catch (e) {
        console.error("Chat error:", e);
        this.removeMessage(loadingId);
        this.addMessage(
          "Przepraszam, wyst\u0105pi\u0142 b\u0142\u0105d po\u0142\u0105czenia. Sprawd\u017A czy serwisy dzia\u0142aj\u0105 i spr\xF3buj ponownie.",
          "assistant"
        );
      } finally {
        this.isLoading = false;
        this.setLoadingState(false);
        input?.focus();
      }
    }
    addMessage(text, role, isLoading2 = false, sources) {
      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const messagesEl = this.$("#chat-messages");
      if (!messagesEl) return id;
      const avatar = role === "user" ? "\u{1F464}" : "\u{1F985}";
      let contentHtml = this.formatMessage(text);
      if (sources && sources.length > 0) {
        contentHtml += `
        <div class="sources-link" data-action="show-sources">
          \u{1F4DA} Zobacz \u017Ar\xF3d\u0142a (${sources.length})
        </div>
      `;
      }
      const messageDiv = document.createElement("div");
      messageDiv.id = id;
      messageDiv.className = `message ${role}${isLoading2 ? " loading" : ""}`;
      messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">${contentHtml}</div>
    `;
      const sourcesLink = messageDiv.querySelector('[data-action="show-sources"]');
      sourcesLink?.addEventListener("click", () => this.showSources());
      messagesEl.appendChild(messageDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return id;
    }
    removeMessage(id) {
      document.getElementById(id)?.remove();
    }
    formatMessage(text) {
      if (!text) return '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
      safe = safe.replace(/`(.+?)`/g, "<code>$1</code>");
      safe = safe.replace(/\n\n/g, "</p><p>");
      safe = safe.replace(/\n/g, "<br>");
      if (!safe.startsWith("<p>") && !safe.startsWith("<div")) {
        safe = `<p>${safe}</p>`;
      }
      return safe;
    }
    setLoadingState(loading) {
      const sendBtn = this.$("#send-btn");
      const input = this.$("#chat-input");
      if (sendBtn) sendBtn.disabled = loading;
      if (input) input.disabled = loading;
    }
    showSources() {
      const panel = this.$("#sources-panel");
      const list = this.$("#sources-list");
      if (!panel || !list || !this.lastSources.length) return;
      list.innerHTML = this.lastSources.map((source) => `
      <li>
        <div class="source-title">${this.escapeHtml(source.title)}</div>
        <div class="source-meta">
          ${source.source ? this.escapeHtml(source.source) : "Brak \u017Ar\xF3d\u0142a"}
          <span class="source-similarity">${Math.round(source.similarity * 100)}%</span>
        </div>
      </li>
    `).join("");
      panel.classList.remove("hidden");
      panel.classList.add("visible");
    }
    hideSources() {
      const panel = this.$("#sources-panel");
      if (!panel) return;
      panel.classList.remove("visible");
      setTimeout(() => panel.classList.add("hidden"), 300);
    }
    escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  // src/components/ContextPanel.ts
  var ContextPanel = class extends Component {
    constructor() {
      super(...arguments);
      this.contacts = [];
      this.state = {
        selectedContact: null,
        selectedProject: null,
        selectedFile: null,
        recommendedChannels: []
      };
    }
    render() {
      return `
      <div class="context-panel">
        <div class="context-section contacts-section">
          <h3>\u{1F465} Kontakty</h3>
          <ul class="contacts-list" id="context-contacts">
            ${this.renderContacts()}
          </ul>
        </div>

        <div class="context-section projects-section">
          <h3>\u{1F4C1} Projekty</h3>
          <ul class="projects-list" id="context-projects">
            ${this.renderProjects()}
          </ul>
        </div>

        <div class="context-section files-section">
          <h3>\u{1F4C4} Pliki</h3>
          <ul class="files-list" id="context-files">
            ${this.renderFiles()}
          </ul>
        </div>

        <div class="context-section channels-section">
          <h3>\u{1F4E2} Rekomendowane kana\u0142y</h3>
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
    renderContacts() {
      if (!this.contacts.length) {
        return '<li class="empty">\u0141adowanie...</li>';
      }
      return this.contacts.map((contact) => `
      <li class="contact-item ${this.state.selectedContact === contact.name ? "active" : ""}" 
          data-contact="${this.escapeHtml(contact.name)}">
        <span class="contact-icon">\u{1F464}</span>
        <span class="contact-name">${this.escapeHtml(contact.name)}</span>
        <span class="contact-count">${contact.projects.length}</span>
      </li>
    `).join("");
    }
    renderProjects() {
      if (!this.state.selectedContact) {
        return '<li class="empty">Wybierz kontakt</li>';
      }
      const contact = this.contacts.find((c) => c.name === this.state.selectedContact);
      if (!contact || !contact.projects.length) {
        return '<li class="empty">Brak projekt\xF3w</li>';
      }
      return contact.projects.map((project) => `
      <li class="project-item ${this.state.selectedProject?.id === project.id ? "active" : ""}"
          data-project-id="${project.id}">
        <span class="project-icon">\u{1F4CB}</span>
        <div class="project-info">
          <span class="project-name">${this.escapeHtml(project.name)}</span>
          <span class="project-desc">${this.escapeHtml(project.description || "")}</span>
        </div>
        <span class="project-files-count">${project.files.length} plik\xF3w</span>
      </li>
    `).join("");
    }
    renderFiles() {
      if (!this.state.selectedProject) {
        return '<li class="empty">Wybierz projekt</li>';
      }
      if (!this.state.selectedProject.files.length) {
        return '<li class="empty">Brak plik\xF3w</li>';
      }
      return this.state.selectedProject.files.map((file) => `
      <li class="file-item ${this.state.selectedFile?.id === file.id ? "active" : ""}"
          data-file-id="${file.id}">
        <span class="file-icon">${this.getFileIcon(file.filename)}</span>
        <span class="file-name">${this.escapeHtml(file.filename)}</span>
      </li>
    `).join("");
    }
    renderChannels() {
      if (!this.state.recommendedChannels.length) {
        return '<li class="empty">Wybierz kontekst, aby zobaczy\u0107 kana\u0142y</li>';
      }
      return this.state.recommendedChannels.map((channel) => `
      <li class="channel-item" data-channel="${channel.id}">
        <span class="channel-hash">#</span>
        <span class="channel-name">${this.escapeHtml(channel.name)}</span>
      </li>
    `).join("");
    }
    renderSummary() {
      const parts = [];
      if (this.state.selectedContact) {
        parts.push(`\u{1F464} ${this.state.selectedContact}`);
      }
      if (this.state.selectedProject) {
        parts.push(`\u{1F4C1} ${this.state.selectedProject.name}`);
      }
      if (this.state.selectedFile) {
        parts.push(`\u{1F4C4} ${this.state.selectedFile.filename}`);
      }
      if (!parts.length) {
        return '<span class="summary-empty">Wybierz kontekst do rozmowy z Bielikiem</span>';
      }
      return `
      <div class="summary-path">${parts.join(" \u2192 ")}</div>
      <button class="clear-context-btn" id="clear-context">Wyczy\u015B\u0107</button>
    `;
    }
    getFileIcon(filename) {
      const ext = filename.split(".").pop()?.toLowerCase();
      const icons = {
        pdf: "\u{1F4D5}",
        doc: "\u{1F4D8}",
        docx: "\u{1F4D8}",
        xls: "\u{1F4D7}",
        xlsx: "\u{1F4D7}",
        txt: "\u{1F4C4}",
        jpg: "\u{1F5BC}\uFE0F",
        png: "\u{1F5BC}\uFE0F"
      };
      return icons[ext || ""] || "\u{1F4C4}";
    }
    async afterMount() {
      await this.loadHierarchy();
    }
    async loadHierarchy() {
      try {
        const data = await api.get("/context/hierarchy");
        this.contacts = data.contacts;
        this.updateUI();
      } catch (e) {
        console.error("Error loading context hierarchy:", e);
      }
    }
    async loadChannels() {
      try {
        const params = new URLSearchParams();
        if (this.state.selectedContact) {
          params.set("contact", this.state.selectedContact);
        }
        if (this.state.selectedProject) {
          params.set("project_id", String(this.state.selectedProject.id));
        }
        if (this.state.selectedFile) {
          params.set("file_id", String(this.state.selectedFile.id));
        }
        const data = await api.get(`/context/channels?${params}`);
        this.state.recommendedChannels = data.channels;
        this.updateChannelsUI();
        EventBus.emit("context:changed", this.state);
      } catch (e) {
        console.error("Error loading channels:", e);
      }
    }
    updateUI() {
      const contactsList = this.$("#context-contacts");
      const projectsList = this.$("#context-projects");
      const filesList = this.$("#context-files");
      const summary = this.$("#context-summary");
      if (contactsList) contactsList.innerHTML = this.renderContacts();
      if (projectsList) projectsList.innerHTML = this.renderProjects();
      if (filesList) filesList.innerHTML = this.renderFiles();
      if (summary) summary.innerHTML = this.renderSummary();
      this.rebindEvents();
    }
    updateChannelsUI() {
      const channelsList = this.$("#context-channels");
      if (channelsList) channelsList.innerHTML = this.renderChannels();
      this.bindChannelEvents();
    }
    bindEvents() {
      this.rebindEvents();
    }
    rebindEvents() {
      this.$$("#context-contacts .contact-item").forEach((item) => {
        item.addEventListener("click", () => {
          const contact = item.dataset.contact;
          if (contact) this.selectContact(contact);
        });
      });
      this.$$("#context-projects .project-item").forEach((item) => {
        item.addEventListener("click", () => {
          const projectId = parseInt(item.dataset.projectId || "0");
          if (projectId) this.selectProject(projectId);
        });
      });
      this.$$("#context-files .file-item").forEach((item) => {
        item.addEventListener("click", () => {
          const fileId = parseInt(item.dataset.fileId || "0");
          if (fileId) this.selectFile(fileId);
        });
      });
      const clearBtn = this.$("#clear-context");
      clearBtn?.addEventListener("click", () => this.clearContext());
      this.bindChannelEvents();
    }
    bindChannelEvents() {
      this.$$("#context-channels .channel-item").forEach((item) => {
        item.addEventListener("click", () => {
          const channelId = item.dataset.channel;
          if (channelId) {
            EventBus.emit("channel:selected", channelId);
          }
        });
      });
    }
    selectContact(contactName) {
      this.state.selectedContact = contactName;
      this.state.selectedProject = null;
      this.state.selectedFile = null;
      this.state.recommendedChannels = [];
      this.updateUI();
      this.loadChannels();
    }
    selectProject(projectId) {
      const contact = this.contacts.find((c) => c.name === this.state.selectedContact);
      const project = contact?.projects.find((p) => p.id === projectId);
      if (project) {
        this.state.selectedProject = project;
        this.state.selectedFile = null;
        this.updateUI();
        this.loadChannels();
      }
    }
    selectFile(fileId) {
      const file = this.state.selectedProject?.files.find((f) => f.id === fileId);
      if (file) {
        this.state.selectedFile = file;
        this.updateUI();
        this.loadChannels();
      }
    }
    clearContext() {
      this.state = {
        selectedContact: null,
        selectedProject: null,
        selectedFile: null,
        recommendedChannels: []
      };
      this.updateUI();
      this.updateChannelsUI();
      EventBus.emit("context:cleared");
    }
    escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  // src/components/SourcesPanel.ts
  var SourcesPanel = class extends Component {
    constructor() {
      super(...arguments);
      this.sources = [];
      this.legalDocs = [];
      this.activeTab = "sources";
      this.filterType = "all";
    }
    render() {
      return `
      <div class="sources-panel-component">
        <div class="sources-tabs">
          <button class="tab-btn ${this.activeTab === "sources" ? "active" : ""}" data-tab="sources">
            \u{1F517} \u0179r\xF3d\u0142a danych
          </button>
          <button class="tab-btn ${this.activeTab === "documents" ? "active" : ""}" data-tab="documents">
            \u{1F4DC} Akty prawne
          </button>
        </div>

        <div class="sources-filter">
          <select class="filter-select" id="source-type-filter">
            <option value="all" ${this.filterType === "all" ? "selected" : ""}>Wszystkie</option>
            <option value="official" ${this.filterType === "official" ? "selected" : ""}>Urz\u0119dowe</option>
            <option value="commercial" ${this.filterType === "commercial" ? "selected" : ""}>Komercyjne</option>
          </select>
        </div>

        <div class="sources-content">
          ${this.activeTab === "sources" ? this.renderSources() : this.renderDocuments()}
        </div>

        <div class="sources-verify">
          <h4>\u{1F50D} Weryfikacja podmiotu</h4>
          <div class="verify-form">
            <input type="text" id="verify-input" placeholder="NIP, KRS lub VAT UE (np. PL1234567890)">
            <select id="verify-type">
              <option value="nip">NIP (CEIDG)</option>
              <option value="krs">KRS</option>
              <option value="vat_eu">VAT UE (VIES)</option>
            </select>
            <button type="button" id="verify-btn" class="verify-button">Sprawd\u017A</button>
          </div>
          <div id="verify-result" class="verify-result"></div>
        </div>
      </div>
    `;
    }
    renderSources() {
      const filtered = this.sources.filter(
        (s) => this.filterType === "all" || s.type === this.filterType
      );
      if (!filtered.length) {
        return '<div class="sources-empty">\u0141adowanie \u017Ar\xF3de\u0142...</div>';
      }
      return `
      <ul class="sources-list-component">
        ${filtered.map((source) => `
          <li class="source-item ${source.active ? "" : "inactive"}" data-source-id="${source.id}">
            <div class="source-header">
              <span class="source-type-badge ${source.type}">${source.type === "official" ? "\u{1F3DB}\uFE0F" : "\u{1F4BC}"}</span>
              <span class="source-name">${this.escapeHtml(source.name)}</span>
              <span class="source-status ${source.active ? "active" : "inactive"}">
                ${source.active ? "\u2705" : "\u{1F511}"}
              </span>
            </div>
            <div class="source-description">${this.escapeHtml(source.description)}</div>
            <a href="${source.base_url}" target="_blank" class="source-url">${source.base_url}</a>
          </li>
        `).join("")}
      </ul>
    `;
    }
    renderDocuments() {
      if (!this.legalDocs.length) {
        return '<div class="sources-empty">\u0141adowanie dokument\xF3w...</div>';
      }
      const grouped = this.groupByCategory(this.legalDocs);
      return `
      <div class="legal-docs-list">
        ${Object.entries(grouped).map(([category, docs]) => `
          <div class="docs-category">
            <h5 class="category-header">${this.getCategoryLabel(category)}</h5>
            <ul class="docs-list">
              ${docs.map((doc) => `
                <li class="doc-item">
                  <a href="${doc.url}" target="_blank" class="doc-link">
                    <span class="doc-title">${this.escapeHtml(doc.title)}</span>
                    <span class="doc-id">${doc.id}</span>
                  </a>
                </li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `;
    }
    groupByCategory(docs) {
      return docs.reduce((acc, doc) => {
        if (!acc[doc.category]) acc[doc.category] = [];
        acc[doc.category].push(doc);
        return acc;
      }, {});
    }
    getCategoryLabel(category) {
      const labels = {
        ksef: "\u{1F4C4} KSeF",
        vat: "\u{1F4B0} VAT",
        b2b: "\u{1F4BC} B2B / Prawo pracy",
        zus: "\u{1F3E5} ZUS"
      };
      return labels[category] || category;
    }
    async afterMount() {
      await this.loadData();
    }
    async loadData() {
      try {
        const [sources, docs] = await Promise.all([
          api.get("/sources"),
          api.get("/legal-documents")
        ]);
        this.sources = sources;
        this.legalDocs = docs;
        this.updateContent();
      } catch (e) {
        console.error("Error loading sources data:", e);
      }
    }
    updateContent() {
      const content = this.$(".sources-content");
      if (content) {
        content.innerHTML = this.activeTab === "sources" ? this.renderSources() : this.renderDocuments();
      }
    }
    bindEvents() {
      this.$$(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.activeTab = btn.dataset.tab;
          this.$$(".tab-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          this.updateContent();
        });
      });
      const filterSelect = this.$("#source-type-filter");
      filterSelect?.addEventListener("change", () => {
        this.filterType = filterSelect.value;
        this.updateContent();
      });
      const verifyBtn = this.$("#verify-btn");
      verifyBtn?.addEventListener("click", () => this.handleVerify());
      const verifyInput = this.$("#verify-input");
      verifyInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.handleVerify();
      });
    }
    async handleVerify() {
      const input = this.$("#verify-input");
      const typeSelect = this.$("#verify-type");
      const resultDiv = this.$("#verify-result");
      if (!input || !typeSelect || !resultDiv) return;
      const identifier = input.value.trim();
      if (!identifier) {
        resultDiv.innerHTML = '<span class="error">Wprowad\u017A identyfikator</span>';
        return;
      }
      resultDiv.innerHTML = '<span class="loading">Weryfikuj\u0119...</span>';
      try {
        const result = await api.post("/verify", {
          identifier,
          type: typeSelect.value
        });
        if (result.valid) {
          resultDiv.innerHTML = `
          <div class="verify-success">
            <strong>\u2705 Zweryfikowano:</strong> ${this.escapeHtml(identifier)}<br>
            ${result.data?.name ? `<strong>Nazwa:</strong> ${this.escapeHtml(result.data.name)}<br>` : ""}
            ${result.data?.address ? `<strong>Adres:</strong> ${this.escapeHtml(result.data.address)}` : ""}
          </div>
        `;
          EventBus.emit("entity:verified", result);
        } else {
          resultDiv.innerHTML = `
          <div class="verify-error">
            \u274C ${result.error || "Nie znaleziono"}
          </div>
        `;
        }
      } catch (e) {
        resultDiv.innerHTML = '<span class="error">B\u0142\u0105d weryfikacji</span>';
      }
    }
    escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  // src/main.ts
  var config = {
    // Set to true to use new component architecture
    // Set to false for backward compatibility with existing HTML
    useNewComponents: false
  };
  function initLegacy() {
    initChat();
    initDocumentsPanel();
    initProjectsPanel();
    initDashboardLayout();
    const sourcesContainer = document.getElementById("sources-data-panel");
    if (sourcesContainer) {
      new SourcesPanel({ container: sourcesContainer }).mount();
    }
  }
  function initComponents() {
    const headerContainer = document.getElementById("app-header");
    if (headerContainer) {
      new Header({ container: headerContainer }).mount();
    }
    const chatContainer = document.getElementById("app-chat");
    if (chatContainer) {
      new ChatPanel({ container: chatContainer }).mount();
    }
    const contextContainer = document.getElementById("app-context");
    if (contextContainer) {
      new ContextPanel({ container: contextContainer }).mount();
    }
    const sourcesContainer = document.getElementById("app-sources");
    if (sourcesContainer) {
      new SourcesPanel({ container: sourcesContainer }).mount();
    }
    initDocumentsPanel();
    initProjectsPanel();
    initDashboardLayout();
  }
  function bootstrap() {
    document.addEventListener("DOMContentLoaded", () => {
      try {
        console.log("\u{1F985} Bielik Frontend initializing...");
        if (config.useNewComponents) {
          initComponents();
          console.log("\u2705 Components initialized");
        } else {
          initLegacy();
          console.log("\u2705 Legacy modules initialized");
        }
        EventBus.on("context:changed", (state) => {
          console.log("Context changed:", state);
        });
        EventBus.on("entity:verified", (result) => {
          console.log("Entity verified:", result);
        });
      } catch (e) {
        console.error("\u274C B\u0142\u0105d inicjalizacji frontendu:", e);
      }
    });
  }
  bootstrap();
})();
//# sourceMappingURL=app.js.map
