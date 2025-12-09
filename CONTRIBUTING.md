# Contributing to Complaint Management System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/CMSS.git
   cd CMSS
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/CMSS.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Branch Types

```
main/              - Production-ready code (tagged releases)
  └─ develop/     - Integration branch for features
       └─ feature/ - Individual feature branches
       └─ bugfix/  - Bug fix branches
       └─ hotfix/  - Emergency production fixes
```

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/complaint-filtering

# Work on your feature
# Commit changes with proper messages
# Push to your fork
git push origin feature/complaint-filtering
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes

### Examples

**Feature commit:**
```
feat(api): add complaint filtering by status

Implement filtering functionality to allow users to view complaints
by their current status (open, in_progress, resolved, closed).

Closes #42
```

**Bug fix:**
```
fix(database): resolve connection timeout issue

Increase connection timeout from 5s to 20s for slower networks.
Implements exponential backoff for retry logic.

Fixes #89
```

**Documentation update:**
```
docs: update API endpoints in README
```

## Pull Request Process

1. **Before Creating a PR**
   - Ensure your branch is up to date with develop
   - Run tests locally: `npm test`
   - Run linter: `npm run lint`
   - Add tests for new features

2. **Create a Pull Request**
   - Use the PR template provided
   - Give a clear, descriptive title
   - Reference related issues (#issue-number)
   - Provide context and explanation

3. **PR Title Format**
   ```
   [FEATURE] Add complaint filtering by status
   [BUGFIX] Fix database connection timeout
   [DOCS] Update API documentation
   [REFACTOR] Simplify complaint validation logic
   ```

4. **Review Process**
   - Minimum 2 approvals required
   - All CI checks must pass
   - Address feedback promptly
   - Keep PR focused (one feature per PR)

5. **Merging**
   - Use "Squash and merge" for feature branches
   - Use "Create a merge commit" for develop → main
   - Delete branch after merging
   - Update version numbers if applicable

## Code Style

### JavaScript/Node.js

- Use ES6+ syntax
- Use semicolons
- Use 2-space indentation
- Use const/let instead of var
- Use meaningful variable names

```javascript
// Good
const getUserComplaints = (userId) => {
  return complaints.filter(c => c.userId === userId);
};

// Bad
var getComplaints = function (id) {
  return complaints.filter(function(c) {
    return c.userId == id;
  });
};
```

### File Naming

- Use camelCase for JavaScript files: `complaintController.js`
- Use kebab-case for config files: `database-config.json`
- Use UPPERCASE for constants: `MAX_RETRIES`

### Comments

```javascript
// Use comments for why, not what
// Good: This retry logic helps with slow network connections
if (retries < MAX_RETRIES) { ... }

// Bad: Increment retries
retries++;
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- complaintController.test.js

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests alongside code
- Test happy path and edge cases
- Use descriptive test names
- Aim for >80% code coverage

```javascript
describe('getComplaints', () => {
  it('should return complaints for valid user', () => {
    const result = getComplaints(123);
    expect(result).toHaveLength(5);
  });

  it('should return empty array for user with no complaints', () => {
    const result = getComplaints(999);
    expect(result).toEqual([]);
  });
});
```

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest develop
git fetch upstream
git rebase upstream/develop

# Resolve conflicts in your editor
git add <resolved-files>
git rebase --continue
git push --force-with-lease origin feature/your-feature
```

### Undo Recent Commits

```bash
# Undo last commit (keep changes)
git reset HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit
git commit --amend --no-edit
```

## Getting Help

- Open an issue for questions
- Check existing issues and PRs first
- Provide context and examples
- Be patient and respectful

---

**Thank you for contributing! 🎉**
