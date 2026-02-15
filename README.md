This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Scheduling the Auto-exit Monitor (GitHub Actions / Vercel)

This project includes a GitHub Actions workflow that POSTs a `tick` action to the backend monitor endpoint to run a single monitoring iteration.

- Workflow file: `.github/workflows/tick.yml` (runs on a cron schedule).
- Required repository secrets:
	- `DEPLOYMENT_URL` — the public URL of your deployment (e.g. `https://your-app.vercel.app`).
	- `SCHEDULER_SECRET` — secret value that must match the `SCHEDULER_SECRET` env var in your deployment.

Steps:

1. In Vercel Project Settings, add an Environment Variable named `SCHEDULER_SECRET` with a strong random value.
2. In GitHub repo Settings → Secrets → Actions, add `DEPLOYMENT_URL` and `SCHEDULER_SECRET` with the same values.
3. Adjust the cron schedule in `.github/workflows/tick.yml` if you need a different frequency.

Manual test (replace host/secret):

```bash
curl -X POST 'https://your-app.vercel.app/api/positions/auto-exit-monitor' \
	-H 'Content-Type: application/json' \
	-H 'x-scheduler-secret: your_secret_here' \
	-d '{"action":"tick"}'
```

Notes:
- If your `/api/positions` or `/api/settings` endpoints require user cookies, scheduled ticks need service-token support or a service account. Ask me and I can add service-token auth or Redis persistence for production reliability.
