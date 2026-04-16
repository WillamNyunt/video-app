# CLAUDE.md

## Project
Full-stack video archive app. React frontend, Express backend, MongoDB.
Read SPEC.md for full requirements before doing anything.

## Stack
- Frontend: React + Vite, React Router v6, lucide-react icons, plain CSS (no Tailwind, no MUI)
- Backend: Node.js, Express, Mongoose, Multer, bcrypt, jsonwebtoken
- DB: MongoDB via Mongoose. URI from MONGO_URI env var (default: mongodb://localhost:27017/videoarchive)
- Auth: JWT in httpOnly cookie

## Repo Structure
```
/
├── SPEC.md
├── CLAUDE.md
├── .env
├── client/                  ← React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── api/             ← all fetch calls here
│   │   └── styles/          ← global.css + component CSS files
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── models/          ← Mongoose schemas
│   │   ├── routes/          ← Express routers
│   │   ├── middleware/      ← auth, error handler
│   │   ├── controllers/     ← route handlers (thin, logic in services)
│   │   ├── services/        ← business logic
│   │   └── seed.js          ← admin + settings seed
│   ├── uploads/             ← gitignored, file storage
│   └── index.js             ← entry point
└── .claude/
    └── agents/
```

## Critical Rules
- NEVER expose Person.attributes to Claude in any context, prompt, or log. This field is private.
- All mutation API routes MUST use requireAdmin middleware.
- All read routes MUST use authMiddleware (guests are authenticated, just read-only).
- JWT goes in httpOnly cookie ONLY — never localStorage.
- No alert() calls in frontend — use inline error state.
- Theme is stored in AppSettings collection and loaded on app init. Apply as data-theme on <html>.
- FE search/filter on session video list is client-side only (no API call).
- CSS uses custom properties from global.css — never hardcode hex colors in component CSS.

## Naming Conventions
- React components: PascalCase files, e.g. VideoCard.jsx
- API routes: kebab-case, e.g. /api/person-video
- Mongoose models: PascalCase, e.g. PersonVideo
- CSS classes: kebab-case, e.g. .video-card
- Env vars: SCREAMING_SNAKE_CASE

## Commands
```bash
# Backend
cd server && npm run dev      # nodemon
cd server && npm run seed     # seed admin + settings

# Frontend
cd client && npm run dev      # vite dev server (port 5173)
cd client && npm run build

# Both (from root if concurrently is set up)
npm run dev
```

## Agents
See .claude/agents/ — three parallel agents:
- fe-agent.md    → React, routing, CSS, UI components
- be-agent.md    → Express routes, controllers, services, middleware
- db-agent.md    → Mongoose models, indexes, seed script

Coordinate via SPEC.md as source of truth. Each agent owns its directory.
FE owns client/. BE owns server/src/routes|controllers|services|middleware. DB owns server/src/models + seed.js.
