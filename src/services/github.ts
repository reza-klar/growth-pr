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
        pullRequests(first: 35, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
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
            reviewRequests(first: 10) {
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
            comments(last: 1) {
              totalCount
              nodes {
                createdAt
                author {
                  login
                  avatarUrl
                  url
                }
                bodyText
              }
            }
            reviews(last: 1) {
              totalCount
              nodes {
                createdAt
                author {
                  login
                  avatarUrl
                  url
                }
                bodyText
                state
              }
            }
            participants(first: 10) {
              nodes {
                login
                avatarUrl
                url
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
    .filter(Boolean)
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
  const cleanToken = token.trim();
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
      Authorization: `Bearer ${cleanToken}`,
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

export function normalizeRepoName(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^git@github\.com:/, '');
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//, '');
  cleaned = cleaned.replace(/^github\.com\//, '');
  cleaned = cleaned.replace(/\.git$/, '');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');
  return cleaned;
}

const CHUNK_SIZE = 5;

export async function fetchRepoPRs(
  token: string,
  repositories: string[],
  currentUserLogin?: string
): Promise<{ prs: PullRequestItem[]; rateLimit: RateLimitInfo; warnings: string[] }> {
  const cleanToken = token.trim();
  const validRepos = repositories
    .map(normalizeRepoName)
    .filter((r) => {
      const parts = r.split('/');
      return parts.length === 2 && Boolean(parts[0]) && Boolean(parts[1]);
    });

  if (validRepos.length === 0) {
    return {
      prs: [],
      rateLimit: { limit: 5000, remaining: 5000, resetAt: new Date().toISOString(), used: 0 },
      warnings: [],
    };
  }

  // Chunk repositories into groups of CHUNK_SIZE to prevent exceeding GraphQL complexity limits
  const chunks: string[][] = [];
  for (let i = 0; i < validRepos.length; i += CHUNK_SIZE) {
    chunks.push(validRepos.slice(i, i + CHUNK_SIZE));
  }

  let latestRateLimit: RateLimitInfo = {
    limit: 5000,
    remaining: 5000,
    resetAt: new Date().toISOString(),
    used: 0,
  };
  let viewerLogin = currentUserLogin;
  const rawPRs: any[] = [];
  const warningsSet = new Set<string>();

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const query = buildBatchedGraphQLQuery(chunk);
        const res = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
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
          warningsSet.add(`Failed to load repositories [${chunk.join(', ')}]: ${errMsg}`);
          return null;
        }

        return await res.json();
      } catch (fetchErr: any) {
        warningsSet.add(`Network load error for [${chunk.join(', ')}]: ${fetchErr.message || 'Load failed'}`);
        return null;
      }
    })
  );

  for (const payload of results) {
    if (!payload) continue;

    if (payload.errors && payload.errors.length > 0) {
      console.warn('GraphQL partial error encountered for chunk:', payload.errors);
      payload.errors.forEach((err: any) => {
        if (err.message) {
          warningsSet.add(err.message);
        }
      });
    }

    if (!viewerLogin && payload.data?.viewer?.login) {
      viewerLogin = payload.data.viewer.login;
    }

    if (payload.data?.rateLimit) {
      latestRateLimit = payload.data.rateLimit;
    }

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
  }

  const prs = rawPRs.map((node) => transformGraphQLPR(node, viewerLogin));
  return { prs, rateLimit: latestRateLimit, warnings: Array.from(warningsSet) };
}

export function transformGraphQLPR(node: any, viewerLogin?: string): PullRequestItem {
  const totalCommentsCount =
    (node.comments?.totalCount || 0) + (node.reviews?.totalCount || 0);

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
      avatarUrl: node.author?.avatarUrl || `https://github.com/${node.author?.login || 'ghost'}.png`,
      url: node.author?.url || `https://github.com/${node.author?.login || 'ghost'}`,
    },
    type: 'commit',
    createdAt: node.createdAt || new Date().toISOString(),
  };

  const lastComment = node.comments?.nodes?.[0];
  const lastReview = node.reviews?.nodes?.[0];

  const commentTime = lastComment?.createdAt ? new Date(lastComment.createdAt).getTime() : 0;
  const reviewTime = lastReview?.createdAt ? new Date(lastReview.createdAt).getTime() : 0;

  if (commentTime > 0 && commentTime >= reviewTime && lastComment?.author) {
    lastInteraction = {
      user: {
        login: lastComment.author.login,
        avatarUrl: lastComment.author.avatarUrl || `https://github.com/${lastComment.author.login}.png`,
        url: lastComment.author.url || `https://github.com/${lastComment.author.login}`,
      },
      type: 'comment',
      createdAt: lastComment.createdAt,
      snippet: lastComment.bodyText?.slice(0, 80),
    };
  } else if (reviewTime > 0 && reviewTime > commentTime && lastReview?.author) {
    lastInteraction = {
      user: {
        login: lastReview.author.login,
        avatarUrl: lastReview.author.avatarUrl || `https://github.com/${lastReview.author.login}.png`,
        url: lastReview.author.url || `https://github.com/${lastReview.author.login}`,
      },
      type: 'review',
      createdAt: lastReview.createdAt,
      snippet: lastReview.bodyText?.slice(0, 80),
    };
  } else if (node.timelineItems?.nodes) {
    const timelineItems = node.timelineItems.nodes;
    for (let i = timelineItems.length - 1; i >= 0; i--) {
      const item = timelineItems[i];
      if (!item) continue;
      if (item.__typename === 'IssueComment' && item.author) {
        lastInteraction = {
          user: {
            login: item.author.login,
            avatarUrl: item.author.avatarUrl || `https://github.com/${item.author.login}.png`,
            url: item.author.url || `https://github.com/${item.author.login}`,
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
            avatarUrl: item.author.avatarUrl || `https://github.com/${item.author.login}.png`,
            url: item.author.url || `https://github.com/${item.author.login}`,
          },
          type: 'review',
          createdAt: item.createdAt,
          snippet: item.bodyText?.slice(0, 80),
        };
        break;
      }
    }
  }

  // SLA Staleness
  const lastActiveTime = new Date(lastInteraction.createdAt || node.updatedAt || node.createdAt).getTime();
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

  const isWaitingOnMe = Boolean(viewerLogin && requestedReviewers.includes(viewerLogin));
  const isAuthoredByMe = Boolean(viewerLogin && node.author?.login === viewerLogin);

  return {
    id: node.id || '',
    number: node.number || 0,
    title: node.title || '',
    url: node.url || '',
    repository: node.repository || { nameWithOwner: '', url: '' },
    author: {
      login: node.author?.login || 'unknown',
      avatarUrl: node.author?.avatarUrl || `https://github.com/${node.author?.login || 'ghost'}.png`,
      url: node.author?.url || `https://github.com/${node.author?.login || 'ghost'}`,
    },
    createdAt: node.createdAt || new Date().toISOString(),
    updatedAt: node.updatedAt || new Date().toISOString(),
    isDraft: Boolean(node.isDraft),
    baseRefName: node.baseRefName || '',
    headRefName: node.headRefName || '',
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
