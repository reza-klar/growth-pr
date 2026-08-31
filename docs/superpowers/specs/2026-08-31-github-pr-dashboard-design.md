# GitHub PR Dashboard — Design Specification

**Date:** 2026-08-31  
**Target:** Client-Side Single Page Application for GitHub Pages  
**Tech Stack:** React 19 / Vite / TypeScript / Tailwind CSS / Lucide React / Radix UI  

---

## 1. Overview & Objectives

A client-side web application hosted on GitHub Pages that allows team members to monitor, query, and track Pull Requests across multiple company/organization repositories.

The dashboard connects directly to the GitHub GraphQL API using a locally stored Personal Access Token (PAT), fetching rich metadata in a single network request per refresh without any backend server.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
|                  Browser (GitHub Pages SPA)                |
|                                                             |
|   +-------------------+       +-------------------------+   |
|   |  Local Storage /  | ----> |  GitHub GraphQL Client  |   |
|   |  Session Storage  |       |  (Bearer PAT Auth)      |   |
|   +-------------------+       +------------+------------+   |
|                                            |                |
+--------------------------------------------|----------------+
                                             |
                                             v
                           +----------------------------------+
                           |  GitHub API (api.github.com)     |
                           |  - GraphQL v4 Query Batching     |
                           |  - Rate Limit Checking           |
                           |  - SAML SSO / Org Private Access |
                           +----------------------------------+
```

### 2.1 Authentication & Security
- **Token Input**: PAT entered in a settings modal and stored in `localStorage` or `sessionStorage` (configurable).
- **Security Boundaries**: No token, repo name, or PR metadata is ever transmitted to third-party servers. All communication is strictly between the browser and `api.github.com`.
- **SAML SSO / Org Guidance**: Clear setup guide for generating tokens with `repo` / `read:org` / `pull_requests:read` scopes and authorizing with organization SSO.
- **Rate Limit Tracking**: Real-time header metrics monitoring `rateLimit { limit, remaining, resetAt }`.

---

## 3. Core Features & User Experience

### 3.1 Repository Management
- **Manual Input / Chip Input**: Users can add, edit, and remove repositories in the `owner/repo` format (e.g., `company-org/frontend`, `company-org/backend-service`).
- **Workspace Presets**: Ability to save and switch between repo presets (e.g., "Frontend Core", "Backend Microservices", "Full Stack").
- **Persistence**: Configuration is automatically saved in local browser state.

### 3.2 Data Columns in PR Table
1. **Repository**: Color-coded repository badge.
2. **PR Details**:
   - Title with direct link to GitHub PR.
   - Number (`#1234`).
   - Source branch & Target branch (`feature/xyz` ➔ `main`).
   - Draft PR badge (if draft).
3. **Author & Creation**:
   - Author avatar and handle.
   - Creation date / relative time (e.g., "3 hours ago", "Aug 28, 2026").
4. **Review & CI Status**:
   - **Review Decision**: `APPROVED` (Green), `CHANGES_REQUESTED` (Red), `REVIEW_REQUIRED` (Yellow), `DRAFT` (Slate).
   - **CI Status**: Commit status / Check suite rollups (Passing / Failing / Pending).
5. **Discussions & Interactions**:
   - Total comments counter (Review comments + General issue comments).
   - **Participants**: Avatars and usernames of all users who commented, reviewed, or submitted commits.
   - **Last Interacted Person**: Avatar + username of the most recent commenter/reviewer and timestamp (e.g., "💬 @jane 12m ago").
6. **SLA & Staleness Indicator**:
   - Green / Neutral: Active or `< 24 hours` old.
   - Yellow (Warning): No activity for `24h - 48h` while open/awaiting review.
   - Red (Stale): No activity for `> 48 hours` or awaiting author fixes.

### 3.3 Filters, Search & Sorting
- **Quick Filters**:
  - `All Open`
  - `Waiting on Me` (User is requested reviewer)
  - `Authored by Me`
  - `Needs Review` (No approved reviews)
  - `Ready to Merge` (Approved + CI Passing)
- **Sorting Options**:
  - Creation Date (Newest to Oldest / Oldest to Newest)
  - Last Updated / Last Interacted
  - Most Comments
  - SLA Staleness
- **Search Bar**: Real-time fuzzy filtering across title, author, branch, labels, and repo.

### 3.4 Standup Export & Digest
- **Copy Markdown Digest**: Generates a formatted markdown summary grouped by status/repo.
- **Copy Slack Digest**: Generates a Slack-friendly bulleted text list for quick team updates.

---

## 4. Technical Implementation & Components

- **`src/services/github.ts`**: Handles GraphQL queries, rate-limit parsing, error normalization, and user profile verification.
- **`src/components/PRTable.tsx`**: High-performance responsive data table with sorting, expandable rows, and interaction badges.
- **`src/components/PRRow.tsx`**: Individual PR row with avatars, hover cards, status indicators, and last-activity snippet.
- **`src/components/FilterBar.tsx`**: Filter presets, search input, repository selector, and sort dropdown.
- **`src/components/SettingsModal.tsx`**: PAT configuration, token validation test, and storage preference.
- **`src/components/ExportModal.tsx`**: Markdown and Slack digest generator.
- **`src/components/Header.tsx`**: App branding, rate limit badge, auto-refresh countdown, and theme toggle.

---

## 5. Deployment Setup

- **GitHub Pages Workflow (`.github/workflows/deploy.yml`)**:
  - Triggers on push to `main`.
  - Runs `npm run build` with base path configuration (`base: './'`).
  - Uses `actions/deploy-pages@v4` to host on GitHub Pages for free.
