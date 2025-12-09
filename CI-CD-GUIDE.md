# CI/CD Pipeline Guide

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automates testing, building, and notification processes.

## Pipeline Stages

### 1. Lint & Code Quality
- **Tool**: ESLint + Prettier
- **Triggers**: Push, Pull Request
- **Purpose**: Ensure code standards and consistency
- **Failure**: Blocks further stages (continue-on-error allows warnings)

### 2. Test Suite
- **Tool**: Jest
- **Coverage**: 70% threshold
- **Database**: MySQL 8.0 service container
- **Reports**: Uploaded to Codecov
- **Failure**: Blocks build stage

### 3. Build & Push
- **Tool**: Docker Buildx
- **Registry**: GitHub Container Registry (GHCR)
- **Multi-stage**: Optimized for size
- **Caching**: GitHub Actions cache
- **Triggers**: Only on main/develop push

### 4. Security Scan
- **Tools**: npm audit, Snyk
- **Severity**: High and above
- **Continues**: Non-blocking

### 5. Notifications
- **Slack**: Real-time webhook notifications
- **Email**: On failure
- **Status**: Summary of all jobs

## Setup Instructions

### Slack Notifications

1. **Create Slack Webhook**:
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Enable Incoming Webhooks
   - Create webhook URL
   - Copy webhook URL

2. **Add Secret**:
   ```bash
   Settings → Secrets and Variables → Actions → New Repository Secret
   Name: SLACK_WEBHOOK_URL
   Value: <your-webhook-url>
   ```

### Email Notifications

1. **Add Secrets**:
   ```
   EMAIL_SERVER: smtp.gmail.com
   EMAIL_PORT: 587
   EMAIL_USERNAME: your-email@gmail.com
   EMAIL_PASSWORD: your-app-password
   EMAIL_RECIPIENT: team@example.com
   ```

2. **For Gmail**: Use App Password, not regular password

### Snyk Integration

1. **Create Snyk Account**: https://snyk.io/
2. **Get API Token**: Account → API Token
3. **Add Secret**:
   ```
   SNYK_TOKEN: <your-snyk-token>
   ```

## Running Tests Locally

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

## Test Coverage

- **Unit Tests**: Individual function/endpoint testing
- **Integration Tests**: Complete workflow testing
- **Target Coverage**: 70% (configurable in jest.config.js)

## Docker Build

```bash
# Build locally
docker build -t complaint-management-system:latest .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  complaint-management-system:latest

# Build with docker-compose
docker-compose up -d
```

## GitHub Actions Secrets

Required secrets for full functionality:

| Secret | Description | Required |
|--------|-------------|----------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | No |
| `SNYK_TOKEN` | Snyk security scanning | No |
| `EMAIL_SERVER` | SMTP server address | No |
| `EMAIL_PORT` | SMTP port (usually 587) | No |
| `EMAIL_USERNAME` | SMTP username | No |
| `EMAIL_PASSWORD` | SMTP password/app-password | No |
| `EMAIL_RECIPIENT` | Email to receive failure notifications | No |

## Troubleshooting

### Tests Failing

1. **Check database connection**:
   - Ensure MySQL is running
   - Verify environment variables

2. **Clear cache**:
   - Delete `node_modules` and reinstall
   - Clear npm cache: `npm cache clean --force`

3. **Debug mode**:
   - Run: `npm test -- --verbose`
   - Check GitHub Actions logs

### Docker Build Failures

1. **Layer caching issues**:
   - Check if base image is available
   - Rebuild with: `docker build --no-cache .`

2. **Permission issues**:
   - Ensure Dockerfile user permissions are correct
   - Check file ownership

### Notification Issues

1. **Slack not sending**:
   - Verify webhook URL is correct
   - Check Slack workspace permissions
   - Test webhook manually

2. **Email not sending**:
   - Use app-specific passwords for Gmail
   - Verify SMTP settings
   - Check spam folder

## Best Practices

1. **Commit Messages**: Follow conventional commits
   ```
   feat(api): add new endpoint
   fix(database): resolve connection issue
   ```

2. **Pull Requests**: 
   - Wait for all checks to pass
   - Address review comments
   - Keep PR focused and small

3. **Testing**:
   - Write tests before code (TDD)
   - Aim for >80% coverage
   - Test edge cases and errors

4. **Docker**:
   - Use specific base image tags (not `latest`)
   - Keep images small with multi-stage builds
   - Use .dockerignore to exclude unnecessary files

## Monitoring

- **GitHub Actions**: repository → Actions tab
- **Codecov**: codecov.io dashboard
- **Docker Registry**: ghcr.io or Docker Hub
- **Slack**: Channel notifications in real-time

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Jest Documentation](https://jestjs.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Snyk Security](https://snyk.io/docs/)
