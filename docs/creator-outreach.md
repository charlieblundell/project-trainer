# Creator outreach: borrowing an audience

The method (from a reel on marketing an app for free):
1. Find people who already have an audience.
2. Work out what problem *they* have.
3. Message them to **ask about that problem**, not to pitch.
4. Shape the app into the fix, and refine it with their feedback.
5. Once it genuinely helps them, they share it, and you reach their audience for free.

**Why it fits us:** it's text written as the founder (no face, no filming), costs nothing, and a few good replies are worth more than hundreds of posts.

## The catch with fitness creators

Almost all of them earn money by selling programs or coaching, so an AI trainer app looks like competition. First messages must not pitch at all. **Only approach people whose problem the app solves *next to* what they sell**: a community that needs a training companion, a physio whose patients need somewhere to go after rehab, an educator whose students need to apply the science.

## Who to approach (checked 2026-09-15)

| # | Creator | Size | What they sell | Why they might want it | Fit |
|---|---|---|---|---|---|
| 1 | [@tonyboutagy](https://www.instagram.com/tonyboutagy/): Dr Tony Boutagy, PhD exercise science | 36K | Evidence-based courses for coaches and lifters, a podcast, a weekly research review | His students learn the science, then have to apply it week to week. He's also the ideal critic of the evidence library. Australian. | **High** |
| 2 | [@everarias_md](https://www.instagram.com/everarias_md/): Ever Arias MD | 18K | A paid weight-loss community for parents (Skool) | Sells short workouts and fat loss, not lifting programs. His members need a simple plan that fits their kit and time. | **High** |
| 3 | [@alex.strengthphysio](https://www.instagram.com/alex.strengthphysio/): Alex Dear, physio for lifters | 38K | Online injury assessments and rehab | Patients finish rehab and have to get back to normal training without him. The app already works around sore knees and shoulders. | **High** |
| 4 | [@tobiewallacecoach](https://www.instagram.com/tobiewallacecoach/): Tobie Wallace, PT | 7.8K | Coaching, plus a link to free resources | Exactly our audience: "normal humans" confused by fitness. Small and very engaged, so likely to reply. | Medium |
| 5 | [@nikitacominos](https://www.instagram.com/nikitacominos/): Nikita Cominos | 24K | No product linked | Big reach on beginner strength myths, nothing to protect. Based in the UK, sometimes Sydney. | Medium |
| 6 | [@aditi_fitmom](https://www.instagram.com/aditi_fitmom/): Aditi Agrawal, MS, ex-Stanford researcher | 12.8K | 1:1 recomposition coaching | Competes on coaching, but cites research, so her feedback on the evidence would be useful. Ask for feedback, not distribution. | Low–medium |

Skipped: 1:1 coaches whose whole offer is programming (they'd see a competitor), and accounts outside strength training.

## How to send

- **Look at one of their recent posts first**, and mention something specific and true from it. Messages that could go to anyone get ignored, and Instagram flags copy-pasted messages.
- **Send from @yourpersonaltrainerapp, signed as Charlie.** Keep it to 3–5 messages a day.
- **Expect about 1 reply in 5–10.** That's normal and enough.
- **Don't send the app link in the first message.** Ask the question and wait.
- **Never say or imply they endorse the app** unless they've said they do.

## First messages (fill in the brackets; don't send as-is)

**Tony Boutagy**
> Hi Tony, Charlie here. I'm building a small training app in Tasmania that only gives advice it can source: each recommendation links to its paper and says how strong the evidence is. [One specific thing from a recent post or research review.] Genuine question, not a pitch: when lifters finish one of your courses, what do they find hardest to put into practice on their own, week to week?

**Ever Arias MD**
> Hi Dr Arias, Charlie here. I liked [specific recent post], especially that you steer parents toward strength work rather than long workouts. Quick question, not a pitch: when people in your community start lifting, what do they get stuck on most? Knowing what to do, fitting it in, or sticking with it?

**Alex Dear**
> Hi Alex, Charlie here. [Specific recent post] was a good one. I'm building a training app that plans around sore joints, so I'm curious: when a lifter finishes rehab with you, what's the hardest part of getting back to normal training once you're not checking in?

**Tobie Wallace**
> Hey Tobie, Charlie here. "Fitness is confusing. It shouldn't be" is pretty much why I started building my app. [Specific recent post.] Honest question: once the normal humans you teach are lifting on their own, what trips them up most?

**Nikita Cominos**
> Hi Nikita, Charlie here. [Specific recent post] cleared up something a lot of beginners get wrong. Quick question: what lands in your DMs most from people starting out with weights?

**Aditi Agrawal**
> Hi Aditi, Charlie here. I'm building a training app where every recommendation links to the research behind it, and you're one of the few creators who actually cites papers. Would you be up for telling me where the evidence library oversimplifies? No catch; I'd rather hear it from someone who reads the studies.

## When they reply

1. **Listen, and ask one follow-up.** Their problem decides what happens next.
2. **Only if the app really fixes it**, say so plainly: "I think what I've built might cover that. It's free while it's early. Would you try it and tell me what's wrong with it?"
3. **Give them their own link**, so their visits and signups show up separately in PostHog: `https://yourpersonaltrainer.vercel.app/?ref=<handle>`, for example `?ref=tonyboutagy`.
4. **Fix what they complain about**, then tell them it's fixed. That is the step that turns a tester into someone who shares it.

## Possible changes to offer, only once someone asks

- **A creator link that fills in the setup.** For example, a parents link could pre-select fat loss, 30-minute sessions and dumbbells, so their followers answer fewer questions.
- **An offer for their audience when subscriptions open**, such as extra free time. This needs a decision from Charlie and a Stripe coupon, so don't promise it in a message until it exists.
- **A shareable "what the research says" card** for a single finding, which an educator could post with credit.
