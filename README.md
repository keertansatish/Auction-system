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

## Realtime bidding

Live auctions use Supabase for auction metadata and authentication, Upstash Redis for the authoritative current price, and Ably for persistent realtime connections.

Add these values to `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=your-upstash-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
ABLY_API_KEY=your-ably-api-key
```

The Redis token and Ably API key must remain server-only. After an auction is created, its live state is initialized at `auction:{id}`. Selecting `+5`, `+10`, or `+15` only chooses an increment; `Bid now` sends the increment to the authenticated bid route. Redis applies the increment atomically, and accepted bids are published to the Ably channel `auction:{id}` for every connected viewer.

The browser receives a short-lived, auction-scoped Ably token through `/api/ably/token`. If a connection drops, the live page reconnects and refreshes its Redis snapshot so it can recover events missed while offline.

This implementation stores live bid state in Redis only. Durable bid history, auction settlement, and payments are not included yet. Configure Redis retention so auction keys remain available through the auction window and any required settlement period.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
