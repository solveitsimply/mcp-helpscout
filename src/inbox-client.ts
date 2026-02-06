/**
 * Help Scout Inbox (Mailbox) API Client
 *
 * Inbox API v2: https://developer.helpscout.com/mailbox-api/
 * Authentication: OAuth 2.0 Client Credentials
 * Base URL: https://api.helpscout.net/v2
 */

const BASE_URL = 'https://api.helpscout.net/v2';
const TOKEN_URL = 'https://api.helpscout.net/v2/oauth2/token';

export class InboxClient {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.appId,
        client_secret: this.appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Help Scout OAuth error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    // Refresh 60s before expiry
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${BASE_URL}${path}`);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Help Scout Inbox API error ${response.status}: ${errorText}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  // ── Conversations ─────────────────────────────────────────────────

  async listConversations(params?: {
    mailbox?: number;
    status?: string;
    tag?: string;
    assigned_to?: number;
    modifiedSince?: string;
    sortField?: string;
    sortOrder?: string;
    page?: number;
    query?: string;
  }): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (params?.mailbox) queryParams.mailbox = String(params.mailbox);
    if (params?.status) queryParams.status = params.status;
    if (params?.tag) queryParams.tag = params.tag;
    if (params?.assigned_to) queryParams.assigned_to = String(params.assigned_to);
    if (params?.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    if (params?.sortField) queryParams.sortField = params.sortField;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.query) queryParams.query = params.query;
    return this.request('GET', '/conversations', undefined, queryParams);
  }

  async getConversation(
    conversationId: number,
    embed?: string,
  ): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (embed) queryParams.embed = embed;
    return this.request('GET', `/conversations/${conversationId}`, undefined, queryParams);
  }

  async createConversation(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/conversations', data);
  }

  async updateConversation(
    conversationId: number,
    op: string,
    path: string,
    value: unknown,
  ): Promise<unknown> {
    return this.request('PATCH', `/conversations/${conversationId}`, {
      op,
      path,
      value,
    });
  }

  async deleteConversation(conversationId: number): Promise<unknown> {
    return this.request('DELETE', `/conversations/${conversationId}`);
  }

  // ── Threads ───────────────────────────────────────────────────────

  async listThreads(conversationId: number): Promise<unknown> {
    return this.request('GET', `/conversations/${conversationId}/threads`);
  }

  async createReplyThread(
    conversationId: number,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request('POST', `/conversations/${conversationId}/reply`, data);
  }

  async createNoteThread(
    conversationId: number,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request('POST', `/conversations/${conversationId}/notes`, data);
  }

  async createPhoneThread(
    conversationId: number,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request('POST', `/conversations/${conversationId}/phones`, data);
  }

  // ── Customers ─────────────────────────────────────────────────────

  async listCustomers(params?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    modifiedSince?: string;
    sortField?: string;
    sortOrder?: string;
    page?: number;
    query?: string;
  }): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (params?.firstName) queryParams.firstName = params.firstName;
    if (params?.lastName) queryParams.lastName = params.lastName;
    if (params?.email) queryParams.email = params.email;
    if (params?.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    if (params?.sortField) queryParams.sortField = params.sortField;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.query) queryParams.query = params.query;
    return this.request('GET', '/customers', undefined, queryParams);
  }

  async getCustomer(customerId: number): Promise<unknown> {
    return this.request('GET', `/customers/${customerId}`);
  }

  async createCustomer(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/customers', data);
  }

  async updateCustomer(
    customerId: number,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request('PUT', `/customers/${customerId}`, data);
  }

  // ── Mailboxes ─────────────────────────────────────────────────────

  async listMailboxes(page?: number): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (page) queryParams.page = String(page);
    return this.request('GET', '/mailboxes', undefined, queryParams);
  }

  async getMailbox(mailboxId: number): Promise<unknown> {
    return this.request('GET', `/mailboxes/${mailboxId}`);
  }

  // ── Users ─────────────────────────────────────────────────────────

  async listUsers(page?: number): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (page) queryParams.page = String(page);
    return this.request('GET', '/users', undefined, queryParams);
  }

  async getUser(userId: number): Promise<unknown> {
    return this.request('GET', `/users/${userId}`);
  }

  async getResourceOwner(): Promise<unknown> {
    return this.request('GET', '/users/me');
  }

  // ── Tags ──────────────────────────────────────────────────────────

  async listTags(page?: number): Promise<unknown> {
    const queryParams: Record<string, string> = {};
    if (page) queryParams.page = String(page);
    return this.request('GET', '/tags', undefined, queryParams);
  }
}
