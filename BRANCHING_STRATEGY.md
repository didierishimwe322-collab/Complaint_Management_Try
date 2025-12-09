# Git Branching Strategy

This document outlines the branching strategy used in the Complaint Management System project.

## Overview

We use a modified Git Flow strategy with three main branch categories:

1. **main** - Production-ready code
2. **develop** - Integration branch for features
3. **feature/*** - Individual feature branches

## Branch Structure

```
main (production)
  ├── v1.0.0
  ├── v1.0.1
  └── v1.1.0

develop (staging)
  ├── feature/complaint-filtering
  ├── feature/user-authentication
  ├── bugfix/database-timeout
  └── hotfix/critical-bug
```

## Branch Types

### 1. Main Branch (`main`)

**Purpose**: Production-ready code
**Rules**:
- Protected branch
- All code must be tested and reviewed
- Tagged with version numbers (v1.0.0, v1.1.0)
- Only merges from develop or hotfix branches
- Requires all CI checks to pass

**Naming**: `main` (no suffix)

**Creation**: Initial commit only

**Deletion**: Never deleted

### 2. Develop Branch (`develop`)

**Purpose**: Integration branch for features
**Rules**:
- Protected branch
- Receives feature, bugfix, and hotfix branches
- Staging environment deployment
- Requires code review before merge
- All CI checks must pass

**Naming**: `develop` (no suffix)

**Creation**: Branched from main at project start

**Deletion**: Never deleted

### 3. Feature Branches (`feature/*`)

**Purpose**: New features and enhancements
**Rules**:
- Branch from: `develop`
- Merge back to: `develop`
- Naming: `feature/description-in-kebab-case`
- Example: `feature/complaint-filtering`, `feature/export-to-pdf`
- Lifetime: Temporary (deleted after merge)
- Requires: Pull request with 2 approvals

**Creation**:
```bash
git checkout develop
git pull upstream develop
git checkout -b feature/complaint-filtering
```

**Deletion**:
```bash
# After merge
git branch -d feature/complaint-filtering
git push upstream --delete feature/complaint-filtering
```

### 4. Bugfix Branches (`bugfix/*`)

**Purpose**: Bug fixes for current development
**Rules**:
- Branch from: `develop`
- Merge back to: `develop`
- Naming: `bugfix/description-in-kebab-case`
- Example: `bugfix/database-connection-timeout`
- Lifetime: Temporary
- Requires: Pull request with 1 approval

**Creation**:
```bash
git checkout develop
git pull upstream develop
git checkout -b bugfix/database-timeout
```

### 5. Hotfix Branches (`hotfix/*`)

**Purpose**: Emergency fixes for production issues
**Rules**:
- Branch from: `main`
- Merge back to: `main` AND `develop`
- Naming: `hotfix/description-in-kebab-case`
- Example: `hotfix/critical-security-issue`
- Lifetime: Temporary
- Requires: Immediate review and merge

**Creation**:
```bash
git checkout main
git pull upstream main
git checkout -b hotfix/critical-bug
```

**Merge process**:
```bash
# Merge to main first
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Release version 1.0.1"
git push upstream main

# Then merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug
git push upstream develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
git push upstream --delete hotfix/critical-bug
```

## Workflow Examples

### Adding a New Feature

```bash
# 1. Update develop
git checkout develop
git pull upstream develop

# 2. Create feature branch
git checkout -b feature/user-dashboard

# 3. Make changes and commit
git add .
git commit -m "feat(ui): add user dashboard with charts"

# 4. Push to fork
git push origin feature/user-dashboard

# 5. Create pull request on GitHub
# Title: [FEATURE] Add user dashboard with charts
# Description: Use template provided

# 6. After approval and merge
git checkout develop
git pull upstream develop
git branch -d feature/user-dashboard
git push origin --delete feature/user-dashboard
```

### Fixing a Bug

```bash
# 1. Update develop
git checkout develop
git pull upstream develop

# 2. Create bugfix branch
git checkout -b bugfix/complaint-search-error

# 3. Make changes and commit
git add .
git commit -m "fix(api): resolve complaint search filtering issue"

# 4. Push and create PR
git push origin bugfix/complaint-search-error

# 5. After merge, clean up
git checkout develop
git pull upstream develop
git branch -d bugfix/complaint-search-error
git push origin --delete bugfix/complaint-search-error
```

### Emergency Hotfix

```bash
# 1. Create from main
git checkout main
git pull upstream main
git checkout -b hotfix/security-patch

# 2. Fix the issue
git add .
git commit -m "fix(security): patch vulnerability in auth"

# 3. Merge to main and tag
git checkout main
git merge --no-ff hotfix/security-patch
git tag -a v1.0.2 -m "Release v1.0.2 - Security patch"
git push upstream main
git push upstream v1.0.2

# 4. Merge to develop
git checkout develop
git merge --no-ff hotfix/security-patch
git push upstream develop

# 5. Clean up
git branch -d hotfix/security-patch
git push upstream --delete hotfix/security-patch
```

## Best Practices

### Keeping Branches Updated

```bash
# Before pushing, sync with upstream
git fetch upstream
git rebase upstream/develop

# Or if already pushed
git fetch upstream
git rebase upstream/develop
git push --force-with-lease origin feature/your-feature
```

### Interactive Rebase for Clean History

```bash
# Before merge, clean up commits
git rebase -i upstream/develop

# Squash related commits, fix typos, organize logically
```

### Never Force Push to Protected Branches

```bash
# Safe: force push to your fork
git push --force-with-lease origin feature/your-feature

# Unsafe: never do this to upstream
git push --force upstream develop  # ❌ Don't do this!
```

## Branch Protection Rules

### main branch
- ✅ Require pull request reviews (2 minimum)
- ✅ Require status checks to pass (CI/CD)
- ✅ Require branches to be up to date
- ✅ Dismiss stale PR approvals
- ✅ Restrict who can push to matching branches

### develop branch
- ✅ Require pull request reviews (1 minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Allow force pushes to administrators only

## Version Tagging

```bash
# Create version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to repository
git push upstream v1.0.0

# List all tags
git tag -l

# Delete tag locally and remotely
git tag -d v1.0.0
git push upstream :refs/tags/v1.0.0
```

---

**Last Updated**: 2024
**Strategy**: Git Flow Variant
**Maintained By**: Development Team
