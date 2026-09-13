# Garmin Connect Developer Program — application draft

Everything below is ready to paste. Replace the bracketed bits. Nothing here
claims more than the app actually does today.

---

## Before you apply: the one-line email

There is no self-serve sign-up form. Garmin's Health API page points at a
partner enquiry form (garmin.com/forms/wellnesspartner/) and gives a support
address, connect-support@developer.garmin.com. Their FAQ says they confirm an
application's status within two business days, but a developer report says new
requests were paused during 2026, and Garmin's own pages only say "stay tuned
for more updates on the program".

So ask before you invest any time. Email connect-support@developer.garmin.com:

> Subject: Are Connect Developer Program applications open?
>
> Hello,
>
> I run a small training app in Australia and would like to apply for the
> Health API. Before I submit, could you confirm whether new applications to
> the Connect Developer Program are currently being accepted?
>
> Thanks,
> [first name]
> Your Personal Trainer — yourpersonaltrainer.vercel.app

---

## Company and contact

- **Company name:** [Your registered business name once the ABN is through —
  until then, your own name: Charles James Blundell]
- **Website:** https://yourpersonaltrainer.vercel.app
- **Contact:** [first name] [surname], cblundell38@gmail.com
- **Country:** Australia
- **Company size:** 1

> Garmin's FAQ says the program is "only for business use". Don't dress this up
> as bigger than it is — a sole trader with a live product is a business. If
> there's a field for an ABN and you haven't got one yet, that's the moment to
> wait rather than guess.

## What the product is

Your Personal Trainer is a web app that writes a strength training plan around
someone's goal, schedule and available equipment, then adjusts every target
from the sets they actually log. Its advice is grounded in 47 findings from
published research, each shown to the user with a link to the paper and a plain
statement of how strong the evidence is.

It is live, in early access, and free to use at present.

## Which APIs are being requested

Three, for two features. Each is listed with what it is actually for, and we
would rather start with a subset than overstate the need:

1. **Training API** — to publish the day's session to the user's watch as a
   structured workout.
2. **Activity API** — to receive the completed strength activity back, so the
   sets performed on the watch land in the app.
3. **Health API** — daily sleep summaries only.

Not the Women's Health API or the Courses API.

## The watch feature (Training API and Activity API)

The app writes a session — exercises in order, sets, a rep range and a target
weight for each, and a rest time between sets. Today someone follows that on a
phone, propped against a rack, logging each set as they go.

With the Training API we would publish that same session to the user's watch,
so it can be followed on the wrist: the exercise and its target, the sets
counted off, the rest timer running between them.

With the Activity API we would take the completed strength activity back and
record it as the day's logged workout. This matters because the whole app runs
on what was actually lifted: hitting the top of the rep range on every set
raises the target next time, falling short holds it. A session done on the
watch has to come back, or the plan stops adapting and the user has to re-enter
it by hand.

If Garmin would prefer to approve one of these rather than both, the Activity
API is the one we would keep: reading back what was done is what the app is
built on.

## What the sleep data will be used for

The app already asks people three questions before a workout: how they slept,
how sore they are, and whether anything hurts. A poor answer takes one set off
each exercise that day, and stops a session that falls short of target from
dropping the weight for next time — a bad night shouldn't be recorded as a
strength regression.

That check-in depends on someone answering honestly at 6am. A Garmin watch
already knows how they slept.

With the Health API we would:

1. Pre-fill the sleep answer in the pre-workout check-in from the user's most
   recent sleep summary, which they can override.
2. Use it exactly as the manual answer is used now: reduce the day's volume
   slightly after a poor night, and hold targets rather than lowering them.

This is grounded in the research the app already cites to users: acute sleep
loss measurably impairs physical performance (Craven et al., 2022, *Sports
Medicine*), and extending sleep improves performance in people who were
under-slept (Bonnar et al., 2018, *Sports Medicine*).

**We would not** use Garmin data for advertising, sell it, share it with any
third party, or use it to train models.

## What data would be stored, and where

- **Requested:** daily sleep summaries only (duration and sleep quality).
  Nothing else from the Health API unless a later feature needs it and the
  user agrees to it.
- **Stored:** in our Postgres database (Supabase, Singapore region), under
  row-level security so each user's rows are readable only by that user.
- **Retention:** kept while the user's account exists. Deleting the account
  deletes it immediately, as does disconnecting Garmin or withdrawing consent
  to health data in Settings.
- **Access tokens:** held server-side, never exposed to the browser.
  OAuth 2.0 with PKCE.

## Consent and privacy

Australian privacy law treats sleep data as sensitive health information, which
cannot be collected without express consent. The app already has a consent step
for health details, separate from the terms of use, which can be withdrawn at
any time from Settings — withdrawing deletes the data, not just the permission.

Connecting Garmin would be its own explicit opt-in, off by default, listing
exactly what is collected and why. Our privacy policy would name Garmin as a
recipient and disclose that the data is handled overseas.

Privacy policy: https://yourpersonaltrainer.vercel.app/privacy

## Expected volume

Early access, launched September 2026. [Say the real number of users you have —
if it's a handful, say a handful. Add: "growing through organic social and
word of mouth; no paid acquisition."]

## Devices

We do not sell, resell or distribute Garmin devices, and have no plans to. This
is a software integration for users who already own one.

---

## If they ask for a technical summary

> A Next.js web application hosted on Vercel, with Supabase (Postgres) for
> storage and authentication. The Garmin integration would run server-side:
> OAuth 2.0 with PKCE for account linking, a webhook endpoint to receive sleep
> summaries as they arrive, and storage of only the fields listed above.
> Tokens are held in server-only storage and never reach the browser.
