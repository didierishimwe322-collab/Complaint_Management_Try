# Complaint Management System - API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Complaints Endpoints

### 1. GET All Complaints
```
GET /complaints?status=open&priority=high&category=Product
```
**Query Parameters:**
- `status` (optional): `open`, `in_progress`, `resolved`, `closed`
- `priority` (optional): `low`, `medium`, `high`, `critical`
- `category` (optional): Filter by category name

**Response:**
```json
[
  {
    "id": 1,
    "complaint_id": "COMP-1234567890-123",
    "title": "Product Quality Issue",
    "description": "The product broke after one week",
    "category": "Product Quality",
    "status": "open",
    "priority": "high",
    "assigned_to": "John Doe",
    "customer_name": "Jane Smith",
    "customer_email": "jane@example.com",
    "customer_phone": "+1234567890",
    "resolution_notes": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "resolved_at": null
  }
]
```

### 2. GET Single Complaint
```
GET /complaints/:id
```
**Parameters:**
- `id` (required): Complaint ID (numeric) or complaint_id (string)

**Response:** Single complaint object

### 3. CREATE Complaint
```
POST /complaints
Content-Type: application/json

{
  "title": "Service Issue",
  "description": "The service is not working properly",
  "category": "Service",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "priority": "high"
}
```
**Required Fields:**
- `title`
- `description`
- `category`
- `customer_name`

**Optional Fields:**
- `customer_email`
- `customer_phone`
- `priority` (default: `medium`)

**Response:**
```json
{
  "id": 2,
  "complaint_id": "COMP-1234567891-456",
  "title": "Service Issue",
  "description": "The service is not working properly",
  "category": "Service",
  "status": "open",
  "priority": "high",
  "message": "Complaint registered successfully"
}
```

### 4. UPDATE Complaint
```
PUT /complaints/:id
Content-Type: application/json

{
  "status": "in_progress",
  "assigned_to": "Jane Smith",
  "priority": "critical",
  "resolution_notes": "Started investigating the issue"
}
```
**Parameters:**
- `id` (required): Complaint ID

**Optional Fields:**
- `title`
- `description`
- `category`
- `status`
- `priority`
- `assigned_to`
- `resolution_notes`

**Response:**
```json
{
  "message": "Complaint updated successfully"
}
```

### 5. DELETE Complaint
```
DELETE /complaints/:id
```
**Parameters:**
- `id` (required): Complaint ID

**Response:**
```json
{
  "message": "Complaint deleted successfully"
}
```

### 6. GET Complaint Statistics
```
GET /complaints-stats
```
**Response:**
```json
{
  "total": 45,
  "open_count": 12,
  "in_progress_count": 8,
  "resolved_count": 20,
  "closed_count": 5
}
```

---

## Categories Endpoints

### 1. GET All Categories
```
GET /categories
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Product Quality",
    "description": "Issues related to product quality",
    "color": "#FF0000",
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-10T08:00:00Z"
  }
]
```

### 2. GET Single Category
```
GET /categories/:id
```
**Parameters:**
- `id` (required): Category ID

**Response:** Single category object

### 3. CREATE Category
```
POST /categories
Content-Type: application/json

{
  "name": "Billing Issue",
  "description": "Issues related to billing and invoicing",
  "color": "#0000FF"
}
```
**Required Fields:**
- `name`

**Optional Fields:**
- `description`
- `color` (default: `#000000`)

**Response:**
```json
{
  "id": 3,
  "name": "Billing Issue",
  "description": "Issues related to billing and invoicing",
  "color": "#0000FF",
  "message": "Category created successfully"
}
```

### 4. UPDATE Category
```
PUT /categories/:id
Content-Type: application/json

{
  "name": "Billing Issues",
  "color": "#00FF00"
}
```
**Parameters:**
- `id` (required): Category ID

**Optional Fields:**
- `name`
- `description`
- `color`

**Response:**
```json
{
  "message": "Category updated successfully"
}
```

### 5. DELETE Category
```
DELETE /categories/:id
```
**Parameters:**
- `id` (required): Category ID

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

---

## Health Check

### System Health
```
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T15:30:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Title, description, category, and customer name are required"
}
```

### 404 Not Found
```json
{
  "error": "Complaint not found"
}
```

### 409 Conflict
```json
{
  "error": "Category name already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch complaints"
}
```

---

## Example cURL Commands

### Create a Complaint
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Service Down",
    "description": "Service is not responding",
    "category": "Service",
    "customer_name": "John Doe",
    "priority": "critical"
  }'
```

### Get All Complaints
```bash
curl http://localhost:3000/api/complaints
```

### Update a Complaint
```bash
curl -X PUT http://localhost:3000/api/complaints/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution_notes": "Issue has been fixed"
  }'
```

### Create a Category
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Support",
    "description": "Technical issues",
    "color": "#FF6600"
  }'
```

### Delete a Category
```bash
curl -X DELETE http://localhost:3000/api/categories/1
```
