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
