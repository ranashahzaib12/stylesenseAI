Preparation for Vercel deployment

1. Connect the repository to Vercel (via GitHub/GitLab/Bitbucket or `vercel` CLI).

2. Build settings (Vercel will detect Vite):
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. Environment variables (set these in Vercel Project Settings -> Environment Variables):
   - `SUPABASE_URL` and `SUPABASE_KEY` (if used by the frontend)
   - Any OpenAI / HuggingFace / other API keys used by the frontend
   - Backend-specific variables expected by `backend/src/app.js` and `backend/src/server.js`:
     - `TRYON_MODAL_URL` (URL to the try-on modal service)
     - Any other variables in `.env` used by backend services

4. API routing:
   - The repository includes a catch-all serverless wrapper at `api/[...tryon].js` which forwards `/api/*` requests to the Express app in `backend/src/app.js`.
   - The backend dependencies were added to root `package.json` so Vercel will install them.

5. Deployment commands (optional, using CLI):

```bash
# install Vercel CLI if needed
npm i -g vercel
# from repo root
vercel --prod
```

6. Notes & troubleshooting:
   - Ensure secrets are configured in Vercel; do not commit `.env` to the repo.
   - If the backend uses long-running background tasks (like setInterval), those will not run in serverless functions. The `backend/src/server.js` pinger is not used when running as a serverless function (only `server.js`'s `app.listen` uses the pinger). If you need continuous background tasks, deploy the backend separately (e.g., Render, Heroku, or a server VM).
