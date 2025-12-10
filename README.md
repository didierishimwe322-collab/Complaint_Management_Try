# Complaint Management System (CMSS)

A comprehensive Node.js and Express-based system for managing customer complaints with tracking, prioritization, and resolution workflows.

## Features

- **Complaint Registration**: Register new complaints with customer information
- **Status Tracking**: Track complaint status (open, in_progress, resolved, closed)
- **Priority Levels**: Assign priority levels (low, medium, high, critical)
- **Categorization**: Organize complaints by category
- **Assignment**: Assign complaints to staff members
- **Resolution Notes**: Document resolution process and notes
- **Statistics**: View complaint metrics and statistics
- **Filtering**: Filter complaints by status, priority, and category

## Prerequisites

- Node.js >= 14.0.0
- MySQL >= 8.0
- Docker and Docker Compose (optional)

## Installation

### Local Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=complaint_management_system
   PORT=3000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Docker Setup

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the application at `http://localhost:8001`

## API Endpoints

### Complaints

- `GET /api/complaints` - Retrieve all complaints (with optional filters)
- `GET /api/complaints/:id` - Get a specific complaint
- `POST /api/complaints` - Register a new complaint
- `PUT /api/complaints/:id` - Update a complaint
- `DELETE /api/complaints/:id` - Delete a complaint

### Statistics

- `GET /api/complaints-stats` - Get complaint statistics

### Health Check

- `GET /health` - Health check endpoint

## Complaint Object Schema

```json
{
  "id": 1,
  "complaint_id": "COMP-1234567890-123",
  "title": "Product Quality Issue",
  "description": "Detailed complaint description",
  "category": "Product Quality",
  "status": "open",
  "priority": "high",
  "assigned_to": "John Doe",
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "customer_phone": "+1234567890",
  "resolution_notes": "Notes about resolution",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "resolved_at": null
}
```

## Environment Variables

- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: complaint_management_system)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment type (development/production)

## Development

Run development server with auto-reload:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

## License

MIT

# Complaint Management System — CI/CD Report Template

Use this document as the base for your Phase 1–5 report. Fill in each section with screenshots, configuration snippets, and explanations. Aim for clarity and keep the final PDF <= 10 pages.

1. Title page
- Project: Complaint Management System
- Author: <Your Name>
- Course / Assignment: DevOps Assignment
- Date: <date>
- Repository URL: <git repo link>

2. Abstract (max 200 words)
- Short summary of the app, objectives, and what the pipeline achieves.

3. Architecture Diagram (1 page)
- Include a diagram showing:
  - Developer -> Git (GitHub)
  - CI (GitHub Actions) steps: lint -> test -> build -> push
  - Registry (GHCR / Docker Hub)
  - Runtime: Docker container, MySQL service (or Kubernetes)
  - Monitoring: Prometheus / Grafana, Alerting channel (Slack/email)
- Attach PNG/SVG exported from draw.io / Lucidchart.

4. Tools and Versions (brief table)
- GitHub Actions — (version)
- Docker — (version)
- Node.js — 18.x
- MySQL — 8.x
- Jest — 29.x
- ESLint / Prettier — versions
- Prometheus / Grafana — versions (if used)

5. Phase-by-phase details
- Phase 1 — Plan
  - Requirements
  - Chosen architecture and justification
- Phase 2 — Code
  - Repo layout (list important files)
    - index.js — API
    - package.json — scripts & deps
    - Dockerfile — optimized multi-stage
    - .github/workflows/ci-cd.yml — CI pipeline
    - jest.config.js, tests/** — tests
  - Key code snippets and reasoning
- Phase 3 — Build
  - CI job that builds Docker image (reference workflow file)
  - Dockerfile explanation (multi-stage, minimal base, non-root user, healthcheck)
  - Container size optimizations and final image size (measured)
- Phase 4 — Test
  - Unit tests + integration tests (tooling: Jest + Supertest)
  - How tests run in CI (service containers for MySQL)
  - Test coverage target and how to view reports
  - Feedback mechanism (Slack webhook + email step)
- Phase 5 — Release
  - Versioning strategy (semantic versioning; use standard-version or git tag)
  - Workflow for tag-based releases (build & push image, create GitHub Release)
  - Registry used (GHCR or Docker Hub) and required secrets

6. Resource calculation (example table)
- Provide estimated resources for running one instance:
  - Container image size: ~X MB
  - CPU: 0.25 vCPU (baseline)
  - Memory: 256 MB (baseline)
  - Storage: DB volume 1 GB
- Example scaling plan:
  - 1 replica: handles ~50 RPS
  - Add replicas when CPU > 70% or response latency increases

7. Monitoring & Scaling
- What to monitor:
  - Application health (/health), response latency, error rate, DB connections, container CPU/memory
- Prometheus metrics & Grafana dashboard screenshots
- Alerting rules (example):
  - Alert if instance_down for 2m -> send Slack
  - Alert if CPU > 80% for 3m -> scale up
- Autoscaling approach (Kubernetes HPA or Docker service scale)

8. Screenshots / Evidence
- CI run showing lint, tests, build, and notifications
- Docker image in registry (image tags)
- Application /health response
- Grafana dashboard and alert notification

9. How to reproduce locally (commands)
- Clone and install:
  - git clone <repo>
  - cd CMSS
  - npm install
- Run locally:
  - npm run dev
- Run tests:
  - npm test
- Build Docker image:
  - docker build -t complaint-management-system:latest .
- Run with compose:
  - docker compose up --build
- Create release tag:
  - npm run release (if using standard-version) OR
  - git tag -a vX.Y.Z -m "release vX.Y.Z" && git push origin vX.Y.Z

10. Checklist for submission
- [ ] PDF report (<=10 pages) with architecture diagram, screenshots, resource table
- [ ] Git repository link with all code, Dockerfile, CI/CD configs
- [ ] Evidence of container pushed to registry (image name / tag)
- [ ] Monitoring screenshots and alert config
- [ ] README with reproduction steps

11. Appendix — Important snippets
- Example CI command to run tests:
  - npm ci && npm test -- --coverage
- Example Dockerfile notes:
  - Use multi-stage
  - Use alpine base image
  - Remove dev deps from production layer
- Example Git release flow:
  - npm run release
  - git push --follow-tags origin main

Notes and tips
- Keep screenshots labelled and compressed; include captions.
- Put long logs or raw configs in the repository under /docs and refer to them from the report.
- Be explicit about secrets you used (do NOT include actual secrets in the report).
- For grading, highlight any improvements you made (e.g., tests, container size reduction, auto-scaling logic).

End of template — fill sections and export as PDF for Moodle submission.
