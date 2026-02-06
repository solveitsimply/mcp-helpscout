#!/usr/bin/env node

/**
 * MCP Server for Help Scout (Docs API + Inbox API)
 *
 * Provides comprehensive access to:
 * - Docs API v1: Sites, Collections, Categories, Articles, Redirects
 * - Inbox API v2: Conversations, Threads, Customers, Mailboxes, Users, Tags
 *
 * Environment variables:
 *   HELPSCOUT_API_KEY     - Docs API key (Basic Auth)
 *   HELPSCOUT_APP_ID      - Inbox API OAuth app ID
 *   HELPSCOUT_APP_SECRET  - Inbox API OAuth app secret
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DocsClient } from './docs-client.js';
import { InboxClient } from './inbox-client.js';

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function textResult(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text' as const, text: fmt(data) }] };
}

function errResult(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

// ── Server Setup ─────────────────────────────────────────────────────

const server = new McpServer({
  name: 'mcp-helpscout',
  version: '1.0.0',
});

const apiKey = process.env.HELPSCOUT_API_KEY;
const appId = process.env.HELPSCOUT_APP_ID;
const appSecret = process.env.HELPSCOUT_APP_SECRET;

const docs = apiKey ? new DocsClient(apiKey) : null;
const inbox = appId && appSecret ? new InboxClient(appId, appSecret) : null;

// ═══════════════════════════════════════════════════════════════════════
// DOCS API TOOLS
// ═══════════════════════════════════════════════════════════════════════

// ── Sites ────────────────────────────────────────────────────────────

server.tool(
  'docs_list_sites',
  'List all Docs sites in Help Scout',
  { page: z.number().optional().describe('Page number (default: 1)') },
  async ({ page }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listSites(page));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_site',
  'Get a specific Docs site by ID',
  { siteId: z.string().describe('The site ID') },
  async ({ siteId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getSite(siteId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_create_site',
  'Create a new Docs site',
  {
    subDomain: z.string().describe('Subdomain for the site'),
    title: z.string().describe('Site title'),
    companyName: z.string().optional().describe('Company name'),
    homeUrl: z.string().optional().describe('Home URL'),
    homeLinkText: z.string().optional().describe('Home link text'),
    bgColor: z.string().optional().describe('Background color hex'),
    description: z.string().optional().describe('Site description'),
    hasContactForm: z.boolean().optional().describe('Enable contact form'),
    mailboxId: z.number().optional().describe('Mailbox ID for contact form'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.createSite(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_site',
  'Update a Docs site',
  {
    siteId: z.string().describe('The site ID to update'),
    title: z.string().optional().describe('Site title'),
    companyName: z.string().optional().describe('Company name'),
    homeUrl: z.string().optional().describe('Home URL'),
    homeLinkText: z.string().optional().describe('Home link text'),
    bgColor: z.string().optional().describe('Background color hex'),
    description: z.string().optional().describe('Site description'),
    hasContactForm: z.boolean().optional().describe('Enable contact form'),
  },
  async ({ siteId, ...data }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateSite(siteId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_site',
  'Delete a Docs site. WARNING: This permanently deletes the site and all its collections.',
  { siteId: z.string().describe('The site ID to delete') },
  async ({ siteId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteSite(siteId);
      return textResult({ success: true, message: `Site ${siteId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

// ── Collections ──────────────────────────────────────────────────────

server.tool(
  'docs_list_collections',
  'List all Docs collections. Optionally filter by site, visibility, or sort.',
  {
    page: z.number().optional().describe('Page number (default: 1)'),
    siteId: z.string().optional().describe('Filter by site ID'),
    visibility: z.enum(['all', 'public', 'private']).optional().describe('Filter by visibility'),
    sort: z.enum(['number', 'visibility', 'order', 'name', 'createdAt', 'updatedAt']).optional().describe('Sort field'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listCollections(params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_collection',
  'Get a specific Docs collection by ID',
  { collectionId: z.string().describe('The collection ID') },
  async ({ collectionId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getCollection(collectionId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_create_collection',
  'Create a new Docs collection',
  {
    siteId: z.string().describe('Site ID to create the collection in'),
    name: z.string().describe('Collection name (must be unique)'),
    visibility: z.enum(['public', 'private']).optional().describe('Visibility (default: public)'),
    order: z.number().optional().describe('Display order'),
    description: z.string().optional().describe('Description (up to 45 chars)'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.createCollection(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_collection',
  'Update a Docs collection',
  {
    collectionId: z.string().describe('The collection ID to update'),
    name: z.string().optional().describe('New name (must be unique)'),
    visibility: z.enum(['public', 'private']).optional().describe('Visibility'),
    order: z.number().optional().describe('Display order'),
    description: z.string().optional().describe('Description (up to 45 chars)'),
    siteId: z.string().optional().describe('Move to a different site'),
  },
  async ({ collectionId, ...data }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateCollection(collectionId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_collection',
  'Delete a Docs collection. WARNING: This permanently deletes the collection and all its articles.',
  { collectionId: z.string().describe('The collection ID to delete') },
  async ({ collectionId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteCollection(collectionId);
      return textResult({ success: true, message: `Collection ${collectionId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

// ── Categories ───────────────────────────────────────────────────────

server.tool(
  'docs_list_categories',
  'List categories in a Docs collection',
  {
    collectionId: z.string().describe('The collection ID'),
    page: z.number().optional().describe('Page number (default: 1)'),
    sort: z.enum(['number', 'order', 'name', 'articleCount', 'createdAt', 'updatedAt']).optional().describe('Sort field'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  },
  async ({ collectionId, ...params }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listCategories(collectionId, params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_category',
  'Get a specific Docs category by ID',
  { categoryId: z.string().describe('The category ID') },
  async ({ categoryId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getCategory(categoryId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_create_category',
  'Create a new category in a Docs collection',
  {
    collectionId: z.string().describe('Collection ID to create category in'),
    name: z.string().describe('Category name (unique per collection)'),
    slug: z.string().optional().describe('SEO-friendly URL slug'),
    visibility: z.enum(['public', 'private']).optional().describe('Visibility (default: public)'),
    order: z.number().optional().describe('Display order'),
    defaultSort: z.enum(['popularity', 'name']).optional().describe('Default article sort'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.createCategory(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_category',
  'Update a Docs category',
  {
    categoryId: z.string().describe('The category ID to update'),
    name: z.string().optional().describe('New name (unique per collection)'),
    slug: z.string().optional().describe('SEO-friendly URL slug'),
    visibility: z.enum(['public', 'private']).optional().describe('Visibility'),
    order: z.number().optional().describe('Display order'),
    defaultSort: z.enum(['popularity', 'name']).optional().describe('Default article sort'),
  },
  async ({ categoryId, ...data }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateCategory(categoryId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_category_order',
  'Reorder categories in a Docs collection',
  {
    collectionId: z.string().describe('The collection ID'),
    categories: z.array(
      z.object({ id: z.string(), order: z.number() }),
    ).describe('Array of {id, order} pairs'),
  },
  async ({ collectionId, categories }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateCategoryOrder(collectionId, categories));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_category',
  'Delete a Docs category. Articles in this category become uncategorized.',
  { categoryId: z.string().describe('The category ID to delete') },
  async ({ categoryId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteCategory(categoryId);
      return textResult({ success: true, message: `Category ${categoryId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

// ── Articles ─────────────────────────────────────────────────────────

server.tool(
  'docs_list_articles',
  'List articles in a Docs collection or category. Returns ArticleRef objects (not full article text).',
  {
    parentId: z.string().describe('Collection ID or Category ID'),
    parentType: z.enum(['collection', 'category']).describe('Whether parentId is a collection or category'),
    page: z.number().optional().describe('Page number (default: 1)'),
    status: z.enum(['all', 'published', 'notpublished']).optional().describe('Filter by status'),
    sort: z.enum(['number', 'status', 'name', 'popularity', 'createdAt', 'updatedAt', 'order']).optional().describe('Sort field'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    pageSize: z.number().optional().describe('Results per page (max 100, default 50)'),
  },
  async ({ parentId, parentType, ...params }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listArticles(parentId, parentType, params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_search_articles',
  'Search for Docs articles by query string. Returns ArticleSearch objects with preview text.',
  {
    query: z.string().describe('Search query'),
    collectionId: z.string().optional().describe('Filter by collection ID'),
    siteId: z.string().optional().describe('Filter by site ID'),
    status: z.enum(['all', 'published', 'notpublished']).optional().describe('Filter by status'),
    visibility: z.enum(['all', 'public', 'private']).optional().describe('Filter by collection visibility'),
    page: z.number().optional().describe('Page number (default: 1)'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.searchArticles(params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_article',
  'Get a full Docs article by ID or number, including its text content.',
  {
    articleIdOrNumber: z.string().describe('Article ID or article number'),
    draft: z.boolean().optional().describe('If true, return the draft version instead of published'),
  },
  async ({ articleIdOrNumber, draft }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getArticle(articleIdOrNumber, draft));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_create_article',
  'Create a new Docs article in a collection',
  {
    collectionId: z.string().describe('Collection ID to create the article in'),
    name: z.string().describe('Article name (unique per collection)'),
    text: z.string().describe('Article content (plain text or HTML)'),
    status: z.enum(['published', 'notpublished']).optional().describe('Article status (default: notpublished)'),
    slug: z.string().optional().describe('SEO-friendly URL slug'),
    categories: z.array(z.string()).optional().describe('Array of category IDs'),
    related: z.array(z.string()).optional().describe('Array of related article IDs'),
    keywords: z.array(z.string()).optional().describe('Array of keyword strings'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.createArticle(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_article',
  'Update an existing Docs article',
  {
    articleId: z.string().describe('The article ID to update'),
    name: z.string().optional().describe('New article name'),
    text: z.string().optional().describe('New article content (plain text or HTML)'),
    status: z.enum(['published', 'notpublished']).optional().describe('Article status'),
    slug: z.string().optional().describe('SEO-friendly URL slug'),
    categories: z.array(z.string()).optional().nullable().describe('Category IDs (null to uncategorize)'),
    related: z.array(z.string()).optional().nullable().describe('Related article IDs (null to clear)'),
    keywords: z.array(z.string()).optional().nullable().describe('Keywords (null to clear)'),
  },
  async ({ articleId, ...data }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateArticle(articleId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_article',
  'Delete a Docs article. WARNING: This permanently deletes the article.',
  { articleId: z.string().describe('The article ID to delete') },
  async ({ articleId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteArticle(articleId);
      return textResult({ success: true, message: `Article ${articleId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_list_related_articles',
  'List articles related to a specific Docs article',
  {
    articleId: z.string().describe('The article ID'),
    page: z.number().optional().describe('Page number (default: 1)'),
  },
  async ({ articleId, page }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listRelatedArticles(articleId, { page }));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_list_revisions',
  'List all revisions of a Docs article',
  {
    articleId: z.string().describe('The article ID'),
    page: z.number().optional().describe('Page number (default: 1)'),
  },
  async ({ articleId, page }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listRevisions(articleId, { page }));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_revision',
  'Get a specific article revision by revision ID',
  { revisionId: z.string().describe('The revision ID') },
  async ({ revisionId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getRevision(revisionId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_save_draft',
  'Save or update a draft version of a Docs article without affecting the published version',
  {
    articleId: z.string().describe('The article ID'),
    text: z.string().describe('Draft article text content'),
  },
  async ({ articleId, text }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.saveArticleDraft(articleId, text);
      return textResult({ success: true, message: `Draft saved for article ${articleId}` });
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_draft',
  'Delete the draft version of a Docs article',
  { articleId: z.string().describe('The article ID') },
  async ({ articleId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteArticleDraft(articleId);
      return textResult({ success: true, message: `Draft deleted for article ${articleId}` });
    } catch (e) { return errResult(e); }
  },
);

// ── Redirects ────────────────────────────────────────────────────────

server.tool(
  'docs_list_redirects',
  'List URL redirects for a Docs site',
  {
    siteId: z.string().describe('The site ID'),
    page: z.number().optional().describe('Page number (default: 1)'),
  },
  async ({ siteId, page }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.listRedirects(siteId, { page }));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_get_redirect',
  'Get a specific URL redirect by ID',
  { redirectId: z.string().describe('The redirect ID') },
  async ({ redirectId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.getRedirect(redirectId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_create_redirect',
  'Create a URL redirect for a Docs site',
  {
    siteId: z.string().describe('The site ID'),
    urlMapping: z.string().describe('The old URL path to redirect from'),
    redirect: z.string().describe('The target URL to redirect to'),
  },
  async (params) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.createRedirect(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_update_redirect',
  'Update a URL redirect',
  {
    redirectId: z.string().describe('The redirect ID to update'),
    urlMapping: z.string().optional().describe('The old URL path to redirect from'),
    redirect: z.string().optional().describe('The target URL to redirect to'),
  },
  async ({ redirectId, ...data }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      return textResult(await docs.updateRedirect(redirectId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'docs_delete_redirect',
  'Delete a URL redirect',
  { redirectId: z.string().describe('The redirect ID to delete') },
  async ({ redirectId }) => {
    if (!docs) return errResult('HELPSCOUT_API_KEY not configured');
    try {
      await docs.deleteRedirect(redirectId);
      return textResult({ success: true, message: `Redirect ${redirectId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

// ═══════════════════════════════════════════════════════════════════════
// INBOX API TOOLS
// ═══════════════════════════════════════════════════════════════════════

// ── Conversations ────────────────────────────────────────────────────

server.tool(
  'inbox_list_conversations',
  'List conversations from the Help Scout Inbox. Supports filtering by mailbox, status, tag, assignee.',
  {
    mailbox: z.number().optional().describe('Mailbox ID to filter by'),
    status: z.enum(['active', 'all', 'closed', 'open', 'pending', 'spam']).optional().describe('Conversation status filter'),
    tag: z.string().optional().describe('Tag name to filter by'),
    assigned_to: z.number().optional().describe('User ID of assignee'),
    modifiedSince: z.string().optional().describe('ISO 8601 date to filter by modification date'),
    sortField: z.enum(['createdAt', 'modifiedAt', 'number', 'status', 'subject']).optional().describe('Sort field'),
    sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    page: z.number().optional().describe('Page number'),
    query: z.string().optional().describe('Search query string'),
  },
  async (params) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listConversations(params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_get_conversation',
  'Get a specific conversation by ID with full details',
  {
    conversationId: z.number().describe('The conversation ID'),
    embed: z.enum(['threads']).optional().describe('Embed threads in the response'),
  },
  async ({ conversationId, embed }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.getConversation(conversationId, embed));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_create_conversation',
  'Create a new conversation in Help Scout Inbox',
  {
    subject: z.string().describe('Conversation subject'),
    customer: z.object({
      email: z.string().describe('Customer email'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }).describe('Customer details'),
    mailboxId: z.number().describe('Mailbox ID'),
    type: z.enum(['email', 'phone', 'chat']).optional().describe('Conversation type'),
    status: z.enum(['active', 'closed', 'open', 'pending', 'spam']).optional().describe('Status'),
    threads: z.array(z.object({
      type: z.enum(['customer', 'note', 'reply']),
      text: z.string(),
      customer: z.object({ email: z.string() }).optional(),
    })).optional().describe('Initial threads'),
    tags: z.array(z.string()).optional().describe('Tags to apply'),
  },
  async (params) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.createConversation(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_delete_conversation',
  'Delete a conversation. WARNING: This permanently deletes the conversation.',
  { conversationId: z.number().describe('The conversation ID to delete') },
  async ({ conversationId }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      await inbox.deleteConversation(conversationId);
      return textResult({ success: true, message: `Conversation ${conversationId} deleted` });
    } catch (e) { return errResult(e); }
  },
);

// ── Threads ──────────────────────────────────────────────────────────

server.tool(
  'inbox_list_threads',
  'List all threads in a conversation',
  { conversationId: z.number().describe('The conversation ID') },
  async ({ conversationId }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listThreads(conversationId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_create_reply',
  'Send a reply in a conversation',
  {
    conversationId: z.number().describe('The conversation ID'),
    text: z.string().describe('Reply text (HTML supported)'),
    customer: z.object({ email: z.string() }).optional().describe('Customer to send to'),
    draft: z.boolean().optional().describe('If true, saves as draft instead of sending'),
  },
  async ({ conversationId, ...data }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.createReplyThread(conversationId, data as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_create_note',
  'Add an internal note to a conversation',
  {
    conversationId: z.number().describe('The conversation ID'),
    text: z.string().describe('Note text (HTML supported)'),
  },
  async ({ conversationId, text }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.createNoteThread(conversationId, { text }));
    } catch (e) { return errResult(e); }
  },
);

// ── Customers ────────────────────────────────────────────────────────

server.tool(
  'inbox_list_customers',
  'List customers in Help Scout. Supports filtering and search.',
  {
    firstName: z.string().optional().describe('Filter by first name'),
    lastName: z.string().optional().describe('Filter by last name'),
    email: z.string().optional().describe('Filter by email'),
    modifiedSince: z.string().optional().describe('ISO 8601 date filter'),
    sortField: z.enum(['firstName', 'lastName', 'modifiedAt', 'score']).optional().describe('Sort field'),
    sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    page: z.number().optional().describe('Page number'),
    query: z.string().optional().describe('Search query'),
  },
  async (params) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listCustomers(params));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_get_customer',
  'Get a specific customer by ID',
  { customerId: z.number().describe('The customer ID') },
  async ({ customerId }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.getCustomer(customerId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_create_customer',
  'Create a new customer in Help Scout',
  {
    firstName: z.string().optional().describe('Customer first name'),
    lastName: z.string().optional().describe('Customer last name'),
    emails: z.array(z.object({
      type: z.enum(['home', 'work', 'other']).optional(),
      value: z.string(),
    })).optional().describe('Customer email addresses'),
    phones: z.array(z.object({
      type: z.enum(['home', 'work', 'mobile', 'fax', 'pager', 'other']).optional(),
      value: z.string(),
    })).optional().describe('Customer phone numbers'),
    company: z.string().optional().describe('Company name'),
    jobTitle: z.string().optional().describe('Job title'),
  },
  async (params) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.createCustomer(params as Record<string, unknown>));
    } catch (e) { return errResult(e); }
  },
);

// ── Mailboxes ────────────────────────────────────────────────────────

server.tool(
  'inbox_list_mailboxes',
  'List all mailboxes in Help Scout',
  { page: z.number().optional().describe('Page number') },
  async ({ page }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listMailboxes(page));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_get_mailbox',
  'Get a specific mailbox by ID',
  { mailboxId: z.number().describe('The mailbox ID') },
  async ({ mailboxId }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.getMailbox(mailboxId));
    } catch (e) { return errResult(e); }
  },
);

// ── Users ────────────────────────────────────────────────────────────

server.tool(
  'inbox_list_users',
  'List all users (team members) in Help Scout',
  { page: z.number().optional().describe('Page number') },
  async ({ page }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listUsers(page));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_get_user',
  'Get a specific user by ID',
  { userId: z.number().describe('The user ID') },
  async ({ userId }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.getUser(userId));
    } catch (e) { return errResult(e); }
  },
);

server.tool(
  'inbox_get_me',
  'Get the authenticated user (resource owner)',
  {},
  async () => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.getResourceOwner());
    } catch (e) { return errResult(e); }
  },
);

// ── Tags ─────────────────────────────────────────────────────────────

server.tool(
  'inbox_list_tags',
  'List all tags in Help Scout',
  { page: z.number().optional().describe('Page number') },
  async ({ page }) => {
    if (!inbox) return errResult('HELPSCOUT_APP_ID and HELPSCOUT_APP_SECRET not configured');
    try {
      return textResult(await inbox.listTags(page));
    } catch (e) { return errResult(e); }
  },
);

// ═══════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const capabilities: string[] = [];
  if (docs) capabilities.push('Docs API');
  if (inbox) capabilities.push('Inbox API');

  if (capabilities.length === 0) {
    console.error(
      'Warning: No Help Scout credentials configured. Set HELPSCOUT_API_KEY for Docs API ' +
      'and/or HELPSCOUT_APP_ID + HELPSCOUT_APP_SECRET for Inbox API.',
    );
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
