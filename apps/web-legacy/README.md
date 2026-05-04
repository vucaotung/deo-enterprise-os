# Dẹo Enterprise OS - Web Frontend

A modern, chat-first business management platform built with React 18, TypeScript, and Vite.

## Features

- **Dashboard**: Real-time KPIs, charts, and activity feed
- **Chat**: 3-column chat interface with context panel
- **Tasks**: Kanban board and list view for task management
- **CRM**: Lead pipeline visualization and client management
- **Finance**: Expense tracking with category breakdown
- **Agents**: AI workforce dashboard with status monitoring
- **Clarifications**: Agent question inbox with response management
- **Notebooks**: Knowledge base with markdown support

## Tech Stack

- React 18 + TypeScript
- Vite for fast development and optimized builds
- TailwindCSS for styling
- React Router v6 for navigation
- Recharts for data visualization
- Socket.io-client for real-time features
- React Query for data management
- Lucide React icons

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The app uses a local development server with API proxying:
- API requests to `/api/*` are proxied to `http://api:3001`
- WebSocket connections to `/socket.io` are proxied to `ws://api:3001`

## Project Structure

```
src/
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── pages/            # Page components for routes
├── types/            # TypeScript type definitions
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Building and Deployment

### Docker

```bash
docker build -t deo-web:latest .
docker run -p 80:3000 deo-web:latest
```

### Production Build

```bash
npm run build
```

The `dist` folder contains the optimized production build ready for deployment to any static hosting service.

## Authentication

The app uses JWT tokens stored in localStorage. Login credentials are handled via the `/api/auth/login` endpoint.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new code
3. Keep components small and focused
4. Use Tailwind CSS for styling

## License

Proprietary - Dẹo Enterprise OS
