# Build Instructions - Dẹo Enterprise OS Web Frontend

## Quick Start

### 1. Install Dependencies
```bash
cd /sessions/adoring-eloquent-brahmagupta/mnt/AGENT_ORCHESTRATION_V2/deo-enterprise-os/apps/web
npm install
```

### 2. Development Server
```bash
npm run dev
```
Visit: http://localhost:5173

### 3. Production Build
```bash
npm run build
npm run preview
```

## Docker Build & Run

### Build Docker Image
```bash
docker build -t deo-enterprise-os-web:latest .
```

### Run Container
```bash
docker run -p 80:3000 deo-enterprise-os-web:latest
```

Visit: http://localhost:3000

## Project Statistics

### Files Created: 35+
- TypeScript/React Components: 28 files
- Configuration Files: 7 files
- Documentation: 3 files
- Docker: 2 files

### Key Features Implemented

1. **Authentication**
   - Login page with email/password
   - JWT token management
   - Automatic logout on 401

2. **Dashboard**
   - 5 KPI cards with trends
   - Expense pie chart
   - Task status bar chart
   - Activity feed
   - Pending clarifications widget

3. **Chat Module**
   - 3-column layout (conversations, messages, context)
   - Real-time messaging via Socket.io
   - Search and filtering
   - Context panel with related info

4. **Task Management**
   - Kanban board (5 columns: TODO, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE)
   - List view with sorting
   - Task detail slide panel
   - Add/edit task modals
   - Priority and status badges

5. **CRM System**
   - Lead pipeline (6 stages)
   - Lead cards with scoring
   - Client management table
   - Lead detail view

6. **Finance Management**
   - Income/Expense/Balance cards
   - Expense table with filtering
   - Category breakdown
   - VND currency formatting
   - Add expense modal

7. **AI Agents Dashboard**
   - Agent cards with status
   - Capability tags
   - Performance metrics (active tasks, completed today, tokens used)
   - Chat and control buttons
   - Create agent modal

8. **Clarifications Inbox**
   - Pending vs. Answered tabs with badges
   - Agent questions display
   - Context and priority indicators
   - Response textarea with submit
   - Time tracking (asked/answered)

9. **Knowledge Notebooks**
   - Grid and list views
   - Type filtering (Knowledge, Meeting, Research, Other)
   - Markdown content display
   - Create/edit modals
   - Recent updates tracking

10. **Layout & Navigation**
    - Collapsible sidebar with icons
    - Top header with company selector
    - Notification bell with badge
    - User menu
    - Dark theme sidebar

## Component Library

### Reusable Components
- `Card` / `CardHeader` / `CardTitle` / `CardContent` / `CardFooter`
- `Badge` (multiple variants and sizes)
- `Modal` (with size options)
- `SlidePanel` (right-slide detail view)
- `KanbanBoard` (column-based layout)
- `ChatPanel` (messages + input)
- `ContextPanel` (related info display)
- `AgentCard` (agent status card)
- `EmptyState` (placeholder)

### Page Components
- Login
- Dashboard
- Chat
- Tasks
- CRM
- Finance
- Agents
- Clarifications
- Notebooks

## Styling

- **Framework**: TailwindCSS 3.4
- **Icons**: Lucide React (378+ icons)
- **Colors**: Custom brand palette
  - Primary Blue: #1e3a5f
  - Accent Teal: #0ea5e9
  - Orange Alert: #f97316
  - Dark Sidebar: #1e293b
- **Responsive**: Mobile-first (sm, md, lg breakpoints)
- **Dark Sidebar**: #1e293b with white text
- **Light Content**: #f8fafc background with white cards

## Dependencies

### Core
- react 18.3.1
- react-dom 18.3.1
- react-router-dom 6.22.2

### Data & API
- @tanstack/react-query 5.28.0
- axios 1.6.5
- socket.io-client 4.7.2

### UI & Visualization
- recharts 2.10.3
- lucide-react 0.378.0
- tailwindcss 3.4.1
- clsx 2.1.0

### Utils
- date-fns 3.3.1 (with vi locale)

## Development Tools

- **Vite**: Lightning-fast build tool
- **TypeScript**: Full type safety
- **PostCSS**: CSS transformations
- **Autoprefixer**: Browser compatibility

## Environment Setup

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## API Integration

All API calls go through Axios instance at `/lib/api.ts`:
- Base URL: `/api` (proxied to http://api:3001 in dev)
- JWT token auto-injected from localStorage
- 401 errors trigger login redirect
- Error interceptors for logging

## WebSocket Connection

Socket.io configured in `/lib/socket.ts`:
- Auto-reconnect with exponential backoff
- Token-based authentication
- Event namespaces for chat and agents
- Manual connection management

## Performance Features

1. React Query caching (5min staleness, 10min garbage collection)
2. Vite code splitting
3. Gzip compression in nginx
4. Browser cache headers for static assets
5. Lazy loading of page routes
6. Optimized bundle with tree-shaking

## Testing Commands

```bash
# Type checking
npx tsc --noEmit

# Linting (if configured)
npm run lint

# Build validation
npm run build
```

## File Locations

Main entry point: `src/main.tsx`
App component: `src/App.tsx`
Layout shell: `src/components/Layout.tsx`
Route pages: `src/pages/`
Utilities: `src/lib/`
Types: `src/types/index.ts`

## Notes

- All UI text is in Vietnamese (Tiếng Việt)
- Date format: dd/MM/yyyy HH:mm (Vietnamese)
- Currency: VND with đ suffix (1,500,000đ)
- Mock data provided for all pages
- Ready to connect to real backend APIs
- Fully responsive design (tested on desktop)

## Next Steps

1. Connect to real backend API
2. Replace mock data with API calls
3. Implement drag-and-drop for Kanban
4. Add real-time notifications
5. Implement file upload for expenses/receipts
6. Add export functionality (CSV, PDF)
7. Implement dark mode toggle
8. Add internationalization support
