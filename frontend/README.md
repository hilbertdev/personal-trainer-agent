# Personal Trainer Agent frontend

## Getting Started

This is a Vite + React dashboard for the Phase 1 beta workout planner. It defaults to local mock data so the Vercel deployment is immediately navigable without a live API.

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

To connect to the ASP.NET API instead of mock data (Vite proxies `/api` to `http://localhost:8080`):

```bash
VITE_USE_MOCK_DATA=false VITE_API_URL= npm run dev
```

Or call the API directly:

```bash
VITE_USE_MOCK_DATA=false VITE_API_URL=http://localhost:8080 npm run dev
```

## Docker

From the repository root, start the full stack:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The frontend container proxies `/api` to the `api` service. Mock data in `src/mock-data/workouts.ts` is used when `VITE_USE_MOCK_DATA=true` or when API requests fail.

Mock-only UI without the API:

```bash
docker compose --profile mock up --build frontend-mock
```

## Scripts

- `npm run dev` - start Vite locally.
- `npm run build` - type-check and create the production build in `dist/`.
- `npm run start` - preview the production build locally.
- `npm run lint` - run ESLint.

## Deploy on Vercel

The included `vercel.json` uses the Vite framework preset, `npm run build`, and `dist` as the output directory. Connect the repo with `frontend/` as the Vercel project root.

Default Vercel environment:

- `VITE_USE_MOCK_DATA=true`

Add `VITE_API_URL` and set `VITE_USE_MOCK_DATA=false` when the backend API is ready.
