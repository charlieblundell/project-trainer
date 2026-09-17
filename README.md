# Your Personal Trainer

A training plan written for your goal, your kit and your time, that moves every
target from what you actually lift — with a coach that shows the research behind
its advice.

Next.js (App Router) on Vercel, Supabase for accounts and data, Anthropic for the
coach, Stripe for subscriptions. It installs to a phone as a PWA and keeps
working with no connection.

Live at [yourpersonaltrainer.vercel.app](https://yourpersonaltrainer.vercel.app).

## Running it

```bash
npm install
cp .env.local.example .env.local   # then fill it in, see below
npm run dev
```

Three values are enough to run the app and sign in:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
Everything else in `.env.local.example` is for a feature you can leave switched
off locally — without the Stripe keys, checkout simply refuses, which is how
production runs today.

Two of them decide behaviour rather than wiring:

- `NEXT_PUBLIC_PAYMENTS_OPEN` — anything other than `"true"` keeps payments
  paused. Nobody is locked out; checkout just declines.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — without it, Google sign-in falls back to the
  redirect flow, whose Google screen names the Supabase address instead of this
  app.

Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`; it bypasses row
level security.

The database lives in `supabase/` — `schema.sql` plus numbered migrations, run in
order. `supabase/email-templates/sign-in-code.html` is the sign-in email, which
sends a code and deliberately no link: the link got opened in the mail app, used
up the paired code, and left the typed code failing.

## What the checks are for

The training rules are the product, so they're checked as rules rather than
through the UI. Each script states a case in the language of the thing it's
checking and prints a line per assertion:

```bash
npm run check:rules        # weekly set targets per muscle
npm run check:volume       # a week adds up to its target, and no further
npm run check:readiness    # how a hard day changes the next target
npm run check:upgrade      # which plans get offered a rebuild, and which never do
npm run check:rebuild      # what counts as a change worth rebuilding for
npm run check:plan-edit    # what the editor accepts, clamps and refuses
npm run check:warmup       # every warm-up move says what to do
npm run check:loadable     # how a target reads for each kind of load
npm run check:weekly       # the numbers on the Progress tab
npm run check:billing      # how a trial's remaining days read
npm run check:evidence     # every claim resolves to a source
npm run check:exercises    # the library's cross-references resolve
```

`npm run check:evidence -- --online` resolves every DOI against Crossref, which
needs a connection and so isn't what CI runs.

The `preview:` scripts assert nothing — they print what the engine does, for
reading: `preview:plans`, `preview:progression`, `preview:refresh`,
`preview:progress`.

`npm run check:webhook` is the odd one out: it proves the payment endpoints
refuse what they should, and needs a server to talk to. Webhook payloads are
signed locally with a throwaway secret, which is exactly what Stripe does with
the real one — so no Stripe account is involved.

```bash
STRIPE_WEBHOOK_SECRET=whsec_local_check STRIPE_SECRET_KEY=sk_test_placeholder npx next dev -p 3100
npm run check:webhook
```

## Tests

```bash
npm run test:e2e      # Playwright, starts its own dev server on :3000
npm run test:e2e:ui
```

They run on an iPhone viewport with touch input, because the two bugs that
reached real people were both on a phone. Sign-in is stubbed rather than using a
real account, so there are no credentials in the repo and no shared test user to
keep alive — see `e2e/signed-in.ts`.

CI runs the checks, `tsc`, `eslint` and the browser tests on every push and pull
request. It needs two repo secrets, `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon pair, safe to expose to a browser.

## Where things live

```
src/app/(app)     the signed-in app: home, train, plan, progress, coach, settings
src/app           landing, signup, research, privacy, terms, and the API routes
src/lib/plan      how a plan is built, edited, progressed and rebuilt
src/lib/evidence  the findings behind the rules, with their sources
src/lib/exercises the exercise library, by environment and movement pattern
src/lib/offline   the save outbox and network state
scripts           the checks above, plus marketing screenshot tooling
supabase          schema, migrations, email template
```

`AGENTS.md` is written by `next dev` and belongs in commits.
