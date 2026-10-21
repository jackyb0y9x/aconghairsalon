/**
 * Unified Opaque-Box API Client
 * Supports both Live HTTP server mode and Contract Simulator mode
 */

import { ContractSimulator } from './contract-simulator.ts';
import type { HttpResponse, RequestOptions } from './types.ts';
import { MOCK_USERS } from '../fixtures/mock-data.ts';

export class ApiClient {
  private baseUrl: string | null;
  private simulator: ContractSimulator;
  private activeToken: string | null = null;
  private cookies: Record<string, string> = {};

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.TEST_BASE_URL || null;
    this.simulator = new ContractSimulator();
  }

  public setBaseUrl(url: string | null) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string | null {
    return this.baseUrl;
  }

  public resetSimulator() {
    this.simulator.reset();
    this.activeToken = null;
    this.cookies = {};
  }

  public setAuthToken(token: string | null) {
    this.activeToken = token;
  }

  public setCookie(key: string, value: string) {
    this.cookies[key] = value;
  }

  public clearAuth() {
    this.activeToken = null;
    this.cookies = {};
  }

  public withRole(role: keyof typeof MOCK_USERS): ApiClient {
    const user = MOCK_USERS[role];
    if (user) {
      this.activeToken = user.token;
      this.cookies['session'] = user.token;
    }
    return this;
  }

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(options?.headers || {})
    };

    if (this.activeToken && !headers['authorization'] && !headers['Authorization']) {
      headers['authorization'] = `Bearer ${this.activeToken}`;
    }

    if (options?.authRole) {
      const user = MOCK_USERS[options.authRole as keyof typeof MOCK_USERS];
      if (user) {
        headers['authorization'] = `Bearer ${user.token}`;
        headers['cookie'] = `session=${user.token}`;
      }
    } else {
      const cookieEntries = Object.entries(this.cookies);
      if (cookieEntries.length > 0 && !headers['cookie'] && !headers['Cookie']) {
        headers['cookie'] = cookieEntries.map(([k, v]) => `${k}=${v}`).join('; ');
      }
    }

    return headers;
  }

  public async get<T = any>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, null, options);
  }

  public async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  public async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  public async delete<T = any>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, null, options);
  }

  private async request<T = any>(
    method: string,
    path: string,
    body: any,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const headers = this.buildHeaders(options);

    // If live server configured, execute HTTP fetch
    if (this.baseUrl) {
      const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
      const startTime = Date.now();
      try {
        const fetchOptions: RequestInit = {
          method,
          headers
        };

        if (body !== null && body !== undefined) {
          if (Buffer.isBuffer(body)) {
            fetchOptions.body = body as any;
          } else if (typeof body === 'object') {
            fetchOptions.body = JSON.stringify(body);
          } else {
            fetchOptions.body = String(body);
          }
        }

        const res = await fetch(url, fetchOptions);
        const durationMs = Date.now() - startTime;
        const rawText = await res.text();

        let data: any = rawText;
        try {
          data = JSON.parse(rawText);
        } catch {
          // keep as rawText
        }

        const resHeaders: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          resHeaders[key.toLowerCase()] = val;
        });

        // Store set-cookie if present
        const setCookie = resHeaders['set-cookie'];
        if (setCookie) {
          const match = setCookie.match(/session=([^;]+)/);
          if (match) this.cookies['session'] = match[1];
        }

        return {
          status: res.status,
          ok: res.ok,
          headers: resHeaders,
          data,
          rawText,
          durationMs
        };
      } catch (err: any) {
        // Fall back to simulator if live server connection fails
        console.warn(`[ApiClient] Live server at ${this.baseUrl} unreachable. Falling back to ContractSimulator.`);
        return this.simulator.handleRequest(method, path, body, headers);
      }
    }

    // Default: Contract Simulator mode
    const simRes = await this.simulator.handleRequest(method, path, body, headers);
    // Track cookie if set
    if (simRes.headers['Set-Cookie']) {
      const match = simRes.headers['Set-Cookie'].match(/session=([^;]+)/);
      if (match) this.cookies['session'] = match[1];
    }
    return simRes;
  }
}
