# AWS Cloud Health Check

A Cloudflare Workers + D1 MVP for a lead-generating AWS assessment aimed at both non-expert SME users and experienced AWS practitioners.

## What it does

- Offers two assessment paths from the homepage:
  - **Simple AWS Cloud Health Check** for business owners, IT generalists and less-experienced AWS users
  - **Technical AWS Architecture Assessment** for experienced AWS engineers and architects
- Uses 15 plain-English questions in the simple route
- Retains the original 21-question technical assessment for advanced users
- Scores six relevant categories for each path
- Shows a prioritised result immediately
- Captures lead details only after the user receives value
- Captures commercial qualification data on the simple route, including approximate AWS spend, who manages AWS and the main concern
- Stores leads and assessments in Cloudflare D1
- Requires no AWS credentials

> This is not an official AWS Well-Architected Review and is not affiliated with AWS.

## Stack

- Cloudflare Workers
- Workers Static Assets
- Cloudflare D1
- Vanilla HTML/CSS/JS

## Deploy

The Worker is connected to the `main` branch in GitHub and should automatically build and deploy when new commits are pushed.

For a manual deployment:

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Database

The Worker uses the `aws-health-check` D1 database via the `DB` binding configured in `wrangler.jsonc`.

Apply migrations with:

```bash
npm run db:migrate:remote
```

For local development:

```bash
npm run db:migrate:local
npm run dev
```

## Next milestones

1. Add transactional email delivery of the saved report.
2. Add analytics and funnel tracking.
3. Add privacy/cookie documentation and production consent wording.
4. Add paid detailed assessment checkout.
5. Add the read-only AWS inventory collector and rules engine.
6. Add a private operator dashboard for leads and conversion metrics.
