/**
 * Help Scout Docs API Client
 *
 * Docs API v1: https://developer.helpscout.com/docs-api/
 * Authentication: HTTP Basic Auth with API key as username
 * Base URL: https://docsapi.helpscout.net/v1
 */

const BASE_URL = 'https://docsapi.helpscout.net/v1';

export class DocsClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.apiKey}:X`).toString('base64');
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      Accept: 'application/json',
    };

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PUT')) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Help Scout Docs API error ${response.status}: ${errorText}`);
    }

    // DELETE and some PUT return no body
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  // ── Sites ──────────────────────────────────────────────────────────

  async listSites(page = 1): Promise<unknown> {
    return this.request('GET', '/sites', undefined, { page: String(page) });
  }

  async getSite(siteId: string): Promise<unknown> {
    return this.request('GET', `/sites/${siteId}`);
  }

  async createSite(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/sites?reload=true', data);
  }

  async updateSite(siteId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/sites/${siteId}?reload=true`, data);
  }

  async deleteSite(siteId: string): Promise<unknown> {
    return this.request('DELETE', `/sites/${siteId}`);
  }

  // ── Collections ────────────────────────────────────────────────────

  async listCollections(params?: {
    page?: number;
    siteId?: string;
    visibility?: string;
    sort?: string;
    order?: string;
  }): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.siteId) query.siteId = params.siteId;
    if (params?.visibility) query.visibility = params.visibility;
    if (params?.sort) query.sort = params.sort;
    if (params?.order) query.order = params.order;
    return this.request('GET', '/collections', undefined, query);
  }

  async getCollection(collectionId: string): Promise<unknown> {
    return this.request('GET', `/collections/${collectionId}`);
  }

  async createCollection(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/collections?reload=true', data);
  }

  async updateCollection(collectionId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/collections/${collectionId}?reload=true`, data);
  }

  async deleteCollection(collectionId: string): Promise<unknown> {
    return this.request('DELETE', `/collections/${collectionId}`);
  }

  // ── Categories ─────────────────────────────────────────────────────

  async listCategories(
    collectionId: string,
    params?: { page?: number; sort?: string; order?: string },
  ): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.sort) query.sort = params.sort;
    if (params?.order) query.order = params.order;
    return this.request('GET', `/collections/${collectionId}/categories`, undefined, query);
  }

  async getCategory(categoryId: string): Promise<unknown> {
    return this.request('GET', `/categories/${categoryId}`);
  }

  async createCategory(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/categories?reload=true', data);
  }

  async updateCategory(categoryId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/categories/${categoryId}?reload=true`, data);
  }

  async updateCategoryOrder(
    collectionId: string,
    categories: Array<{ id: string; order: number }>,
  ): Promise<unknown> {
    return this.request('PUT', `/collections/${collectionId}/categories`, {
      categories,
    });
  }

  async deleteCategory(categoryId: string): Promise<unknown> {
    return this.request('DELETE', `/categories/${categoryId}`);
  }

  // ── Articles ───────────────────────────────────────────────────────

  async listArticles(
    parentId: string,
    parentType: 'collection' | 'category',
    params?: {
      page?: number;
      status?: string;
      sort?: string;
      order?: string;
      pageSize?: number;
    },
  ): Promise<unknown> {
    const basePath =
      parentType === 'collection'
        ? `/collections/${parentId}/articles`
        : `/categories/${parentId}/articles`;

    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.status) query.status = params.status;
    if (params?.sort) query.sort = params.sort;
    if (params?.order) query.order = params.order;
    if (params?.pageSize) query.pageSize = String(params.pageSize);
    return this.request('GET', basePath, undefined, query);
  }

  async searchArticles(params: {
    query: string;
    collectionId?: string;
    siteId?: string;
    status?: string;
    visibility?: string;
    page?: number;
  }): Promise<unknown> {
    const queryParams: Record<string, string> = { query: params.query };
    if (params.collectionId) queryParams.collectionId = params.collectionId;
    if (params.siteId) queryParams.siteId = params.siteId;
    if (params.status) queryParams.status = params.status;
    if (params.visibility) queryParams.visibility = params.visibility;
    if (params.page) queryParams.page = String(params.page);
    return this.request('GET', '/search/articles', undefined, queryParams);
  }

  async getArticle(articleIdOrNumber: string, draft = false): Promise<unknown> {
    const query: Record<string, string> = {};
    if (draft) query.draft = 'true';
    return this.request('GET', `/articles/${articleIdOrNumber}`, undefined, query);
  }

  async createArticle(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/articles?reload=true', data);
  }

  async updateArticle(articleId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/articles/${articleId}?reload=true`, data);
  }

  async deleteArticle(articleId: string): Promise<unknown> {
    return this.request('DELETE', `/articles/${articleId}`);
  }

  async listRelatedArticles(articleId: string, params?: { page?: number }): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    return this.request('GET', `/articles/${articleId}/related`, undefined, query);
  }

  async listRevisions(articleId: string, params?: { page?: number }): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    return this.request('GET', `/articles/${articleId}/revisions`, undefined, query);
  }

  async getRevision(revisionId: string): Promise<unknown> {
    return this.request('GET', `/revisions/${revisionId}`);
  }

  async saveArticleDraft(articleId: string, text: string): Promise<unknown> {
    return this.request('PUT', `/articles/${articleId}/drafts`, { text });
  }

  async deleteArticleDraft(articleId: string): Promise<unknown> {
    return this.request('DELETE', `/articles/${articleId}/drafts`);
  }

  async updateViewCount(articleId: string, count: number): Promise<unknown> {
    return this.request('PUT', `/articles/${articleId}/views`, { count });
  }

  // ── Redirects ──────────────────────────────────────────────────────

  async listRedirects(siteId: string, params?: { page?: number }): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    return this.request('GET', `/redirects/site/${siteId}`, undefined, query);
  }

  async getRedirect(redirectId: string): Promise<unknown> {
    return this.request('GET', `/redirects/${redirectId}`);
  }

  async findRedirect(siteId: string, url: string): Promise<unknown> {
    return this.request('GET', `/redirects/site/${siteId}`, undefined, { url });
  }

  async createRedirect(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/redirects?reload=true', data);
  }

  async updateRedirect(redirectId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/redirects/${redirectId}?reload=true`, data);
  }

  async deleteRedirect(redirectId: string): Promise<unknown> {
    return this.request('DELETE', `/redirects/${redirectId}`);
  }
}
