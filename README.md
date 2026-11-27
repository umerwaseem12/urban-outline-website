# Urban Outline

Clothing store for men, women, boys and girls, built as a React single-page app with an Express + MongoDB backend.

Live store: <https://urban-outline.vercel.app/>
API: <https://urban-outline-backend.vercel.app/api/health>

## Stack

| Part     | Tech                                                             |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, framer-motion, lucide-react      |
| Backend  | Express 5, Mongoose 9, JWT-cookie sessions, bcrypt, Nodemailer     |
| Database | MongoDB (products, orders, users, sessions, messages)             |

## Project layout

```
src/            React app (App.jsx holds the storefront shell)
src/Pages/      Account, Checkout, ProductDetail, Admin (at /dev.urban), ...
shared/         Catalog fallback data used before/without the API
server/         Express API (routes, models, seed script)
public/         Static images and icons
```

## Local setup

```bash
# 1. Frontend
npm install
cp .env.example .env      # set VITE_API_URL and VITE_GOOGLE_CLIENT_ID
npm run dev               # http://localhost:5173

# 2. Backend (second terminal)
cd server
npm install
cp .env.example .env      # set MONGODB_URI at minimum
node seed-products.js     # first run only: seed the 100 product catalog
npm start
```

The frontend falls back to `shared/catalog.mjs` when the API is unreachable, so
the site still renders without a backend. Login, checkout, contact and the chat
assistant need the API.

## Scripts

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start Vite with hot reload          |
| `npm run build`   | Production build into `dist/`       |
| `npm run preview` | Serve the production build locally  |
| `npm run lint`    | ESLint for frontend and backend     |

## Environment variables

Frontend (`.env`, see `.env.example`):

- `VITE_API_URL` – backend base URL, no trailing slash
- `VITE_GOOGLE_CLIENT_ID` – Google OAuth client ID

Backend (`server/.env`, see `server/.env.example`):

- `MONGODB_URI` (required), `PORT`, `CLIENT_ORIGIN`, `NODE_ENV`
- `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `GEMINI_MODEL`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`

Set `NODE_ENV=production` on the deployed API so session cookies are `secure`
and `sameSite=none`; `CLIENT_ORIGIN` must match the storefront origin exactly.

## Deployment

- **Frontend:** Vercel. Set `VITE_API_URL` (and `VITE_GOOGLE_CLIENT_ID`) in the
  project's environment variables before building, otherwise the build falls
  back to `http://localhost:5000`.
- **Backend:** Vercel/host of your choice. Set the server env vars, and add the
  storefront origin to `CLIENT_ORIGIN` so CORS and cookies work.

`vercel.json` rewrites every non-API path to `index.html` so direct links and
page refreshes keep working.

## Admin

The CMS lives at `/dev.urban`. It requires signing in with a user whose `role`
is `admin`; every `/api/admin/*` route is protected server-side by
`requireAdmin`.
