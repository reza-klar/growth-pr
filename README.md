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
