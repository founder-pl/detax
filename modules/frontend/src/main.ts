/**
 * Bielik Frontend - Main Entry Point
 * ===================================
 * Inicjalizacja aplikacji z komponentami TypeScript
 */

// Legacy UI modules (backward compatibility)
import { initChat } from './ui/chat';
import { initDocumentsPanel } from './ui/documents';
import { initProjectsPanel } from './ui/projects';
import { initDashboardLayout } from './ui/dashboard';

// New Component-based architecture
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { ContextPanel } from './components/ContextPanel';
import { SourcesPanel } from './components/SourcesPanel';
import { DocumentsPanel } from './components/DocumentsPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { EventBus } from './core/Component';

interface AppConfig {
  useNewComponents: boolean;
}

const config: AppConfig = {
  // Set to true to use new component architecture
  // Set to false for backward compatibility with existing HTML
  useNewComponents: false,
};

/**
 * Handle SSO token from URL (IDCard.pl integration)
 */
function handleSSOToken(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('sso_token');
  
  if (ssoToken) {
    // Save token to localStorage
    localStorage.setItem('detax_token', ssoToken);
    
    // Decode token to get user info
    try {
      const payload = JSON.parse(atob(ssoToken.split('.')[1]));
      const user = {
        id: payload.sub,
        email: payload.email,
        sso: true,
        sso_from: payload.sso_from || 'idcard.pl'
      };
      localStorage.setItem('detax_user', JSON.stringify(user));
      console.log('✅ SSO login successful:', user.email);
      
      // Show SSO success message in UI
      showSSOSuccess(user.email);
    } catch (e) {
      console.error('SSO token decode error:', e);
    }
    
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    // Check if already logged in via SSO
    const savedUser = localStorage.getItem('detax_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.sso) {
          updateUserDisplay(user.email);
        }
      } catch (e) {}
    }
  }
}

/**
 * Show SSO success notification
 */
function showSSOSuccess(email: string): void {
  // Update status display
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = `Zalogowano przez IDCard.pl: ${email}`;
    statusText.parentElement?.classList.add('connected');
  }
  
  // Add welcome message to chat
  const messages = document.getElementById('messages');
  if (messages) {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'message assistant';
    welcomeMsg.innerHTML = `
      <div class="message-avatar">🔐</div>
      <div class="message-content">
        <p><strong>Zalogowano przez IDCard.pl!</strong></p>
        <p>Witaj, <strong>${email}</strong>! Jesteś zalogowany przez Single Sign-On z IDCard.pl.</p>
        <p>Możesz teraz korzystać z wszystkich funkcji Detax AI.</p>
      </div>
    `;
    messages.insertBefore(welcomeMsg, messages.firstChild?.nextSibling || null);
  }
}

/**
 * Update user display for returning SSO users
 */
function updateUserDisplay(email: string): void {
  const statusText = document.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = `Zalogowano: ${email}`;
  }
}

/**
 * Initialize with legacy modules (existing HTML structure)
 */
function initLegacy(): void {
  // Handle SSO token first
  handleSSOToken();
  
  initChat();
  initDocumentsPanel();
  initProjectsPanel();
  initDashboardLayout();
  
  // Initialize new SourcesPanel if container exists
  const sourcesContainer = document.getElementById('sources-data-panel');
  if (sourcesContainer) {
    new SourcesPanel({ container: sourcesContainer }).mount();
  }
}

/**
 * Initialize with new component architecture
 */
function initComponents(): void {
  // Header
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) {
    new Header({ container: headerContainer }).mount();
  }

  // Chat Panel
  const chatContainer = document.getElementById('app-chat');
  if (chatContainer) {
    new ChatPanel({ container: chatContainer }).mount();
  }

  // Context Panel
  const contextContainer = document.getElementById('app-context');
  if (contextContainer) {
    new ContextPanel({ container: contextContainer }).mount();
  }

  // Sources Panel
  const sourcesContainer = document.getElementById('app-sources');
  if (sourcesContainer) {
    new SourcesPanel({ container: sourcesContainer }).mount();
  }

  // Documents Panel (legacy)
  initDocumentsPanel();

  // Projects Panel (legacy)  
  initProjectsPanel();

  // Dashboard Layout
  initDashboardLayout();
}

/**
 * Bootstrap application
 */
export function bootstrap(): void {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.log('🦅 Bielik Frontend initializing...');
      
      if (config.useNewComponents) {
        initComponents();
        console.log('✅ Components initialized');
      } else {
        initLegacy();
        console.log('✅ Legacy modules initialized');
      }

      // Global event listeners
      EventBus.on('context:changed', (state) => {
        console.log('Context changed:', state);
      });

      EventBus.on('entity:verified', (result) => {
        console.log('Entity verified:', result);
      });

    } catch (e) {
      console.error('❌ Błąd inicjalizacji frontendu:', e);
    }
  });
}

// Auto-bootstrap
bootstrap();

// Export for external use
export { EventBus, api } from './core/Component';
export { Header } from './components/Header';
export { ChatPanel } from './components/ChatPanel';
export { ContextPanel } from './components/ContextPanel';
export { SourcesPanel } from './components/SourcesPanel';
export { DocumentsPanel } from './components/DocumentsPanel';
export { ProjectsPanel } from './components/ProjectsPanel';
