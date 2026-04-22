# Quick Start Guide - Dẹo Enterprise OS API

## 5-Minute Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 12+
- Redis 6+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
cp .env.example .env
```

3. Edit .env with your settings:
```env
DATABASE_URL=postgresql://localhost/deo
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-secure-secret
PORT=3001
```

4. Start development server:
```bash
npm run dev
```

The API will be running at `http://localhost:3001`

## Health Check

Test if server is running:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-04-03T12:00:00.000Z",
  "uptime": 5.234
}
```

## First API Call - Login

1. Get a token:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "company_id": "company-123",
    "role": "admin"
  }
}
```

2. Use token in requests:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/tasks
```

## Common Commands

### Development
```bash
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm start            # Run production
```

### Worker
```bash
npm run worker:dev   # Start job worker (dev)
npm run worker       # Start job worker (prod)
```

### Database
```bash
# Need to run migrations first to create schema
# See database setup in README.md
```

## Testing Key Endpoints

### Dashboard
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/dashboard/summary
```

### Create a Task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Task",
    "description": "Do something important",
    "priority": "high"
  }'
```

### List Tasks
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/tasks?page=1&limit=20
```

### Create Client
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+84123456789",
    "status": "active"
  }'
```

## Docker Deployment

Build image:
```bash
docker build -t deo-api .
```

Run container:
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://localhost/deo \
  -e REDIS_URL=redis://localhost:6379 \
  -e JWT_SECRET=secret \
  deo-api
```

## Database Setup

Before first run, you need PostgreSQL with the deo schema. The SQL schema should be created separately (not included in this backend).

Required tables:
- deo.users
- deo.companies
- deo.tasks
- deo.expenses
- deo.clients
- deo.projects
- deo.agents
- deo.conversations
- deo.messages
- deo.clarifications
- deo.notebooks
- deo.audit_events
- deo.leads
- deo.interactions
- deo.categories
- deo.files
- deo.accounts
- deo.contracts
- deo.quotes
- deo.reminders

## Real-time Messaging

The API supports real-time features via Socket.io. Connect to:
```
ws://localhost:3001
```

Join a conversation:
```javascript
const socket = io('http://localhost:3001');
socket.emit('join-conversation', 'conversation-id');
socket.on('message', (data) => console.log('New message:', data));
```

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running on port 5432
- Check Redis is running on port 6379
- Check NODE_ENV is correct

### Invalid Token
- Make sure you're copying the full token from login response
- Check JWT_SECRET is consistent
- Tokens expire after 24 hours

### Database Errors
- Verify DATABASE_URL format
- Check user has permission to access deo schema
- Ensure schema and tables exist

### Redis Errors
- Verify Redis is running
- Check REDIS_URL format (redis://host:port)
- Check firewall allows connection

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment mode |
| PORT | 3001 | API server port |
| DATABASE_URL | postgresql://localhost/deo | PostgreSQL connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| JWT_SECRET | your-secret-key | JWT signing key |
| CORS_ORIGIN | * | CORS allowed origins |

## File Structure

```
.
├── src/
│   ├── index.ts           Main server
│   ├── worker.ts          Background jobs
│   ├── db.ts              Database pool
│   ├── redis.ts           Redis client
│   ├── types/             TypeScript types
│   ├── middleware/        Auth, validation, audit
│   ├── services/          Event bus, context
│   └── routes/            All API endpoints
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Next Steps

1. Set up PostgreSQL database with deo schema
2. Configure environment variables
3. Run `npm install`
4. Start with `npm run dev`
5. Test endpoints with provided curl examples
6. Start worker with `npm run worker:dev`
7. Deploy to production using Docker

## Support

For full documentation, see:
- README.md - Complete API documentation
- IMPLEMENTATION_SUMMARY.md - Technical details
- Each route file has inline documentation

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | Get JWT token |
| GET | /api/auth/me | Get current user |
| GET | /api/health | Health check |
| GET | /api/dashboard/summary | Dashboard stats |
| GET/POST | /api/tasks | Task CRUD |
| GET/POST | /api/expenses | Expense CRUD |
| GET/POST | /api/clients | Client CRUD |
| GET/POST | /api/leads | Lead CRUD |
| GET/POST | /api/agents | Agent management |
| POST | /api/agents/:id/heartbeat | Agent heartbeat |
| GET | /api/agents/:id/pull | Agent pulls task |
| GET/POST | /api/conversations | Conversation CRUD |
| POST | /api/conversations/:id/messages | Send message |
| GET/POST | /api/clarifications | Clarification CRUD |
| GET | /api/clarifications/pending | Pending widget |
| GET/POST | /api/notebooks | Notebook CRUD |
| GET | /api/audit | Audit trail |
| GET/POST | /api/jobs | Job CRUD |
| POST | /api/jobs/:id/messages | Job message |
| POST | /api/jobs/:id/retry | Retry failed job |
