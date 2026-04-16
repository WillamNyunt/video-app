# SPEC.md — Video Archive App

## Overview
A full-stack video archive and management application. Admins manage locations, sessions, videos, and people. Guests have read-only access. Videos are served directly from local disk. People have configurable dynamic attributes (defined by admin) used for global search and filtering.

---

## Tech Stack
- **Frontend**: React (Vite), React Router, CSS custom properties (no CSS framework)
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose ODM), localhost port configurable via `.env`
- **Auth**: JWT (stored in httpOnly cookie), bcrypt password hashing
- **File storage**: Local filesystem, path configurable via `.env`

---

## Environment Variables (`.env`)
```
MONGO_URI=mongodb://localhost:27017/videoarchive
JWT_SECRET=changeme
STORAGE_PATH=./uploads
PORT=5000
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=changeme
```

---

## Roles
| Role | Permissions |
|------|------------|
| `admin` | Full CRUD on all entities, upload videos, manage attribute schemas |
| `guest` | Read-only on all entities (no create/edit/delete) |

Admin account is seeded on first run. No user management UI. Guests are also seeded or manually added via DB.

---

## Data Model (MongoDB / Mongoose)

### `User`
```
username: String (unique, required)
passwordHash: String (required)
role: String enum ['admin', 'guest'] (required)
createdAt: Date
```

### `Location`
```
address: String (required)
pictureUrl: String (stored path)
thumbnailUrl: String (stored path)
createdAt: Date
```

### `Session`
```
locationId: ObjectId → Location (required)
date: Date (required)
time: String (required, e.g. "14:30")
createdAt: Date
```

### `Video`
```
sessionId: ObjectId → Session (required)
title: String (required)
filePath: String (required, local path)
thumbnailUrl: String (stored path)
timestamp: String (manually entered, e.g. "00:04:32")
fileSizeBytes: Number
durationSeconds: Number
createdAt: Date
```

### `Person`
```
name: String (required)
attributes: Mixed (key-value, schema defined by PersonAttributeSchema)
createdAt: Date
```

### `PersonVideo` (join collection)
```
personId: ObjectId → Person (required)
videoId: ObjectId → Video (required)
```
Index: unique compound `[personId, videoId]`

### `PersonAttributeSchema`
```
label: String (required, e.g. "Hair color")
type: String enum ['dropdown', 'checkbox', 'slider'] (required)
options: Mixed
  - dropdown: { items: [String] }
  - checkbox: { label: String }
  - slider: { min: Number, max: Number, step: Number }
order: Number (for display ordering)
```

### `AppSettings`
```
key: String (unique, e.g. "theme")
value: String (e.g. "dark" | "light")
```
Seed with `{ key: "theme", value: "light" }` on startup.

---

## API Endpoints

### Auth
```
POST   /api/auth/login         body: { username, password } → { token }
POST   /api/auth/logout
GET    /api/auth/me            → current user
```

### Locations
```
GET    /api/locations
GET    /api/locations/:id
POST   /api/locations          [admin] body: { address }, files: picture, thumbnail
PUT    /api/locations/:id      [admin]
DELETE /api/locations/:id      [admin]
```

### Sessions
```
GET    /api/sessions?locationId=
GET    /api/sessions/:id
POST   /api/sessions           [admin] body: { locationId, date, time }
PUT    /api/sessions/:id       [admin]
DELETE /api/sessions/:id       [admin]
```

### Videos
```
GET    /api/videos?sessionId=
GET    /api/videos/:id
POST   /api/videos             [admin] multipart: file + { sessionId, title, timestamp }, file: thumbnail
PUT    /api/videos/:id         [admin]
DELETE /api/videos/:id         [admin]
GET    /api/videos/:id/file    → serves static file (pipe from disk)
```

### People
```
GET    /api/people
GET    /api/people/:id
GET    /api/people/:id/videos  → videos this person appears in
POST   /api/people             [admin] body: { name, attributes }
PUT    /api/people/:id         [admin]
DELETE /api/people/:id         [admin]
```

### Person ↔ Video links
```
POST   /api/person-video       [admin] body: { personId, videoId }
DELETE /api/person-video       [admin] body: { personId, videoId }
```

### Attribute Schema
```
GET    /api/attribute-schema
POST   /api/attribute-schema   [admin] body: { label, type, options, order }
PUT    /api/attribute-schema/:id [admin]
DELETE /api/attribute-schema/:id [admin]
```

### Global Search
```
GET    /api/search?q=&filters=  → searches people by name + attribute values
                                   returns matched people + their videos
```

### Settings
```
GET    /api/settings
PUT    /api/settings           [admin] body: { key, value }
```

---

## Frontend Routes

```
/login                        → Login page
/                             → Locations list
/locations/:id                → Location detail → list of sessions
/sessions/:id                 → Session detail → list of videos (with filter/sort)
/people                       → People list
/people/:id                   → Person detail (their videos + attributes)
/search                       → Global search/filter page
/admin/settings               → App settings (theme, attribute schema management)
```

---

## UI & Theming

### CSS Architecture
```css
/* global.css */
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
  --color-border: #e0e0e0;
  --color-text-primary: #111111;
  --color-text-secondary: #555555;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-danger: #dc2626;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --font-sans: 'Inter', system-ui, sans-serif;
  --transition: 0.15s ease;
}

[data-theme="dark"] {
  --color-bg: #0f0f0f;
  --color-surface: #1a1a1a;
  --color-border: #2a2a2a;
  --color-text-primary: #f0f0f0;
  --color-text-secondary: #999999;
}
```
- Theme is stored in `AppSettings` (key: `theme`), loaded on app init, applied as `data-theme` on `<html>`.
- Theme toggle in nav applies change immediately and persists to DB.

### Design Principles
- Clean, minimal, icon-driven (use `lucide-react` for all icons)
- Card-based layout for locations, sessions, video lists
- Sidebar or top nav with dark/light toggle
- No heavy UI framework — pure CSS with custom properties
- Responsive but desktop-first

---

## Page Behaviours

### Session detail (`/sessions/:id`)
- Lists all videos in the session
- **FE-only filter/search**: filter by title (text input)
- **FE-only sort**: by timestamp, title, file size, duration
- Each video card shows: thumbnail, title, timestamp, duration, file size, linked people chips

### People list (`/people`)
- Grid/list of people cards
- Click → person detail

### Person detail (`/people/:id`)
- Shows all dynamic attributes (rendered per schema type: slider read-only display, dropdown value, checkbox value)
- Shows all videos they appear in (same card style as session view)

### Global search (`/search`)
- Text search on person name
- Attribute filters rendered dynamically from `PersonAttributeSchema`
  - Dropdown → `<select>`
  - Checkbox → `<input type="checkbox">`
  - Slider → range with min/max from schema
- Results show matched people and their associated videos

### Admin settings (`/admin/settings`)
- Theme toggle (light/dark)
- Attribute schema management: add/edit/delete attribute types for Person

---

## File Handling
- Videos and images stored under `STORAGE_PATH` env var
- Subdirectories: `uploads/videos/`, `uploads/thumbnails/`, `uploads/location-images/`
- Multer used for multipart upload handling on Express
- Video file served via `res.sendFile()` with correct `Content-Type`
- No streaming (range requests not required)

---

## Auth & Middleware
- JWT in httpOnly cookie (not localStorage)
- `authMiddleware` — validates JWT, attaches `req.user`
- `requireAdmin` — checks `req.user.role === 'admin'`, returns 403 if not
- All mutation routes require `requireAdmin`
- All read routes require `authMiddleware` (guests can read)

---

## Seed Script
On server start (or via `npm run seed`):
1. Create admin user from env vars if not exists
2. Create default `AppSettings` if not exists
3. Log seed status to console

---

## Error Handling
- Express global error handler returns `{ error: string }` JSON
- Frontend displays inline error messages (no alert())
- 401 → redirect to `/login`
- 403 → show "Insufficient permissions" inline

---

## Non-Goals (explicitly out of scope)
- Video streaming / range requests
- User registration UI
- Email / notifications
- Multi-tenancy
- Mobile-optimised layout (desktop-first is fine)
- Video transcoding or thumbnail auto-generation
