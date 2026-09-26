# RefundGuard Platform - Separated Architecture

This project is organized into completely separated, standalone **frontend** and **backend** modules:

```text
Refund site/
├── backend/                  # Standalone Express API & MongoDB Atlas Server
│   ├── config/               # Database connection (Atlas)
│   ├── middleware/           # JWT Auth & Upload middleware
│   ├── models/               # Mongoose Models (User, Case, Evidence, Otp)
│   ├── routes/               # API Routes (auth, cases, evidence)
│   ├── uploads/              # Evidence uploads repository
│   ├── .env                  # Backend environment variables
│   ├── index.js              # Express entrypoint (Port 5000)
│   ├── package.json          # Backend-only dependencies
│   └── seed.js               # Database seeder
│
├── frontend/                 # Standalone React + Vite Single Page Application
│   ├── public/               # Static assets & icons
│   ├── src/                  # React components, pages, context, and styles
│   │   ├── context/          # AuthContext
│   │   ├── pages/            # AuthPage, DashboardPage, AdminPage, HomePage, etc.
│   │   └── App.jsx           # Root view router
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend-only dependencies
│   └── vite.config.js        # Vite dev server with /api proxy to Port 5000
│
├── package.json              # Monorepo workspace orchestrator
└── README.md
```

---

## Running the Application

### Option 1: Run Both Simultaneously (From Root Directory)
From the root directory (`d:\PROJECT\Refund site`):
```bash
npm start
# or
npm run dev
```
This automatically runs both the backend Express server (port 5000) and the frontend Vite server (port 5173).

---

### Option 2: Run Separately in Individual Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
# Server running at http://127.0.0.1:5000
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:5173
```

---

## Independent Builds & Scripts

- **Build Frontend**: `npm run build` from root or `cd frontend && npm run build`
- **Seed Database**: `npm run seed` from root or `cd backend && npm run seed`
