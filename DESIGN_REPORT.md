# Complaint Management System — Design Report (Compliments Feature)

Author: <Your Name>  
Date: <date>

Overview (short)
This document describes the addition of a "Compliments" feature to the existing Complaint Management System (CMSS). The goal is to let users send and manage short appreciation notes (compliments) to colleagues or services. The design covers API endpoints, database schema, UI suggestions, testing, rollout strategy (rolling update/blue-green), and resource sizing. The document is suitable for submission and implementation reference.

Table of contents
1. Goals and scope
2. Architecture overview
3. Data model
4. API specification
5. UI / UX design suggestions
6. Testing plan
7. Deployment & CI/CD changes
8. Resource calculation & monitoring
9. Appendix — example flows and curl commands

1. Goals and scope
- Feature: Create, list, view, update, and delete compliments.
- Lightweight records: message, sender, recipient, category, timestamp.
- Non-blocking deployment: add endpoints without downtime, fully backwards-compatible.
- Security: validate inputs, avoid injection by using parameterized DB queries (existing mysql2 usage).
- UX: simple form to send a compliment and a feed to view them.

2. Architecture overview
- Backend: Existing Express app (index.js). New compliments endpoints live under /api/compliments.
- Database: MySQL table compliments, created at startup if absent.
- Frontend: Minimal addition to existing UI (public/) — a "Send compliment" form and a "Compliments feed" page.
- CI/CD: Use existing build & deploy pipelines. Add smoke tests for compliments endpoints.

Diagram (textual)
- Developer -> GitHub -> CI (lint, test, build image) -> Registry (GHCR/Docker Hub) -> Kubernetes -> Pods (app + MySQL)
- Traffic -> Service -> Deployment -> Pod(s) exposing /api and /health
- HPA monitors CPU and scales pods

3. Data model
Table: compliments
- id INT PK AUTO_INCREMENT
- compliment_id VARCHAR(50) UNIQUE NOT NULL (human-friendly generated id)
- message TEXT NOT NULL
- sender VARCHAR(255) NULL
- recipient VARCHAR(255) NOT NULL
- category VARCHAR(100) NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Rationale
- compliment_id to allow external refs and better privacy (no numeric id leaks)
- TEXT for message to allow longer notes
- recipient required to ensure messages are addressed

4. API specification
Base path: /api/compliments

- GET /api/compliments
  - Query params: category (optional), recipient (optional)
  - Response: array of compliment objects, ordered by created_at desc

- GET /api/compliments/:id
  - Path param: id (numeric id or compliment_id)
  - Response: compliment object or 404

- POST /api/compliments
  - Body (JSON): { message: string, sender?: string, recipient: string, category?: string }
  - Validation: message and recipient required
  - Response: 201 with created record info

- PUT /api/compliments/:id
  - Body: any of { message, sender, recipient, category }
  - Response: 200 or 404

- DELETE /api/compliments/:id
  - Response: 200 or 404

Error format (consistent with existing APIs)
{ "error": "message" }

Security & validation
- Use parameterized queries (mysql2 execute) to prevent SQL injection.
- Limit message length at application layer (e.g., 1000 chars).
- Optional: rate limit POST to prevent spam.

5. UI / UX design suggestions (mockup)
- Page: "Compliments"
  - Top: "Send a compliment" card with fields:
    - Recipient (text/select)
    - Sender (text, optional)
    - Category (select: Teamwork, Service, Helpfulness, Other)
    - Message (textarea, 1-1000 chars)
    - Button: Send (validate client-side)
  - Below: "Recent compliments" feed
    - Each item: message, recipient, sender (if present), timestamp, category tag
    - Actions for admins: edit / delete
- UX considerations
  - Show toast on success/failure
  - Use optimistic UI updates to show compliment immediately, then reconcile with backend
  - Accessibility: form labels, focus states, keyboard navigation

6. Testing plan
- Unit tests (Jest) for:
  - Compliment ID generator (format)
  - Input validation functions (message length, required fields)
- Integration tests (Supertest):
  - POST creates record, GET returns it
  - PUT updates fields, DELETE removes
  - List filters by recipient and category
- Smoke tests in CI:
  - After deployment, hit /health and a few compliment endpoints using the test image
- Load tests (optional):
  - Simulate concurrent POSTs to validate DB & app behavior

Example tests (commands)
- npm test
- Example Supertest-based flow (already used in repo for complaints)

7. Deployment & CI/CD changes
- No breaking changes to API paths. Deploy new image via:
  - Rolling update: kubectl set image deployment/cmss-deployment cmss=<image:tag>
  - Blue-green: deploy new instance (suffix) and switch Service selector
- Add smoke test step to CD workflow to validate /api/compliments after rollout.
- DB migration strategy:
  - Current approach: create table at startup if not exists (safe for this small schema).
  - For production, use versioned migrations (Flyway/Knex/etc).

8. Resource calculation & monitoring
Per-pod requests (proposed)
- cpu request: 250m (0.25 vCPU)
- memory request: 256Mi
- limits: cpu 500m, memory 512Mi

Sizing example
- 2 replicas baseline → CPU requests = 0.5 vCPU, Memory = 512Mi
- If expecting 100 RPS sustained with DB operations, consider 4-6 replicas and larger DB connections.

Monitoring
- Add metrics for:
  - /health response time
  - API latency (95th percentile)
  - Error rate for compliments endpoints
  - DB connection count and slow queries
- Alerts:
  - Pod restarts > 3 in 5m
  - Error rate > 5% for 5m
  - CPU > 80% for 5m

9. Appendix — example curl flows
Create compliment:
curl -X POST http://localhost:3000/api/compliments -H "Content-Type: application/json" -d '{"message":"Great job on the presentation!","sender":"Alice","recipient":"Bob","category":"Teamwork"}'

List compliments:
curl http://localhost:3000/api/compliments

Get single:
curl http://localhost:3000/api/compliments/COMP-LT-159...  # or numeric id

Update:
curl -X PUT http://localhost:3000/api/compliments/1 -H "Content-Type: application/json" -d '{"message":"Updated message"}'

Delete:
curl -X DELETE http://localhost:3000/api/compliments/1

Closing notes
- The compliments feature is intentionally lightweight and reuses existing patterns from complaints endpoints. For production readiness consider: authentication, audit logs, richer UI flows, and migration tooling.
- Use this design doc as the 4–5 page submission; export to PDF if required.

