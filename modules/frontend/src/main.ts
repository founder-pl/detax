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
 * Initialize with legacy modules (existing HTML structure)
 */
function initLegacy(): void {
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
export { EventBus } from './core/Component';
export { Header } from './components/Header';
export { ChatPanel } from './components/ChatPanel';
export { ContextPanel } from './components/ContextPanel';
export { SourcesPanel } from './components/SourcesPanel';
