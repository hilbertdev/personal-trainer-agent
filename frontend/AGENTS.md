# Frontend app guidance

This frontend is a Vite + React + TypeScript single-page app.

- Use `npm run dev` from `frontend/` for local development.
- Use `npm run build` to type-check and produce the Vercel-ready `dist/` output.
- Vercel should use the Vite framework preset with `frontend/` as the project root.
- Client-exposed environment variables should use the `VITE_` prefix. `NEXT_PUBLIC_` remains accepted only as a migration fallback in `vite.config.ts`.
