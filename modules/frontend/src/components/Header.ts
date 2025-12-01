/**
 * Header Component - Nagłówek aplikacji z logo i statusem
 */
import { Component, ComponentConfig, api } from '../core/Component';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, string>;
}

export class Header extends Component {
  private status: 'checking' | 'healthy' | 'degraded' | 'unhealthy' = 'checking';
  private statusMessage = 'Sprawdzam połączenie...';

  render(): string {
    return `
      <header class="header">
        <div class="logo">
          <h1 class="detax-logo">
            <span class="de">de</span><span class="tax">tax</span>
          </h1>
        </div>
        <p class="tagline">Odetchnij od podatków</p>
        <div class="status ${this.status}" id="app-status">
          <span class="status-dot"></span>
          <span class="status-text">${this.statusMessage}</span>
        </div>
      </header>
    `;
  }

  protected async afterMount(): Promise<void> {
    await this.checkHealth();
  }

  private async checkHealth(): Promise<void> {
    try {
      const baseUrl = api.getBaseUrl();
      const response = await fetch(`${baseUrl}/health`);
      const data: HealthResponse = await response.json();

      this.status = data.status;
      
      if (data.status === 'healthy') {
        this.statusMessage = 'Połączono z Bielikiem';
      } else if (data.status === 'degraded') {
        this.statusMessage = data.services?.model === 'not_loaded' 
          ? 'Ładowanie modelu...' 
          : 'Częściowo dostępny';
      } else {
        this.statusMessage = 'Błąd połączenia';
      }
    } catch (e) {
      this.status = 'unhealthy';
      this.statusMessage = 'Brak połączenia';
    }

    this.updateStatus();
    
    // Check again in 30s
    setTimeout(() => this.checkHealth(), 30000);
  }

  private updateStatus(): void {
    const statusEl = this.$('#app-status');
    const statusText = this.$('.status-text');
    
    if (statusEl) {
      statusEl.className = `status ${this.status}`;
    }
    if (statusText) {
      statusText.textContent = this.statusMessage;
    }
  }
}
