export type ReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | 'DRAFT';
export type CIStatus = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'NEUTRAL';
export type SLAStatus = 'normal' | 'warning' | 'stale';

export type PRSizeCategory = 'XS' | 'S' | 'M' | 'L' | 'XL';

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
  additions?: number;
  deletions?: number;
  sizeCategory?: PRSizeCategory;
}

export interface ReviewerWorkload {
  login: string;
  avatarUrl: string;
  pendingReviewsCount: number;
}

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
  notifications: NotificationSettings;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
  used: number;
}

export interface FetchPRsResult {
  prs: PullRequestItem[];
  rateLimit: RateLimitInfo;
  warnings: string[];
}

export type FilterPreset = 'all' | 'waiting_on_me' | 'authored_by_me' | 'needs_review' | 'ready_to_merge';
export type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'comments_desc' | 'stale_desc';

