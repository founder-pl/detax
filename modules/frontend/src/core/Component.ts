/**
 * Base Component Class - Bazowa klasa dla komponentów UI
 */
export interface ComponentConfig {
  container: string | HTMLElement;
  template?: string;
}

export abstract class Component<T extends ComponentConfig = ComponentConfig> {
  protected container: HTMLElement | null;
  protected config: T;
  protected mounted = false;

  constructor(config: T) {
    this.config = config;
    this.container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;
  }

  abstract render(): string;

  mount(): void {
    if (!this.container) {
      console.warn(`Container not found for component`);
      return;
    }
    
    this.container.innerHTML = this.render();
    this.mounted = true;
    this.afterMount();
    this.bindEvents();
  }

  protected afterMount(): void {}
  protected bindEvents(): void {}

  protected $(selector: string): HTMLElement | null {
    return this.container?.querySelector(selector) || null;
  }

  protected $$(selector: string): NodeListOf<HTMLElement> {
    return this.container?.querySelectorAll(selector) || document.querySelectorAll('__none__');
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.mounted = false;
  }
}

/**
 * Event Bus - Komunikacja między komponentami
 */
type EventCallback = (...args: any[]) => void;

class EventBusClass {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }
}

export const EventBus = new EventBusClass();

/**
 * API Client - Singleton dla komunikacji z backendem
 */
export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  getBaseUrl(): string {
    return this.baseUrl.replace('/api/v1', '');
  }
}

export const api = ApiClient.getInstance();
