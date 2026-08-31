# GitHub PR Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance, client-side Single Page Application hosted on GitHub Pages that connects to GitHub's GraphQL API via user PAT to monitor, query, sort, and export Pull Requests across multiple organization repositories with rich interaction metrics.

**Architecture:** A static React + TypeScript SPA using Tailwind CSS for UI and Vitest for testing. The app communicates directly with GitHub's GraphQL API (`api.github.com/graphql`) to batch-fetch PR metadata, reviews, CI statuses, comments, and participants. Configuration (PAT, repos, presets) is persisted in browser storage.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Radix UI primitives, Vitest, React Testing Library.

## Global Constraints

- 100% client-side: No external backend; no tokens or user data transmitted outside of `api.github.com`.
- Compatible with GitHub Pages static hosting (`base: './'`).
- Strict TypeScript (`strict: true`).
- TDD methodology: Every service and component must have unit/integration tests with Vitest.

---

### Task 1: Project Scaffolding & Tooling Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: Runnable Vite React development and testing environment.

- [ ] **Step 1: Create package.json with dependencies**

```json
{
  "name": "github-pr-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/node": "^22.13.5",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^6.2.0",
    "vitest": "^3.0.7"
  }
}
```

- [ ] **Step 2: Create Vite, TypeScript, Tailwind, and PostCSS configurations**

`vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      }
    },
  },
  plugins: [],
}
```

`postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='18' cy='18' r='3'/><circle cx='6' cy='6' r='3'/><path d='M13 6h3a2 2 0 0 1 2 2v7'/><line x1='6' y1='9' x2='6' y2='21'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GitHub PR Dashboard</title>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #020617;
  --foreground: #f8fafc;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
```

`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Write the failing App smoke test**

`src/App.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Smoke Test', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText(/GitHub PR Dashboard/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Create minimal App.tsx and main.tsx**

`src/App.tsx`:
```typescript
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-bold text-blue-400">GitHub PR Dashboard</h1>
    </div>
  );
}
```

`src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Run npm install & run test**

Run: `npm install && npm test`  
Expected: PASS

- [ ] **Step 6: Commit scaffolding**

```bash
git add package.json vite.config.ts tsconfig*.json tailwind.config.js postcss.config.js index.html src/
git commit -m "chore: scaffold React Vite project with Tailwind and Vitest"
```

---

### Task 2: Core Data Types & Browser Storage Service

**Files:**
- Create: `src/types/index.ts`
- Create: `src/services/storage.ts`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Produces: Type definitions for `PullRequest`, `RepoConfig`, `PresetGroup`, `RateLimitInfo`, `FilterOptions`, and typed functions `getStoredSettings()`, `saveStoredSettings()`.

- [ ] **Step 1: Write failing storage service tests**

`src/services/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredSettings, saveStoredSettings, DEFAULT_SETTINGS } from './storage';
import { AppSettings } from '../types';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns default settings when storage is empty', () => {
    const settings = getStoredSettings();
    expect(settings.repositories).toEqual(DEFAULT_SETTINGS.repositories);
    expect(settings.token).toBe('');
    expect(settings.storageType).toBe('local');
  });

  it('saves and retrieves settings from localStorage', () => {
    const newSettings: AppSettings = {
      token: 'ghp_test123',
      storageType: 'local',
      repositories: ['owner/repo1', 'owner/repo2'],
      presets: [{ id: 'core', name: 'Core Team', repositories: ['owner/repo1'] }],
      activePresetId: 'core',
      autoRefreshIntervalSeconds: 300,
    };
    saveStoredSettings(newSettings);
    expect(getStoredSettings()).toEqual(newSettings);
  });

  it('saves to sessionStorage when storageType is session', () => {
    const newSettings: AppSettings = {
      token: 'ghp_session_token',
      storageType: 'session',
      repositories: ['org/repo-a'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    };
    saveStoredSettings(newSettings);
    expect(sessionStorage.getItem('gh_pr_dashboard_settings')).toBeTruthy();
    expect(localStorage.getItem('gh_pr_dashboard_settings')).toBeNull();
    expect(getStoredSettings()).toEqual(newSettings);
  });
});
```

- [ ] **Step 2: Create TypeScript interfaces**

`src/types/index.ts`:
```typescript
export type ReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | 'DRAFT';
export type CIStatus = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'NEUTRAL';
export type SLAStatus = 'normal' | 'warning' | 'stale';

export interface Author {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface Participant {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface LastInteraction {
  user: Participant;
  type: 'comment' | 'review' | 'commit';
  createdAt: string;
  snippet?: string;
}

export interface PullRequestItem {
  id: string;
  number: number;
  title: string;
  url: string;
  repository: {
    nameWithOwner: string;
    url: string;
  };
  author: Author;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  baseRefName: string;
  headRefName: string;
  totalCommentsCount: number;
  participants: Participant[];
  lastInteraction: LastInteraction;
  reviewDecision: ReviewDecision;
  ciStatus: CIStatus;
  slaStatus: SLAStatus;
  labels: { name: string; color: string }[];
  isWaitingOnMe?: boolean;
  isAuthoredByMe?: boolean;
}

export interface PresetGroup {
  id: string;
  name: string;
  repositories: string[];
}

export interface AppSettings {
  token: string;
  storageType: 'local' | 'session';
  repositories: string[];
  presets: PresetGroup[];
  activePresetId: string | null;
  autoRefreshIntervalSeconds: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
  used: number;
}

export type FilterPreset = 'all' | 'waiting_on_me' | 'authored_by_me' | 'needs_review' | 'ready_to_merge';
export type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'comments_desc' | 'stale_desc';
```

- [ ] **Step 3: Implement storage service**

`src/services/storage.ts`:
```typescript
import { AppSettings } from '../types';

const STORAGE_KEY = 'gh_pr_dashboard_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  token: '',
  storageType: 'local',
  repositories: [],
  presets: [],
  activePresetId: null,
  autoRefreshIntervalSeconds: 0,
};

export function getStoredSettings(): AppSettings {
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fromSession) };
    }
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fromLocal) };
    }
  } catch (err) {
    console.error('Failed to parse stored settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): void {
  const json = JSON.stringify(settings);
  if (settings.storageType === 'session') {
    sessionStorage.setItem(STORAGE_KEY, json);
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, json);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test src/services/storage.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/storage.ts src/services/storage.test.ts
git commit -m "feat: add domain types and browser storage service"
```

---

### Task 3: GraphQL Client & GitHub API Service

**Files:**
- Create: `src/services/github.ts`
- Test: `src/services/github.test.ts`

**Interfaces:**
- Produces: `verifyToken(token: string): Promise<{ login: string; name: string }>`, `fetchRepoPRs(token: string, repositories: string[], currentUserLogin?: string): Promise<{ prs: PullRequestItem[]; rateLimit: RateLimitInfo }>`

- [ ] **Step 1: Write failing tests for GitHub API service**

`src/services/github.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken, fetchRepoPRs, buildBatchedGraphQLQuery } from './github';

describe('github api service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('buildBatchedGraphQLQuery creates valid aliased query for multiple repos', () => {
    const query = buildBatchedGraphQLQuery(['ownerA/repo1', 'ownerB/repo2']);
    expect(query).toContain('repo_0: repository(owner: "ownerA", name: "repo1")');
    expect(query).toContain('repo_1: repository(owner: "ownerB", name: "repo2")');
    expect(query).toContain('rateLimit');
  });

  it('verifyToken returns user profile on valid response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: {
            login: 'octocat',
            name: 'Mona Lisa Octocat',
          },
        },
      }),
    });

    const user = await verifyToken('ghp_valid_token');
    expect(user.login).toBe('octocat');
    expect(user.name).toBe('Mona Lisa Octocat');
  });

  it('verifyToken throws descriptive error on invalid token', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Bad credentials' }),
    });

    await expect(verifyToken('invalid')).rejects.toThrow(/Bad credentials|Unauthorized/);
  });
});
```

- [ ] **Step 2: Implement GitHub API service & GraphQL querying**

`src/services/github.ts`:
```typescript
import { PullRequestItem, RateLimitInfo, ReviewDecision, CIStatus, SLAStatus, Participant, LastInteraction } from '../types';

export function buildBatchedGraphQLQuery(repositories: string[]): string {
  const repoQueries = repositories
    .map((repo, index) => {
      const [owner, name] = repo.trim().split('/');
      if (!owner || !name) return '';
      return `
      repo_${index}: repository(owner: "${owner}", name: "${name}") {
        nameWithOwner
        url
        pullRequests(first: 50, states: [OPEN], orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id
            number
            title
            url
            isDraft
            createdAt
            updatedAt
            baseRefName
            headRefName
            author {
              login
              avatarUrl
              url
            }
            reviewDecision
            reviewRequests(first: 20) {
              nodes {
                requestedReviewer {
                  ... on User {
                    login
                  }
                }
              }
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments(first: 1) {
              totalCount
            }
            reviews(first: 1) {
              totalCount
            }
            participants(first: 15) {
              nodes {
                login
                avatarUrl
                url
              }
            }
            timelineItems(last: 10, itemTypes: [ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_COMMIT]) {
              nodes {
                __typename
                ... on IssueComment {
                  createdAt
                  author {
                    login
                    avatarUrl
                    url
                  }
                  bodyText
                }
                ... on PullRequestReview {
                  createdAt
                  author {
                    login
                    avatarUrl
                    url
                  }
                  bodyText
                  state
                }
                ... on PullRequestCommit {
                  commit {
                    committedDate
                    author {
                      user {
                        login
                        avatarUrl
                        url
                      }
                      name
                    }
                    message
                  }
                }
              }
            }
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    state
                  }
                }
              }
            }
          }
        }
      }`;
    })
    .join('\n');

  return `
    query BatchedPRQuery {
      viewer {
        login
      }
      rateLimit {
        limit
        remaining
        resetAt
        used
      }
      ${repoQueries}
    }
  `;
}

export async function verifyToken(token: string): Promise<{ login: string; name: string }> {
  const query = `
    query {
      viewer {
        login
        name
      }
    }
  `;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    let errorMsg = `HTTP error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }
  return json.data.viewer;
}

export async function fetchRepoPRs(
  token: string,
  repositories: string[],
  currentUserLogin?: string
): Promise<{ prs: PullRequestItem[]; rateLimit: RateLimitInfo }> {
  if (repositories.length === 0) {
    return {
      prs: [],
      rateLimit: { limit: 5000, remaining: 5000, resetAt: new Date().toISOString(), used: 0 },
    };
  }

  const query = buildBatchedGraphQLQuery(repositories);
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    let errMsg = `GitHub API request failed (${res.status} ${res.statusText})`;
    try {
      const j = await res.json();
      if (j.message) errMsg = j.message;
    } catch {}
    throw new Error(errMsg);
  }

  const payload = await res.json();
  const viewerLogin = currentUserLogin || payload.data?.viewer?.login;
  const rateLimit: RateLimitInfo = payload.data?.rateLimit || {
    limit: 5000,
    remaining: 5000,
    resetAt: new Date().toISOString(),
    used: 0,
  };

  const rawPRs: any[] = [];
  if (payload.data) {
    Object.keys(payload.data).forEach((key) => {
      if (key.startsWith('repo_') && payload.data[key]) {
        const repo = payload.data[key];
        const prNodes = repo.pullRequests?.nodes || [];
        prNodes.forEach((node: any) => {
          rawPRs.push({
            ...node,
            repository: {
              nameWithOwner: repo.nameWithOwner,
              url: repo.url,
            },
          });
        });
      }
    });
  }

  const prs = rawPRs.map((node) => transformGraphQLPR(node, viewerLogin));
  return { prs, rateLimit };
}

export function transformGraphQLPR(node: any, viewerLogin?: string): PullRequestItem {
  const issueCommentsCount = node.comments?.totalCount || 0;
  const reviewsCount = node.reviews?.totalCount || 0;
  const totalCommentsCount = issueCommentsCount + reviewsCount;

  // Review Decision
  let reviewDecision: ReviewDecision = 'REVIEW_REQUIRED';
  if (node.isDraft) {
    reviewDecision = 'DRAFT';
  } else if (node.reviewDecision === 'APPROVED') {
    reviewDecision = 'APPROVED';
  } else if (node.reviewDecision === 'CHANGES_REQUESTED') {
    reviewDecision = 'CHANGES_REQUESTED';
  }

  // CI Status
  let ciStatus: CIStatus = 'NEUTRAL';
  const rollupState = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state;
  if (rollupState === 'SUCCESS') ciStatus = 'SUCCESS';
  else if (rollupState === 'FAILURE' || rollupState === 'ERROR') ciStatus = 'FAILURE';
  else if (rollupState === 'PENDING' || rollupState === 'EXPECTED') ciStatus = 'PENDING';

  // Participants
  const participants: Participant[] = (node.participants?.nodes || [])
    .filter((p: any) => p && p.login)
    .map((p: any) => ({
      login: p.login,
      avatarUrl: p.avatarUrl || `https://github.com/${p.login}.png`,
      url: p.url || `https://github.com/${p.login}`,
    }));

  // Timeline & Last interaction
  let lastInteraction: LastInteraction = {
    user: {
      login: node.author?.login || 'unknown',
      avatarUrl: node.author?.avatarUrl || '',
      url: node.author?.url || '',
    },
    type: 'commit',
    createdAt: node.createdAt,
  };

  const timelineItems = node.timelineItems?.nodes || [];
  for (let i = timelineItems.length - 1; i >= 0; i--) {
    const item = timelineItems[i];
    if (!item) continue;
    if (item.__typename === 'IssueComment' && item.author) {
      lastInteraction = {
        user: {
          login: item.author.login,
          avatarUrl: item.author.avatarUrl,
          url: item.author.url,
        },
        type: 'comment',
        createdAt: item.createdAt,
        snippet: item.bodyText?.slice(0, 80),
      };
      break;
    } else if (item.__typename === 'PullRequestReview' && item.author) {
      lastInteraction = {
        user: {
          login: item.author.login,
          avatarUrl: item.author.avatarUrl,
          url: item.author.url,
        },
        type: 'review',
        createdAt: item.createdAt,
        snippet: item.bodyText?.slice(0, 80),
      };
      break;
    } else if (item.__typename === 'PullRequestCommit' && item.commit?.author?.user) {
      lastInteraction = {
        user: {
          login: item.commit.author.user.login,
          avatarUrl: item.commit.author.user.avatarUrl,
          url: item.commit.author.user.url,
        },
        type: 'commit',
        createdAt: item.commit.committedDate,
      };
      break;
    }
  }

  // SLA Staleness
  const lastActiveTime = new Date(lastInteraction.createdAt || node.updatedAt).getTime();
  const now = Date.now();
  const hoursSinceActivity = (now - lastActiveTime) / (1000 * 60 * 60);

  let slaStatus: SLAStatus = 'normal';
  if (hoursSinceActivity > 48) {
    slaStatus = 'stale';
  } else if (hoursSinceActivity > 24) {
    slaStatus = 'warning';
  }

  const requestedReviewers: string[] = (node.reviewRequests?.nodes || [])
    .map((r: any) => r?.requestedReviewer?.login)
    .filter(Boolean);

  const isWaitingOnMe = viewerLogin ? requestedReviewers.includes(viewerLogin) : false;
  const isAuthoredByMe = viewerLogin ? node.author?.login === viewerLogin : false;

  return {
    id: node.id,
    number: node.number,
    title: node.title,
    url: node.url,
    repository: node.repository,
    author: {
      login: node.author?.login || 'unknown',
      avatarUrl: node.author?.avatarUrl || `https://github.com/${node.author?.login || 'ghost'}.png`,
      url: node.author?.url || `https://github.com/${node.author?.login || 'ghost'}`,
    },
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    isDraft: Boolean(node.isDraft),
    baseRefName: node.baseRefName,
    headRefName: node.headRefName,
    totalCommentsCount,
    participants,
    lastInteraction,
    reviewDecision,
    ciStatus,
    slaStatus,
    labels: (node.labels?.nodes || []).map((l: any) => ({ name: l.name, color: l.color })),
    isWaitingOnMe,
    isAuthoredByMe,
  };
}
```

- [ ] **Step 3: Run API service tests**

Run: `npm test src/services/github.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat: implement GitHub GraphQL query batching and data transformer"
```

---

### Task 4: UI Components — Settings & Repository Management Modal

**Files:**
- Create: `src/components/SettingsModal.tsx`
- Create: `src/components/RepoInput.tsx`
- Test: `src/components/SettingsModal.test.tsx`

**Interfaces:**
- Produces: `SettingsModal` allowing token verification, SSO test indicator, storage preference toggle, and repository chip editing.

- [ ] **Step 1: Write SettingsModal component test**

`src/components/SettingsModal.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';
import { DEFAULT_SETTINGS } from '../services/storage';

describe('SettingsModal', () => {
  it('renders settings dialog with token input and repository list', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, repositories: ['my-org/core-repo'] }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/Settings & Authentication/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ghp_ or github_pat_/i)).toBeInTheDocument();
    expect(screen.getByText('my-org/core-repo')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    const handleSave = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save & Apply/i });
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement RepoInput and SettingsModal**

`src/components/RepoInput.tsx`:
```typescript
import React, { useState } from 'react';
import { Plus, X, FolderGit2 } from 'lucide-react';

interface RepoInputProps {
  repositories: string[];
  onChange: (repos: string[]) => void;
}

export const RepoInput: React.FC<RepoInputProps> = ({ repositories, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (!trimmed.includes('/') || trimmed.split('/').length !== 2) {
      setError('Repository must be in "owner/repo" format');
      return;
    }
    if (repositories.includes(trimmed)) {
      setError('Repository already added');
      return;
    }
    onChange([...repositories, trimmed]);
    setInputVal('');
    setError(null);
  };

  const handleRemove = (repo: string) => {
    onChange(repositories.filter((r) => r !== repo));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="e.g. company-org/frontend-app"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-900/60 rounded-lg border border-slate-800">
        {repositories.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No repositories added yet.</p>
        ) : (
          repositories.map((repo) => (
            <span
              key={repo}
              className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-md"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
              {repo}
              <button
                type="button"
                onClick={() => handleRemove(repo)}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
```

`src/components/SettingsModal.tsx`:
```typescript
import React, { useState } from 'react';
import { X, Key, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { RepoInput } from './RepoInput';
import { verifyToken } from '../services/github';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [token, setToken] = useState(settings.token);
  const [storageType, setStorageType] = useState(settings.storageType);
  const [repositories, setRepositories] = useState(settings.repositories);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(
    settings.autoRefreshIntervalSeconds
  );

  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    success: boolean;
    user?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!token.trim()) {
      setVerifyStatus({ success: false, error: 'Please enter a token first' });
      return;
    }
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const user = await verifyToken(token.trim());
      setVerifyStatus({ success: true, user: user.login });
    } catch (err: any) {
      setVerifyStatus({ success: false, error: err.message || 'Token validation failed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      token: token.trim(),
      storageType,
      repositories,
      autoRefreshIntervalSeconds: autoRefreshInterval,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Settings & Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Token Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                GitHub Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                Generate Token ↗
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_ or github_pat_..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestToken}
                disabled={verifying || !token}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              >
                {verifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
                Test
              </button>
            </div>

            {verifyStatus && (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                  verifyStatus.success
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                }`}
              >
                {verifyStatus.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Valid token for user <strong>@{verifyStatus.user}</strong>.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{verifyStatus.error}</span>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Requires <code>repo</code> or <code>read:org</code> scope. If using SAML SSO, click <em>Configure SSO</em> on your token in GitHub settings.
            </p>
          </div>

          {/* Storage Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Storage Preference</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'local'}
                  onChange={() => setStorageType('local')}
                  className="text-blue-500 focus:ring-0"
                />
                <span className="text-xs text-slate-200">
                  <strong>Local Storage</strong> (Persists across browser restarts)
                </span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'session'}
                  onChange={() => setStorageType('session')}
                  className="text-blue-500 focus:ring-0"
                />
                <span className="text-xs text-slate-200">
                  <strong>Session Only</strong> (Cleared when tab closes)
                </span>
              </label>
            </div>
          </div>

          {/* Repositories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Tracked Repositories (<code>owner/repo</code>)
            </label>
            <RepoInput repositories={repositories} onChange={setRepositories} />
          </div>

          {/* Auto Refresh */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Auto Refresh Interval</label>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Disabled (Manual refresh only)</option>
              <option value={60}>Every 1 minute</option>
              <option value={180}>Every 3 minutes</option>
              <option value={300}>Every 5 minutes</option>
              <option value={600}>Every 10 minutes</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run SettingsModal tests**

Run: `npm test src/components/SettingsModal.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/RepoInput.tsx src/components/SettingsModal.tsx src/components/SettingsModal.test.tsx
git commit -m "feat: implement SettingsModal and RepoInput components"
```

---

### Task 5: UI Components — Header, Rate Limit & SLA Status Badges

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/StatusBadges.tsx`
- Test: `src/components/Header.test.tsx`
- Test: `src/components/StatusBadges.test.tsx`

**Interfaces:**
- Produces: `Header` component with refresh triggers, rate limit pill, settings button, and `StatusBadges` (Review decision, CI rollup, SLA staleness).

- [ ] **Step 1: Write Header and StatusBadges tests**

`src/components/StatusBadges.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReviewBadge, CIBadge, SLABadge } from './StatusBadges';

describe('StatusBadges', () => {
  it('renders Approved review badge', () => {
    render(<ReviewBadge decision="APPROVED" />);
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
  });

  it('renders CI passing badge', () => {
    render(<CIBadge status="SUCCESS" />);
    expect(screen.getByLabelText(/CI Passing/i)).toBeInTheDocument();
  });

  it('renders Stale SLA warning badge', () => {
    render(<SLABadge status="stale" />);
    expect(screen.getByText(/Stale > 48h/i)).toBeInTheDocument();
  });
});
```

`src/components/Header.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders title, rate limit, and triggers refresh', () => {
    const handleRefresh = vi.fn();
    const handleOpenSettings = vi.fn();

    render(
      <Header
        onRefresh={handleRefresh}
        onOpenSettings={handleOpenSettings}
        onOpenExport={vi.fn()}
        isLoading={false}
        rateLimit={{ limit: 5000, remaining: 4950, resetAt: new Date().toISOString(), used: 50 }}
        lastFetched={new Date()}
      />
    );

    expect(screen.getByText(/PR Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/4950 \/ 5000/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement StatusBadges and Header**

`src/components/StatusBadges.tsx`:
```typescript
import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileCode2, Check, HelpCircle } from 'lucide-react';
import { ReviewDecision, CIStatus, SLAStatus } from '../types';

export const ReviewBadge: React.FC<{ decision: ReviewDecision }> = ({ decision }) => {
  switch (decision) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
          <Check className="w-3 h-3 text-emerald-400" /> Approved
        </span>
      );
    case 'CHANGES_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/70 border border-rose-700/60 text-rose-300">
          <XCircle className="w-3 h-3 text-rose-400" /> Changes Requested
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
          <FileCode2 className="w-3 h-3" /> Draft
        </span>
      );
    case 'REVIEW_REQUIRED':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 border border-amber-700/60 text-amber-300">
          <Clock className="w-3 h-3 text-amber-400" /> Review Required
        </span>
      );
  }
};

export const CIBadge: React.FC<{ status: CIStatus }> = ({ status }) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <span aria-label="CI Passing" title="All checks passed" className="text-emerald-400 inline-flex items-center">
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    case 'FAILURE':
      return (
        <span aria-label="CI Failing" title="Checks failing" className="text-rose-400 inline-flex items-center">
          <XCircle className="w-4 h-4" />
        </span>
      );
    case 'PENDING':
      return (
        <span aria-label="CI Pending" title="Checks in progress" className="text-amber-400 inline-flex items-center animate-pulse">
          <Clock className="w-4 h-4" />
        </span>
      );
    case 'NEUTRAL':
    default:
      return (
        <span aria-label="No CI Status" title="No checks reported" className="text-slate-600 inline-flex items-center">
          <HelpCircle className="w-4 h-4" />
        </span>
      );
  }
};

export const SLABadge: React.FC<{ status: SLAStatus }> = ({ status }) => {
  switch (status) {
    case 'stale':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 border border-rose-800 text-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> Stale &gt; 48h
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
          <Clock className="w-3 h-3 text-amber-400" /> &gt; 24h idle
        </span>
      );
    case 'normal':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-emerald-400/80 bg-emerald-950/30">
          Active
        </span>
      );
  }
};
```

`src/components/Header.tsx`:
```typescript
import React from 'react';
import { GitPullRequest, RefreshCw, Settings, Share2, Activity } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  isLoading: boolean;
  rateLimit: RateLimitInfo | null;
  lastFetched: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenSettings,
  onOpenExport,
  isLoading,
  rateLimit,
  lastFetched,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
              GitHub PR Dashboard
              <span className="text-[10px] uppercase font-semibold bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {lastFetched
                ? `Last updated: ${lastFetched.toLocaleTimeString()}`
                : 'Not synced yet'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {rateLimit && (
            <div
              title={`GraphQL Rate Limit Reset: ${new Date(rateLimit.resetAt).toLocaleTimeString()}`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400"
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>
                API: <strong className="text-slate-200">{rateLimit.remaining}</strong> / {rateLimit.limit}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Standup</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 3: Run StatusBadges and Header tests**

Run: `npm test src/components/StatusBadges.test.tsx src/components/Header.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/StatusBadges.tsx src/components/StatusBadges.test.tsx src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat: add Header, RateLimit and StatusBadges components"
```

---

### Task 6: UI Components — Filter Bar, Search & Presets

**Files:**
- Create: `src/components/FilterBar.tsx`
- Test: `src/components/FilterBar.test.tsx`

**Interfaces:**
- Produces: `FilterBar` component supporting quick filter presets (`all`, `waiting_on_me`, `authored_by_me`, `needs_review`, `ready_to_merge`), sorting options, repo filtering, and full-text search.

- [ ] **Step 1: Write FilterBar tests**

`src/components/FilterBar.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('renders quick filter buttons with counts', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={handleFilterChange}
        searchQuery=""
        onSearchChange={vi.fn()}
        sortOption="created_desc"
        onSortChange={vi.fn()}
        selectedRepo="all"
        onRepoChange={vi.fn()}
        availableRepos={['org/repo-1', 'org/repo-2']}
        counts={{ all: 10, waiting_on_me: 3, authored_by_me: 2, needs_review: 5, ready_to_merge: 1 }}
      />
    );

    expect(screen.getByRole('button', { name: /All Open \(10\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Waiting on Me \(3\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Waiting on Me \(3\)/i }));
    expect(handleFilterChange).toHaveBeenCalledWith('waiting_on_me');
  });
});
```

- [ ] **Step 2: Implement FilterBar**

`src/components/FilterBar.tsx`:
```typescript
import React from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { FilterPreset, SortOption } from '../types';

interface FilterBarProps {
  activeFilter: FilterPreset;
  onFilterChange: (filter: FilterPreset) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  availableRepos: string[];
  counts: Record<FilterPreset, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedRepo,
  onRepoChange,
  availableRepos,
  counts,
}) => {
  const filterButtons: { id: FilterPreset; label: string }[] = [
    { id: 'all', label: 'All Open' },
    { id: 'waiting_on_me', label: 'Waiting on Me' },
    { id: 'needs_review', label: 'Needs Review' },
    { id: 'ready_to_merge', label: 'Ready to Merge' },
    { id: 'authored_by_me', label: 'Authored by Me' },
  ];

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
      {/* Top row: Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((btn) => {
          const isActive = activeFilter === btn.id;
          const count = counts[btn.id] || 0;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => onFilterChange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {btn.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom row: Search + Repository dropdown + Sort dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by title, author, branch, or label..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Repository Filter */}
        {availableRepos.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedRepo}
              onChange={(e) => onRepoChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Repositories ({availableRepos.length})</option>
              {availableRepos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="created_desc">Newest Created</option>
            <option value="created_asc">Oldest Created</option>
            <option value="updated_desc">Recently Active</option>
            <option value="comments_desc">Most Comments</option>
            <option value="stale_desc">Most Stale / SLA</option>
          </select>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run FilterBar tests**

Run: `npm test src/components/FilterBar.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/FilterBar.tsx src/components/FilterBar.test.tsx
git commit -m "feat: implement FilterBar with search, sorting and quick filters"
```

---

### Task 7: UI Components — PR Table & Interactive PR Rows

**Files:**
- Create: `src/components/PRRow.tsx`
- Create: `src/components/PRTable.tsx`
- Test: `src/components/PRTable.test.tsx`

**Interfaces:**
- Produces: `PRTable` and `PRRow` displaying creation time, total comments, participants, last interacted person, reviews, CI status, and SLA warnings.

- [ ] **Step 1: Write PRTable tests**

`src/components/PRTable.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PRTable } from './PRTable';
import { PullRequestItem } from '../types';

const mockPR: PullRequestItem = {
  id: 'PR_1',
  number: 42,
  title: 'feat: add user analytics tracking',
  url: 'https://github.com/org/repo/pull/42',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
  createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  updatedAt: new Date().toISOString(),
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'feat/analytics',
  totalCommentsCount: 7,
  participants: [
    { login: 'alice', avatarUrl: 'https://github.com/alice.png', url: 'https://github.com/alice' },
    { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
  ],
  lastInteraction: {
    user: { login: 'bob', avatarUrl: 'https://github.com/bob.png', url: 'https://github.com/bob' },
    type: 'comment',
    createdAt: new Date(Date.now() - 60000 * 15).toISOString(),
    snippet: 'Looks great! One minor question.',
  },
  reviewDecision: 'APPROVED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [{ name: 'enhancement', color: 'a2eeef' }],
};

describe('PRTable', () => {
  it('renders table headers and PR data accurately', () => {
    render(<PRTable prs={[mockPR]} isLoading={false} />);

    expect(screen.getByText(/feat: add user analytics tracking/i)).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('org/repo')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // comment count
  });

  it('renders empty state when no PRs match', () => {
    render(<PRTable prs={[]} isLoading={false} />);
    expect(screen.getByText(/No Pull Requests found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement PRRow and PRTable**

`src/components/PRRow.tsx`:
```typescript
import React from 'react';
import { GitBranch, MessageSquare, ExternalLink, MessageCircle } from 'lucide-react';
import { PullRequestItem } from '../types';
import { ReviewBadge, CIBadge, SLABadge } from './StatusBadges';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const PRRow: React.FC<{ pr: PullRequestItem }> = ({ pr }) => {
  return (
    <tr className="border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors group">
      {/* Repository */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <a
          href={pr.repository.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-300 hover:text-blue-200"
        >
          {pr.repository.nameWithOwner}
        </a>
      </td>

      {/* PR Details */}
      <td className="px-4 py-3.5 max-w-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors inline-flex items-center gap-1"
            >
              {pr.title}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
            </a>
            <span className="text-xs text-slate-500 font-mono">#{pr.number}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              <GitBranch className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300 truncate max-w-[120px]">{pr.headRefName}</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-400">{pr.baseRefName}</span>
            </span>

            {pr.labels.map((l) => (
              <span
                key={l.name}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-700 bg-slate-900 text-slate-300"
              >
                {l.name}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* Author & Created */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={pr.author.avatarUrl}
            alt={pr.author.login}
            className="w-6 h-6 rounded-full border border-slate-700"
          />
          <div>
            <a
              href={pr.author.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-200 hover:underline block"
            >
              {pr.author.login}
            </a>
            <span className="text-[11px] text-slate-500">{timeAgo(pr.createdAt)}</span>
          </div>
        </div>
      </td>

      {/* Review & CI Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <ReviewBadge decision={pr.reviewDecision} />
          <CIBadge status={pr.ciStatus} />
        </div>
      </td>

      {/* Discussions & Participants */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{pr.totalCommentsCount}</span>
            <span className="text-slate-500 text-[11px]">comments</span>
          </div>

          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {pr.participants.slice(0, 5).map((p) => (
              <img
                key={p.login}
                src={p.avatarUrl}
                alt={p.login}
                title={`@${p.login}`}
                className="w-5 h-5 rounded-full border border-slate-800 ring-1 ring-slate-950"
              />
            ))}
            {pr.participants.length > 5 && (
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center justify-center font-mono">
                +{pr.participants.length - 5}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Last Interaction */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={pr.lastInteraction.user.avatarUrl}
            alt={pr.lastInteraction.user.login}
            className="w-5 h-5 rounded-full border border-slate-700 shrink-0"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <MessageCircle className="w-3 h-3 text-blue-400" />
              <span className="font-medium text-slate-200">
                @{pr.lastInteraction.user.login}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {timeAgo(pr.lastInteraction.createdAt)}
            </span>
          </div>
        </div>
      </td>

      {/* SLA / Staleness */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <SLABadge status={pr.slaStatus} />
      </td>
    </tr>
  );
};
```

`src/components/PRTable.tsx`:
```typescript
import React from 'react';
import { PullRequestItem } from '../types';
import { PRRow } from './PRRow';
import { RefreshCw, FolderSearch } from 'lucide-react';

interface PRTableProps {
  prs: PullRequestItem[];
  isLoading: boolean;
}

export const PRTable: React.FC<PRTableProps> = ({ prs, isLoading }) => {
  if (isLoading && prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-950 border border-slate-800 rounded-xl">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">Fetching Pull Requests...</p>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-950 border border-slate-800 rounded-xl text-center">
        <FolderSearch className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Pull Requests found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No open PRs match your current filter criteria or tracked repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Repository</th>
              <th scope="col" className="px-4 py-3">Pull Request</th>
              <th scope="col" className="px-4 py-3">Author / Created</th>
              <th scope="col" className="px-4 py-3">Status & CI</th>
              <th scope="col" className="px-4 py-3">Activity</th>
              <th scope="col" className="px-4 py-3">Last Interaction</th>
              <th scope="col" className="px-4 py-3 text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {prs.map((pr) => (
              <PRRow key={pr.id} pr={pr} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run PRTable tests**

Run: `npm test src/components/PRTable.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/PRRow.tsx src/components/PRTable.tsx src/components/PRTable.test.tsx
git commit -m "feat: implement PRTable and PRRow with detailed interactions"
```

---

### Task 8: UI Components — Standup Digest & Export Modal

**Files:**
- Create: `src/components/ExportModal.tsx`
- Create: `src/utils/exportDigest.ts`
- Test: `src/utils/exportDigest.test.ts`
- Test: `src/components/ExportModal.test.tsx`

**Interfaces:**
- Produces: `generateMarkdownDigest(prs: PullRequestItem[]): string`, `generateSlackDigest(prs: PullRequestItem[]): string`, `ExportModal` component with one-click copy.

- [ ] **Step 1: Write export digest tests**

`src/utils/exportDigest.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateMarkdownDigest, generateSlackDigest } from './exportDigest';
import { PullRequestItem } from '../types';

const samplePR: PullRequestItem = {
  id: 'PR_1',
  number: 101,
  title: 'fix: auth token expiry check',
  url: 'https://github.com/org/repo/pull/101',
  repository: { nameWithOwner: 'org/repo', url: 'https://github.com/org/repo' },
  author: { login: 'charlie', avatarUrl: '', url: '' },
  createdAt: '2026-08-30T10:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
  isDraft: false,
  baseRefName: 'main',
  headRefName: 'fix/auth',
  totalCommentsCount: 3,
  participants: [],
  lastInteraction: {
    user: { login: 'dana', avatarUrl: '', url: '' },
    type: 'comment',
    createdAt: '2026-08-30T12:00:00Z',
  },
  reviewDecision: 'REVIEW_REQUIRED',
  ciStatus: 'SUCCESS',
  slaStatus: 'normal',
  labels: [],
};

describe('exportDigest', () => {
  it('generates markdown digest correctly', () => {
    const md = generateMarkdownDigest([samplePR]);
    expect(md).toContain('### org/repo');
    expect(md).toContain('[#101 fix: auth token expiry check](https://github.com/org/repo/pull/101)');
    expect(md).toContain('@charlie');
  });

  it('generates slack digest correctly', () => {
    const slack = generateSlackDigest([samplePR]);
    expect(slack).toContain('*org/repo*');
    expect(slack).toContain('<https://github.com/org/repo/pull/101|#101 fix: auth token expiry check>');
  });
});
```

- [ ] **Step 2: Implement exportDigest utility and ExportModal**

`src/utils/exportDigest.ts`:
```typescript
import { PullRequestItem } from '../types';

export function generateMarkdownDigest(prs: PullRequestItem[]): string {
  if (prs.length === 0) return 'No open pull requests.';

  const byRepo: Record<string, PullRequestItem[]> = {};
  prs.forEach((pr) => {
    const repo = pr.repository.nameWithOwner;
    if (!byRepo[repo]) byRepo[repo] = [];
    byRepo[repo].push(pr);
  });

  let md = `## 📋 Pull Request Standup Digest (${new Date().toLocaleDateString()})\n\n`;
  Object.keys(byRepo).forEach((repo) => {
    md += `### ${repo}\n`;
    byRepo[repo].forEach((pr) => {
      const statusIcon = pr.reviewDecision === 'APPROVED' ? '✅ Approved' : '⏳ Needs Review';
      md += `- [#${pr.number} ${pr.title}](${pr.url}) by @${pr.author.login} (${statusIcon}, 💬 ${pr.totalCommentsCount} comments, last active: @${pr.lastInteraction.user.login})\n`;
    });
    md += '\n';
  });

  return md.trim();
}

export function generateSlackDigest(prs: PullRequestItem[]): string {
  if (prs.length === 0) return 'No open pull requests.';

  const byRepo: Record<string, PullRequestItem[]> = {};
  prs.forEach((pr) => {
    const repo = pr.repository.nameWithOwner;
    if (!byRepo[repo]) byRepo[repo] = [];
    byRepo[repo].push(pr);
  });

  let text = `*📋 Pull Request Standup Digest (${new Date().toLocaleDateString()})*\n\n`;
  Object.keys(byRepo).forEach((repo) => {
    text += `*${repo}*\n`;
    byRepo[repo].forEach((pr) => {
      const statusEmoji = pr.reviewDecision === 'APPROVED' ? '✅' : '⏳';
      text += `• <${pr.url}|#${pr.number} ${pr.title}> - by @${pr.author.login} ${statusEmoji} (💬 ${pr.totalCommentsCount} | Last: @${pr.lastInteraction.user.login})\n`;
    });
    text += '\n';
  });

  return text.trim();
}
```

`src/components/ExportModal.tsx`:
```typescript
import React, { useState } from 'react';
import { X, Copy, Check, FileText, MessageSquare } from 'lucide-react';
import { PullRequestItem } from '../types';
import { generateMarkdownDigest, generateSlackDigest } from '../utils/exportDigest';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prs: PullRequestItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, prs }) => {
  const [format, setFormat] = useState<'markdown' | 'slack'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = format === 'markdown' ? generateMarkdownDigest(prs) : generateSlackDigest(prs);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Export Standup Digest</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  format === 'markdown'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Markdown
              </button>
              <button
                type="button"
                onClick={() => setFormat('slack')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  format === 'slack'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Slack Text
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Digest
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={content}
            rows={12}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run export digest tests**

Run: `npm test src/utils/exportDigest.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/utils/exportDigest.ts src/utils/exportDigest.test.ts src/components/ExportModal.tsx
git commit -m "feat: implement standup markdown and slack export modal"
```

---

### Task 9: Full App Integration & Live Reactive Flow

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: Integrated dashboard managing state, auto-refresh intervals, filters, search, and settings.

- [ ] **Step 1: Write integration tests in App.test.tsx**

`src/App.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as storage from './services/storage';
import * as github from './services/github';

describe('App Main Dashboard Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('prompts to configure settings when no token or repos are set', () => {
    render(<App />);
    expect(screen.getByText(/Configure GitHub Access/i)).toBeInTheDocument();
  });

  it('fetches and displays PR list when configured', async () => {
    vi.spyOn(storage, 'getStoredSettings').mockReturnValue({
      token: 'ghp_mock_token',
      storageType: 'local',
      repositories: ['acme/web-app'],
      presets: [],
      activePresetId: null,
      autoRefreshIntervalSeconds: 0,
    });

    vi.spyOn(github, 'fetchRepoPRs').mockResolvedValue({
      prs: [
        {
          id: 'PR_1',
          number: 100,
          title: 'refactor: modularize API services',
          url: 'https://github.com/acme/web-app/pull/100',
          repository: { nameWithOwner: 'acme/web-app', url: 'https://github.com/acme/web-app' },
          author: { login: 'dev1', avatarUrl: '', url: '' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDraft: false,
          baseRefName: 'main',
          headRefName: 'refactor/api',
          totalCommentsCount: 4,
          participants: [{ login: 'dev1', avatarUrl: '', url: '' }],
          lastInteraction: {
            user: { login: 'reviewer1', avatarUrl: '', url: '' },
            type: 'comment',
            createdAt: new Date().toISOString(),
          },
          reviewDecision: 'APPROVED',
          ciStatus: 'SUCCESS',
          slaStatus: 'normal',
          labels: [],
        },
      ],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), used: 10 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/refactor: modularize API services/i)).toBeInTheDocument();
      expect(screen.getByText('acme/web-app')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Implement full App.tsx logic**

`src/App.tsx`:
```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PRTable } from './components/PRTable';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { getStoredSettings, saveStoredSettings } from './services/storage';
import { fetchRepoPRs } from './services/github';
import { AppSettings, PullRequestItem, RateLimitInfo, FilterPreset, SortOption } from './types';
import { KeyRound, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [prs, setPrs] = useState<PullRequestItem[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Filters & Sorting state
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [selectedRepo, setSelectedRepo] = useState('all');

  const loadData = useCallback(async () => {
    if (!settings.token || settings.repositories.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRepoPRs(settings.token, settings.repositories);
      setPrs(res.prs);
      setRateLimit(res.rateLimit);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Pull Requests');
    } finally {
      setIsLoading(false);
    }
  }, [settings.token, settings.repositories]);

  // Initial load
  useEffect(() => {
    if (settings.token && settings.repositories.length > 0) {
      loadData();
    }
  }, [loadData, settings.token, settings.repositories]);

  // Auto-refresh timer
  useEffect(() => {
    if (settings.autoRefreshIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      loadData();
    }, settings.autoRefreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [loadData, settings.autoRefreshIntervalSeconds]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Filter and sort calculations
  const filteredPrs = useMemo(() => {
    return prs
      .filter((pr) => {
        // Repo filter
        if (selectedRepo !== 'all' && pr.repository.nameWithOwner !== selectedRepo) {
          return false;
        }

        // Quick filter preset
        if (activeFilter === 'waiting_on_me' && !pr.isWaitingOnMe) return false;
        if (activeFilter === 'authored_by_me' && !pr.isAuthoredByMe) return false;
        if (activeFilter === 'needs_review' && pr.reviewDecision !== 'REVIEW_REQUIRED') return false;
        if (activeFilter === 'ready_to_merge' && (pr.reviewDecision !== 'APPROVED' || pr.ciStatus === 'FAILURE')) return false;

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = pr.title.toLowerCase().includes(q);
          const matchAuthor = pr.author.login.toLowerCase().includes(q);
          const matchHead = pr.headRefName.toLowerCase().includes(q);
          const matchRepo = pr.repository.nameWithOwner.toLowerCase().includes(q);
          const matchLabels = pr.labels.some((l) => l.name.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchHead && !matchRepo && !matchLabels) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'created_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'updated_desc':
            return new Date(b.lastInteraction.createdAt).getTime() - new Date(a.lastInteraction.createdAt).getTime();
          case 'comments_desc':
            return b.totalCommentsCount - a.totalCommentsCount;
          case 'stale_desc': {
            const score = { stale: 3, warning: 2, normal: 1 };
            return score[b.slaStatus] - score[a.slaStatus];
          }
          default:
            return 0;
        }
      });
  }, [prs, selectedRepo, activeFilter, searchQuery, sortOption]);

  const counts: Record<FilterPreset, number> = useMemo(() => {
    return {
      all: prs.length,
      waiting_on_me: prs.filter((p) => p.isWaitingOnMe).length,
      authored_by_me: prs.filter((p) => p.isAuthoredByMe).length,
      needs_review: prs.filter((p) => p.reviewDecision === 'REVIEW_REQUIRED').length,
      ready_to_merge: prs.filter((p) => p.reviewDecision === 'APPROVED' && p.ciStatus !== 'FAILURE').length,
    };
  }, [prs]);

  const isConfigured = Boolean(settings.token && settings.repositories.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        onRefresh={loadData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isLoading={isLoading}
        rateLimit={rateLimit}
        lastFetched={lastFetched}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {!isConfigured ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-4 my-12">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Configure GitHub Access</h2>
            <p className="text-sm text-slate-400">
              Provide your GitHub Personal Access Token and enter the company repositories you wish to monitor.
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg transition-all"
            >
              Open Settings
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center justify-between p-4 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="flex items-center gap-1 text-xs bg-rose-900/80 hover:bg-rose-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              selectedRepo={selectedRepo}
              onRepoChange={setSelectedRepo}
              availableRepos={settings.repositories}
              counts={counts}
            />

            <PRTable prs={filteredPrs} isLoading={isLoading} />
          </>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        prs={filteredPrs}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run integration test**

Run: `npm test`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: complete App dashboard integration with auto-refresh and filters"
```

---

### Task 10: GitHub Pages Deployment Workflow & Verification

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Test: Full build and test suite execution

**Interfaces:**
- Produces: Complete automated GitHub Actions workflow for zero-config GitHub Pages hosting.

- [ ] **Step 1: Create GitHub Actions deployment workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run test suite
        run: npm test

      - name: Build static SPA
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create comprehensive README.md**

`README.md`:
```markdown
# 🚀 GitHub PR Dashboard

A secure, client-side GitHub Pages Single Page Application to monitor, filter, and track Pull Requests across multiple organization repositories.

## ✨ Features
- **Zero Backend / 100% Private**: Connects directly from your browser to GitHub GraphQL API via Personal Access Token (PAT).
- **Multi-Repository Batching**: Queries dozens of repos in a single GraphQL call with minimal rate-limit consumption.
- **Detailed Interaction Insights**: Shows creation date, total comments, participants, and the last person to comment or review with timestamp.
- **Review & CI Badges**: Real-time review decisions (Approved, Changes Requested, Draft) and commit check suites.
- **SLA & Staleness Alerts**: Visual warnings for PRs awaiting action for >24h or >48h.
- **Standup Digests**: One-click Markdown & Slack export for daily syncs.

## 🛠️ Local Development
```bash
npm install
npm run dev
npm test
npm run build
```

## 📦 Deployment
This repository is configured to deploy to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. In your repo settings, set GitHub Pages Source to **GitHub Actions**.
```

- [ ] **Step 3: Run full build and test verification**

Run: `npm test && npm run build`  
Expected: PASS and `dist/` directory generated.

- [ ] **Step 4: Commit and finalize**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: add GitHub Pages deployment workflow and documentation"
```
