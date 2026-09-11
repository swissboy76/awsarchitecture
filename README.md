# AWS Architecture Health Check

A Cloudflare Workers + D1 MVP for a lead-generating AWS architecture assessment.

## What it does

- 21-question browser-based AWS health check
- Scores Security, Reliability, Cost, Operations, Performance and Sustainability
- Shows a prioritised result immediately
- Captures lead details only after the user receives value
- Stores leads and assessments in Cloudflare D1
- Requires no AWS credentials

> This is not an official AWS Well-Architected Review and is not affiliated with AWS.

## Stack

- Cloudflare Workers
- Workers Static Assets
- Cloudflare D1
- Vanilla HTML/CSS/JS

## Deploy

### 1. Install dependencies

```bash
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Create the D1 database

```bash
npx wrangler d1 create aws-health-check
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`.

### 4. Apply the migration

```bash
npm run db:migrate:remote
```

### 5. Test locally

```bash
npm run db:migrate:local
npm run dev
```

### 6. Deploy

```bash
npm run deploy
```

Cloudflare will return a `workers.dev` URL. A custom domain can then be attached in the Cloudflare dashboard.

## Next milestones

1. Add transactional email delivery of the saved report.
2. Add analytics and funnel tracking.
3. Add privacy/cookie documentation and production consent wording.
4. Add paid detailed assessment checkout.
5. Add the read-only AWS inventory collector and rules engine.
6. Add a private operator dashboard for leads and conversion metrics.
