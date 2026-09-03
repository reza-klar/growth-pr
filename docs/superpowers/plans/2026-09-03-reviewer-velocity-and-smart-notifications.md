# Reviewer Velocity & Smart Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PR diff size badges (`XS`, `S`, `M`, `L`, `XL`), an interactive Team Reviewer Workload popover with 1-click reviewer filtering, and a native browser desktop notification engine for review requests, CI failures, comments, and staleness.

**Architecture:** Extended GitHub GraphQL queries fetch lines added/deleted to calculate size categories. A reactive snapshot diff detector (`useNotificationWatcher`) compares PR states on auto-refresh intervals to trigger HTML5 desktop notifications. A header workload widget computes reviewer assignments in memory for fast interactive filtering.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, HTML5 Notification API, Vitest, Testing Library.

## Global Constraints

- 100% client-side architecture: No backend; tokens and notifications remain strictly in browser storage/memory.
- Compatible with GitHub Pages static hosting (`base: './'`).
- Strict TypeScript (`strict: true`).
- TDD methodology: Every service, component, and utility must have unit/integration tests with Vitest.

---

### Task 1: Core Type Definitions & Notification Storage Defaults

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/storage.ts`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Produces: `PRSizeCategory`, `NotificationSettings`, `ReviewerWorkload`, updated `PullRequestItem`, and updated `AppSettings`.

- [ ] **Step 1: Write the failing tests in storage.test.ts**

```typescript
// in src/services/storage.test.ts
it('loads and saves notification settings correctly', () => {
  const customSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    notifications: {
      enabled: true,
      notifyReviewRequests: true,
      notifyCIFailures: true,
      notifyComments: false,
      notifyStalePRs: true,
    },
  };
  saveStoredSettings(customSettings);
  expect(getStoredSettings().notifications.enabled).toBe(true);
  expect(getStoredSettings().notifications.notifyComments).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/storage.test.ts`
Expected: FAIL (types/properties missing)

- [ ] **Step 3: Update `src/types/index.ts` and `src/services/storage.ts`**

Add `PRSizeCategory`, `NotificationSettings`, and update `AppSettings` with default notification values:
```typescript
export type PRSizeCategory = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface NotificationSettings {
  enabled: boolean;
  notifyReviewRequests: boolean;
  notifyCIFailures: boolean;
  notifyComments: boolean;
  notifyStalePRs: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  notifyReviewRequests: true,
  notifyCIFailures: true,
  notifyComments: true,
  notifyStalePRs: false,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/storage.ts src/services/storage.test.ts
git commit -m "feat: add PR size and notification settings data types"
```

---

### Task 2: GraphQL Service Extension for Additions, Deletions, & Size Calculation

**Files:**
- Modify: `src/services/github.ts`
- Test: `src/services/github.test.ts`

**Interfaces:**
- Consumes: `PRSizeCategory`
- Produces: `PullRequestItem.additions`, `PullRequestItem.deletions`, `PullRequestItem.sizeCategory`

- [ ] **Step 1: Write the failing tests in `src/services/github.test.ts`**

```typescript
// in src/services/github.test.ts
it('calculates sizeCategory correctly based on additions and deletions', () => {
  const xsPR = transformGraphQLPR({ additions: 5, deletions: 5 });
  expect(xsPR.sizeCategory).toBe('XS');

  const sPR = transformGraphQLPR({ additions: 50, deletions: 30 });
  expect(sPR.sizeCategory).toBe('S');

  const mPR = transformGraphQLPR({ additions: 200, deletions: 150 });
  expect(mPR.sizeCategory).toBe('M');

  const lPR = transformGraphQLPR({ additions: 500, deletions: 300 });
  expect(lPR.sizeCategory).toBe('L');

  const xlPR = transformGraphQLPR({ additions: 1200, deletions: 200 });
  expect(xlPR.sizeCategory).toBe('XL');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/github.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/services/github.ts`**

Add `additions` and `deletions` to GraphQL query in `buildBatchedGraphQLQuery` and compute `sizeCategory` in `transformGraphQLPR`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/github.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat: query additions and deletions and calculate PR size categories"
```

---

### Task 3: PR Size Badge Component & PRRow Integration

**Files:**
- Create: `src/components/PRSizeBadge.tsx`
- Create: `src/components/PRSizeBadge.test.tsx`
- Modify: `src/components/PRRow.tsx`
- Test: `src/components/PRTable.test.tsx`

**Interfaces:**
- Consumes: `additions: number`, `deletions: number`, `sizeCategory: PRSizeCategory`
- Produces: `<PRSizeBadge additions={pr.additions} deletions={pr.deletions} sizeCategory={pr.sizeCategory} />`

- [ ] **Step 1: Write failing tests in `src/components/PRSizeBadge.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PRSizeBadge } from './PRSizeBadge';

describe('PRSizeBadge', () => {
  it('renders size label and diff numbers', () => {
    render(<PRSizeBadge additions={45} deletions={12} sizeCategory="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('+45 / -12')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PRSizeBadge.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `PRSizeBadge.tsx` and integrate into `PRRow.tsx`**

Render the compact size badge with color tokens:
- `XS`/`S`: emerald badge
- `M`: sky/cyan badge
- `L`: amber badge
- `XL`: rose badge

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/PRSizeBadge.test.tsx src/components/PRTable.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PRSizeBadge.tsx src/components/PRSizeBadge.test.tsx src/components/PRRow.tsx
git commit -m "feat: render compact PR size diff badges in table rows"
```

---

### Task 4: Team Reviewer Workload Popover Component & Header Integration

**Files:**
- Create: `src/components/TeamWorkloadPopover.tsx`
- Create: `src/components/TeamWorkloadPopover.test.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `prs: PullRequestItem[]`, `selectedReviewer: string | null`, `onSelectReviewer: (login: string | null) => void`
- Produces: Header workload popover trigger with teammate pending review list and interactive filter.

- [ ] **Step 1: Write failing tests in `src/components/TeamWorkloadPopover.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamWorkloadPopover } from './TeamWorkloadPopover';

describe('TeamWorkloadPopover', () => {
  it('aggregates requested reviewers and invokes onSelectReviewer on click', () => {
    const handleSelect = vi.fn();
    render(
      <TeamWorkloadPopover
        prs={mockPRs}
        selectedReviewer={null}
        onSelectReviewer={handleSelect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Team Workload/i }));
    expect(screen.getByText('@alex')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TeamWorkloadPopover.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `TeamWorkloadPopover.tsx` and integrate into `Header.tsx`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/TeamWorkloadPopover.test.tsx src/components/Header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TeamWorkloadPopover.tsx src/components/TeamWorkloadPopover.test.tsx src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat: add interactive team reviewer workload widget in header"
```

---

### Task 5: Notification Diff Engine & Browser HTML5 Alerts

**Files:**
- Create: `src/utils/notifications.ts`
- Create: `src/utils/notifications.test.ts`
- Create: `src/hooks/useNotificationWatcher.ts`

**Interfaces:**
- Consumes: `prs: PullRequestItem[]`, `settings: NotificationSettings`, `currentLogin?: string`
- Produces: `detectPRChanges(previousPRs, currentPRs, settings, currentLogin)` and `sendBrowserNotification(event)`

- [ ] **Step 1: Write failing tests in `src/utils/notifications.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { detectPRChanges } from './notifications';

describe('detectPRChanges', () => {
  it('detects when a review is newly requested on current user', () => {
    const prev = [{ ...samplePR, isWaitingOnMe: false }];
    const curr = [{ ...samplePR, isWaitingOnMe: true }];
    const events = detectPRChanges(prev, curr, defaultSettings, 'myuser');
    expect(events).toContainEqual(expect.objectContaining({ type: 'review_requested' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/notifications.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/utils/notifications.ts` and `src/hooks/useNotificationWatcher.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/notifications.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/notifications.ts src/utils/notifications.test.ts src/hooks/useNotificationWatcher.ts
git commit -m "feat: implement notification diff engine and watcher hook"
```

---

### Task 6: Settings Modal Notification Preferences & Permission Prompt

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `settings.notifications: NotificationSettings`
- Produces: Toggle switches for desktop notifications and granular event triggers.

- [ ] **Step 1: Write failing tests in `src/components/SettingsModal.test.tsx`**

```typescript
it('toggles desktop notifications and specific event checkboxes', () => {
  render(<SettingsModal isOpen={true} onClose={vi.fn()} settings={DEFAULT_SETTINGS} onSave={vi.fn()} />);
  expect(screen.getByText(/Desktop Notifications/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/SettingsModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `src/components/SettingsModal.tsx`**

Add Desktop Notification switches, permission status indicator, and trigger checkboxes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx src/components/SettingsModal.test.tsx
git commit -m "feat: add notification preferences and permission prompt in settings modal"
```

---

### Task 7: Full App Integration & End-to-End Verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Integrates `useNotificationWatcher`, `TeamWorkloadPopover` reviewer filtering, size badge rendering, and settings persistence.

- [ ] **Step 1: Update integration tests in `src/App.test.tsx`**

Test reviewer filter selection and notification watcher hook integration.

- [ ] **Step 2: Update `src/App.tsx`**

- [ ] **Step 3: Run entire test suite and production build**

Run: `npm test && npm run build`
Expected: 100% tests passing, clean Vite production build.

- [ ] **Step 4: Commit and push**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: integrate reviewer workload filter and notification watcher in app"
```
