# MCP Help Scout

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for the full Help Scout API — covering both the **Docs API** and the **Inbox API**.

Most existing Help Scout MCPs only cover conversations/messages. This one provides complete coverage of Help Scout's knowledge base (Docs) in addition to inbox functionality.

## Features

### Docs API (v1)
Full CRUD operations for Help Scout's knowledge base:
- **Sites** — List, get, create, update, delete
- **Collections** — List, get, create, update, delete
- **Categories** — List, get, create, update, reorder, delete
- **Articles** — List, search, get, create, update, delete, drafts, revisions
- **Redirects** — List, get, create, update, delete

### Inbox API (v2)
Core inbox operations:
- **Conversations** — List, get, create, delete
- **Threads** — List, reply, add notes
- **Customers** — List, get, create
- **Mailboxes** — List, get
- **Users** — List, get, get current user
- **Tags** — List

## Setup

### Prerequisites

- Node.js 18+
- Help Scout API credentials (see below)

### Installation

```bash
npm install -g @solveitsimply/mcp-helpscout
```

Or clone and build locally:

```bash
git clone https://github.com/solveitsimply/mcp-helpscout.git
cd mcp-helpscout
npm install
npm run build
```

### Environment Variables

| Variable | Required For | Description |
|---|---|---|
| `HELPSCOUT_API_KEY` | Docs API | API key from Help Scout → Profile → Authentication → API Keys |
| `HELPSCOUT_APP_ID` | Inbox API | OAuth app ID from Help Scout → Manage → Apps → My Apps |
| `HELPSCOUT_APP_SECRET` | Inbox API | OAuth app secret |

You can use just the Docs API key, just the Inbox OAuth credentials, or both.

### VS Code MCP Configuration

Add to `.vscode/mcp.json`:

```jsonc
{
  "servers": {
    "mcp-helpscout": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-helpscout/dist/index.js"],
      "env": {
        "HELPSCOUT_API_KEY": "your-docs-api-key",
        "HELPSCOUT_APP_ID": "your-app-id",
        "HELPSCOUT_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

Or using shell to read from `.env.local`:

```jsonc
{
  "servers": {
    "mcp-helpscout": {
      "type": "stdio",
      "command": "sh",
      "args": [
        "-c",
        "export $(grep -E '^HELPSCOUT_' /path/to/.env.local | xargs) && exec node /path/to/mcp-helpscout/dist/index.js"
      ]
    }
  }
}
```

## Available Tools

### Docs API Tools

| Tool | Description |
|---|---|
| `docs_list_sites` | List all Docs sites |
| `docs_get_site` | Get a site by ID |
| `docs_create_site` | Create a new site |
| `docs_update_site` | Update a site |
| `docs_delete_site` | Delete a site |
| `docs_list_collections` | List collections (filter by site, visibility) |
| `docs_get_collection` | Get a collection by ID |
| `docs_create_collection` | Create a collection |
| `docs_update_collection` | Update a collection |
| `docs_delete_collection` | Delete a collection |
| `docs_list_categories` | List categories in a collection |
| `docs_get_category` | Get a category by ID |
| `docs_create_category` | Create a category |
| `docs_update_category` | Update a category |
| `docs_update_category_order` | Reorder categories |
| `docs_delete_category` | Delete a category |
| `docs_list_articles` | List articles in a collection or category |
| `docs_search_articles` | Search articles by query |
| `docs_get_article` | Get full article with content |
| `docs_create_article` | Create an article |
| `docs_update_article` | Update an article |
| `docs_delete_article` | Delete an article |
| `docs_list_related_articles` | List related articles |
| `docs_list_revisions` | List article revisions |
| `docs_get_revision` | Get a specific revision |
| `docs_save_draft` | Save an article draft |
| `docs_delete_draft` | Delete an article draft |
| `docs_list_redirects` | List URL redirects for a site |
| `docs_get_redirect` | Get a redirect by ID |
| `docs_create_redirect` | Create a redirect |
| `docs_update_redirect` | Update a redirect |
| `docs_delete_redirect` | Delete a redirect |

### Inbox API Tools

| Tool | Description |
|---|---|
| `inbox_list_conversations` | List conversations (filter by mailbox, status, tag) |
| `inbox_get_conversation` | Get conversation details |
| `inbox_create_conversation` | Create a new conversation |
| `inbox_delete_conversation` | Delete a conversation |
| `inbox_list_threads` | List threads in a conversation |
| `inbox_create_reply` | Send a reply in a conversation |
| `inbox_create_note` | Add an internal note |
| `inbox_list_customers` | List/search customers |
| `inbox_get_customer` | Get customer details |
| `inbox_create_customer` | Create a customer |
| `inbox_list_mailboxes` | List mailboxes |
| `inbox_get_mailbox` | Get mailbox details |
| `inbox_list_users` | List team members |
| `inbox_get_user` | Get user details |
| `inbox_get_me` | Get authenticated user |
| `inbox_list_tags` | List all tags |

## Authentication Details

### Docs API
Uses HTTP Basic Authentication with the API key as the username and `X` as the password. The API key is associated with a Help Scout user account.

**Base URL:** `https://docsapi.helpscout.net/v1`

### Inbox API
Uses OAuth 2.0 client credentials flow. The server automatically handles token acquisition and renewal.

**Base URL:** `https://api.helpscout.net/v2`

## License

MIT
