# Dẹo Enterprise OS - Frontend Architecture

## Overview

The Dẹo Enterprise OS frontend is a modern, full-featured React application designed as a chat-first business management platform. It provides a comprehensive interface for Vietnamese enterprises to manage tasks, CRM, finances, and AI agents.

## Directory Structure

```
web/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Layout.tsx          # Main app shell with sidebar and header
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Card.tsx            # Card component family
│   │   ├── Badge.tsx           # Status and priority badges
│   │   ├── Modal.tsx           # Modal dialog component
│   │   ├── SlidePanel.tsx      # Right-slide detail panel
│   │   ├── KanbanBoard.tsx     # Kanban column layout
│   │   ├── ChatPanel.tsx       # Message list and input
│   │   ├── ContextPanel.tsx    # Related info display
│   │   ├── AgentCard.tsx       # Agent status card
│   │   └── EmptyState.tsx      # Empty state placeholder
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Auth context and hooks
│   │   └── useChat.ts          # WebSocket chat management
│   │
│   ├── lib/                    # Utilities and services
│   │   ├── api.ts              # Axios instance with JWT interceptor
│   │   ├── socket.ts           # Socket.io initialization
│   │   └── utils.ts            # Helper functions (formatting, colors, etc)
│   │
│   ├── pages/                  # Page components for each route
│   │   ├── Login.tsx           # Authentication page
│   │   ├── Dashboard.tsx       # Main dashboard with KPIs
│   │   ├── Chat.tsx            # 3-column chat interface
│   │   ├── Tasks.tsx           # Kanban/List task view
│   │   ├── CRM.tsx             # Lead pipeline
│   │   ├── Finance.tsx         # Expense management
│   │   ├── Agents.tsx          # AI agent dashboard
│   │   ├── Clarifications.tsx  # Agent question inbox
│   │   └── Notebooks.tsx       # Knowledge base
│   │
│   ├── types/                  # TypeScript interfaces
│   │   └── index.ts            # All shared types
│   │
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # React 18 entry point
│   └── index.css               # Global styles + Tailwind
│
├── Dockerfile                  # Multi-stage production build
├── nginx.conf                  # SPA routing configuration
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS customization
├── postcss.config.js          # PostCSS with Tailwind
├── package.json               # Dependencies
└── index.html                 # HTML entry point

```

## Key Design Patterns

### 1. Component Hierarchy

```
App (Router setup)
├── Layout (Authenticated shell)
│   ├── Sidebar (Navigation)
│   ├── Header (Title, company, notifications)
│   └── Content Area
│       ├── Dashboard
│       ├── Chat
│       ├── Tasks
│       ├── CRM
│       ├── Finance
│       ├── Agents
│       ├── Clarifications
│       └── Notebooks
```

### 2. State Management

- **Authentication**: React Context (AuthProvider)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Real-time**: Socket.io events
- **Local State**: useState for UI state (modals, selections, etc)

### 3. Styling Strategy

- **TailwindCSS**: Utility-first CSS framework
- **Custom Colors**: CSS variables for brand colors
- **Component Classes**: Tailwind @layer for reusable patterns
- **Responsive**: Mobile-first approach with md:, lg: breakpoints

## API Integration

### Axios Instance (`lib/api.ts`)

- Automatic JWT token injection from localStorage
- Automatic 401 redirect to login
- Centralized error handling
- Base URL: `/api` (proxied to backend)

### Socket.io Client (`lib/socket.ts`)

- Automatic reconnection with exponential backoff
- Token-based authentication
- Event-based real-time updates
- Used for chat messages and agent updates

## Pages Overview

### Dashboard
- 5 KPI cards with trend indicators
- Pie chart (expense by category)
- Bar chart (task status distribution)
- Recent activity feed
- Pending clarifications widget

### Chat
- 3-column layout: conversations, messages, context
- Search/filter conversations
- Real-time message updates via Socket.io
- Related client/task/agent info panel

### Tasks
- Kanban view: TODO → IN_PROGRESS → BLOCKED → IN_REVIEW → DONE
- List view with table
- Drag-hint visual columns
- Task detail slide panel
- Add/edit modals
- Filter by: company, project, assignee, status

### CRM
- Lead pipeline columns: NEW → CONTACTED → QUALIFIED → PROPOSAL → WON → LOST
- Lead cards with score, source, assignee
- Client detail table
- Lead detail slide panel

### Finance
- Summary cards: Total In, Total Out, Balance
- Expense table with sorting
- Category breakdown cards
- Add expense modal with categories

### Agents
- Agent cards with status indicator
- Capabilities badges
- Active tasks, completed today, tokens used
- Chat and pause/resume buttons
- Create new agent modal

### Clarifications
- Tabs: Pending (with badge), Answered
- Clarification cards with agent/task info
- Textarea for answers
- Submit button with validation

### Notebooks
- Grid/List view toggle
- Type filtering: Knowledge, Meeting, Research, Other
- Markdown content display
- Create/edit modals
- Preview slide panel

## Authentication Flow

1. User navigates to `/login`
2. Submits email + password to POST `/api/auth/login`
3. Server returns `{ token, user }`
4. Token stored in localStorage
5. User redirected to `/`
6. AuthContext updates, token injected in API headers
7. If token expires: 401 response → redirect to login

## Real-time Features

### Socket.io Events

**Chat**:
- `conversation:{id}:load` - Load message history
- `conversation:{id}:send` - Send new message
- `conversation:{id}:message` - Receive new message

**Agents**:
- `agent:status:changed` - Agent status update
- `agent:task:completed` - Task completion notification

## Utility Functions

### Formatting (`lib/utils.ts`)

- `formatDate(date)` - Vietnamese format: dd/MM/yyyy HH:mm
- `formatDateOnly(date)` - dd/MM/yyyy
- `formatCurrency(amount)` - Vietnamese VND: 1,500,000đ
- `formatTimeAgo(date)` - Relative time: "5m", "2h", etc

### Color Helpers

- `getPriorityColor(priority)` - Tailwind classes for priority badge
- `getStatusColor(status)` - Tailwind classes for status badge
- `getStatusLabel(status)` - Vietnamese labels for statuses

## Build & Deployment

### Development

```bash
npm install
npm run dev
```

Development server runs on `http://localhost:5173` with:
- Hot module replacement
- API proxy to http://api:3001
- WebSocket proxy to ws://api:3001

### Production Build

```bash
npm run build
```

Creates optimized `dist/` folder with:
- Code splitting
- CSS minification
- Asset optimization
- Source maps (optional)

### Docker Deployment

```bash
docker build -t deo-web:latest .
docker run -p 80:3000 deo-web:latest
```

Multi-stage build:
1. Stage 1: Node.js - install deps, build with Vite
2. Stage 2: nginx:1.27-alpine - serve with SPA routing config

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading via React Router
2. **Image Optimization**: SVG icons via Lucide React
3. **Caching**: Browser cache headers for static assets
4. **Gzip Compression**: Configured in nginx
5. **Bundle Size**: Tree-shaking with Vite ES modules
6. **API Calls**: React Query caching with 5min staleness

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation (Tab, Enter, Esc)
- Color contrast WCAG AA compliant
- Focus indicators on interactive elements

## Future Enhancements

1. Drag-and-drop for Kanban
2. Real-time collaboration with cursor positions
3. Rich text editor for notebooks
4. Advanced filtering and search
5. Data export (CSV, PDF)
6. Offline support with service workers
7. Dark mode toggle
8. Internationalization (i18n)
9. Advanced charting with more Recharts options
10. Notification system with WebSocket alerts
