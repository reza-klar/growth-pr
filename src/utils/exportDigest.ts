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
      const lastUser = pr.lastInteraction?.user?.login || pr.author.login;
      const safeTitle = pr.title.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
      md += `- [#${pr.number} ${safeTitle}](${pr.url}) by @${pr.author.login} (${statusIcon}, 💬 ${pr.totalCommentsCount} comments, last active: @${lastUser})\n`;
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
      const lastUser = pr.lastInteraction?.user?.login || pr.author.login;
      const safeTitle = pr.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      text += `• <${pr.url}|#${pr.number} ${safeTitle}> - by @${pr.author.login} ${statusEmoji} (💬 ${pr.totalCommentsCount} | Last: @${lastUser})\n`;
    });
    text += '\n';
  });

  return text.trim();
}
