# Dẹo Enterprise OS API

A comprehensive backend API for the Dẹo Enterprise Operating System built with Express.js, TypeScript, PostgreSQL, and Redis.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT

## Prerequisites

- Node.js 20+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/deo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
PORT=3001
```

4. Build TypeScript:
```bash
npm run build
```

## Development

Run the API in development mode with hot-reload:
```bash
npm run dev
```

The server will start on port 3001 by default.

### Health Check

```bash
curl http://localhost:3001/api/health
```

## Production

Build and run the production version:
```bash
npm run build
npm start
```

## Worker

Start the background job worker:
```bash
npm run worker
```

Or in development mode:
```bash
npm run worker:dev
```

## Docker

Build the Docker image:
```bash
docker build -t deo-api .
```

Run the container:
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  deo-api
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login (email + password)
- `GET /api/auth/me` - Get current user (requires auth)

### Dashboard
- `GET /api/dashboard/summary` - Dashboard summary statistics
- `GET /api/dashboard/charts` - Chart data for visualization

### Tasks
- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/pick` - Agent picks task
- `POST /api/tasks/:id/progress` - Report task progress
- `POST /api/tasks/:id/complete` - Mark task complete
- `POST /api/tasks/:id/fail` - Mark task failed
- `POST /api/tasks/:id/request-review` - Request task review

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Expenses summary

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Categories/Business Lines
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Agents
- `POST /api/agents/register` - Register agent
- `POST /api/agents/:id/heartbeat` - Send heartbeat
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent
- `PATCH /api/agents/:id` - Update agent
- `GET /api/agents/:id/pull` - Pull task (agent polling)

### Clarifications
- `GET /api/clarifications` - List clarifications
- `POST /api/clarifications` - Create clarification
- `PATCH /api/clarifications/:id` - Answer clarification
- `GET /api/clarifications/pending` - Get pending clarifications

### Notebooks
- `GET /api/notebooks` - List notebooks
- `POST /api/notebooks` - Create notebook
- `GET /api/notebooks/:id` - Get notebook
- `PATCH /api/notebooks/:id` - Update notebook
- `DELETE /api/notebooks/:id` - Delete notebook

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `GET /api/conversations/:id/context` - Get context

### Audit
- `GET /api/audit` - List audit events with filters

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/interactions` - Create interaction
- `GET /api/leads/:id/interactions` - Get interactions

### Jobs (Agent Jobs)
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job
- `PATCH /api/jobs/:id` - Update job
- `POST /api/jobs/:id/messages` - Add job message
- `POST /api/jobs/:id/retry` - Retry failed job

## Authentication

All endpoints except `/api/auth/login` and `/api/health` require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <token>
```

To get a token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Database Schema

The API uses a PostgreSQL database with the `deo.*` schema. Key tables include:

- `deo.users` - System users
- `deo.companies` - Company accounts
- `deo.tasks` - Tasks and jobs
- `deo.expenses` - Expense records
- `deo.clients` - Client information
- `deo.projects` - Projects
- `deo.agents` - Agent registry
- `deo.conversations` - Conversations with agents
- `deo.messages` - Messages in conversations
- `deo.clarifications` - Clarification requests
- `deo.notebooks` - Notebooks and notes
- `deo.audit_events` - Audit trail
- `deo.leads` - Sales leads
- `deo.interactions` - Lead/client interactions
- `deo.categories` - Categories and business lines
- `deo.files` - File attachments
- `deo.accounts` - Bank accounts
- `deo.contracts` - Contracts
- `deo.quotes` - Quotes
- `deo.reminders` - Reminders

## Real-time Features

The API uses Socket.io for real-time features:

- Join conversations: `socket.emit('join-conversation', conversationId)`
- Send messages: `socket.emit('message', { conversationId, content })`
- Receive messages: `socket.on('message', data => ...)`

## Pagination

All list endpoints support pagination with query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Example:
```bash
GET /api/tasks?page=2&limit=50
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No content
- `400` - Bad request
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error

Error responses include an error message:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Development

### Code Structure

```
src/
  ├── index.ts           # Main entry point
  ├── worker.ts          # Background worker
  ├── db.ts              # Database pool
  ├── redis.ts           # Redis client
  ├── types/             # TypeScript interfaces
  ├── middleware/        # Express middleware
  │   ├── auth.ts        # JWT authentication
  │   ├── validate.ts    # Zod validation
  │   └── audit.ts       # Audit logging
  ├── services/          # Business logic
  │   ├── event.service.ts
  │   └── context.service.ts
  └── routes/            # API routes
      ├── auth.ts
      ├── tasks.ts
      ├── expenses.ts
      └── ... (other routes)
```

### Testing

Run tests:
```bash
npm test
```

### Linting

Check code style:
```bash
npm run lint
```

## Logging

The API logs all database queries in development mode and all errors. Check the console output for logs.

## Performance Considerations

- Database queries use parameterized statements to prevent SQL injection
- Redis caching for agent status and queued jobs
- Connection pooling for database (max 20 connections)
- Compression middleware for response bodies
- Socket.io for efficient real-time updates

## License

Proprietary - Dẹo Enterprise OS
