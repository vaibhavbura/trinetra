This is a [Next.js](https://nextjs.org) frontend for Trinetra Mini.

It talks to a separate FastAPI backend at `/api/*` (see `backend/`). When deploying on Netlify you will deploy **only the frontend** to Netlify, and deploy the backend + Postgres somewhere else (Render/Fly.io/Railway/etc.), then point the frontend to that backend URL via environment variables.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deploy on Netlify (Frontend)

### 1) Deploy the backend first (required)

Netlify does not run long-lived Docker containers, and your backend needs Postgres. Deploy the backend separately and get a public API base URL like:

`https://your-backend.example.com/api`

Make sure your backend host supports:
- A persistent web process (FastAPI + Uvicorn)
- A Postgres database

### 2) Create a Netlify site

In Netlify: **Add new site → Import from Git** and select this repo.

Build settings (these are also encoded in the repo’s `netlify.toml` at the repo root):
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `.next`

### 3) Set required environment variables in Netlify

In **Site configuration → Environment variables**, set:

- `NEXT_PUBLIC_API_URL` = `https://your-backend.example.com/api`
- `INTERNAL_API_URL` = `https://your-backend.example.com/api`

Why both?
- `NEXT_PUBLIC_API_URL` is used in the browser.
- `INTERNAL_API_URL` is used during SSR/server-side execution on Netlify.

### 4) Redeploy

Trigger a new deploy (or push a commit) after setting env vars.

## Deploy on Vercel

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Notes

- If you lock down CORS in production, allow your Netlify site origin (e.g. `https://your-site.netlify.app`).
- Netlify will use Node `20` for builds (configured in `netlify.toml`).
