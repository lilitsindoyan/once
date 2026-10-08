# ONCE — Bottle Ownership Platform

Public landing, user portal, bottle registry and admin panel for ONCE (ToR v1.2, User Flow of 06 Oct 2026).

## What's in it

| Area | Routes | Notes |
| --- | --- | --- |
| Landing | `/[lang]` | Figma landing frames 99–122: intro, loader, scroll scenes, side menu, live owner map, Contact form. |
| Login / register | `/[lang]/login` | Email + 6-digit one-time code. One screen for login and registration. |
| Claim | `/[lang]/claim` (the general QR code points to `/claim`) | Serial + hidden code, checked before login. |
| My Bottles, passport | `/[lang]/my-bottles`, `/[lang]/my-bottles/[serial]` | Current owner only; the hidden code is never sent to the portal. |
| Transfer | `/[lang]/my-bottles/[serial]/transfer` | Privacy → email ×2 → warning → sent / account closed. |
| Accept | `/[lang]/accept/[token]` | Single-use link, only for the invited email, no expiry. |
| Profile | `/[lang]/profile` | Name, email change with code, email language; country read-only. |
| Bottle Owners | `/[lang]/owners` | Public list of named current owners, search, newest first. |
| Admin | `/admin` | Dashboard, series + code generation + CSV/QR, bottles, customers, owners, map pins, Contact messages, emails, language strings, 2FA. |

Languages: `hy`, `en`, `ru`. UI strings live in `messages/*.json`; admins can override any of them in
Admin → Language strings. Armenian and Russian texts are working drafts until the client supplies final translations.

**Landing images** are placeholders cropped from screenshots until the Figma assets are exported. Replace the files in
`public/landing/` with the real images under the same names (no code change): `hero.jpg` (bottle, frame 108),
`about.jpg` (112), `craft.jpg` (120), `product.jpg` (121/122), `workshop.jpg` (109), `history.jpg` (113),
`unveil.jpg` (114–116), `loader.jpg` (100–103). The world map is `public/landing/world.svg`
(generated from Natural Earth country shapes; pins use the same projection in `src/lib/map-projection.ts`).
The Instagram / Facebook links in the Contact section are placeholders.

The portal screens follow the Figma portal design. They use the ONCE style from the landing design
(black, copper `#b27649`, cream `#d3c3af`, Didot / Cormorant Garamond / Montserrat) and are responsive.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · next-intl · PostgreSQL + Prisma · jose (JWT cookies) ·
bcrypt + TOTP (otplib) for admins · Postmark for email (or console output in development).

## Run it locally

Requirements: Node 20+, PostgreSQL 14+.

```bash
cp .env.example .env            # then fill in the secrets (openssl rand -base64 48)
npm install
npm run db:migrate              # creates the tables
npm run db:seed:demo            # first admin + a demo series of 20 bottles (prints 3 serial/code pairs)
npm run dev                     # http://localhost:3000
```

Admin: `http://localhost:3000/admin`, with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.
Turn on two-factor authentication in Admin → My account.

With `EMAIL_PROVIDER="console"` every email (including login codes) is printed in the server log.

## Checks

```bash
npm run typecheck
npm run lint
npm test                                        # unit tests (serials, codes, encryption, redirects)
npm run build && npm start > server.log 2>&1 &  # then:
node scripts/e2e.mjs http://localhost:3000 server.log   # 51 end-to-end checks of every user flow
```

The end-to-end script needs `npm run db:seed:demo` first (it uses unclaimed demo bottles).

## How it works

```
src/
  app/[locale]/…          portal pages (server components + small client flows)
  app/admin/…             admin pages; mutations are server actions in app/admin/actions.ts
  app/api/…               JSON API used by the portal (and admin file downloads)
  server/                 business rules — one file per flow (auth, claim, bottles, transfer, profile, owners)
  server/admin/           admin rules (series, bottles, customers, content, auth)
  lib/                    crypto, sessions, email, env, country capitals
prisma/schema.prisma      data model
messages/*.json           UI strings
```

Key rules, and where they live:

- **Claim check** (`server/claim.ts`): wrong serial and wrong code return the same error; 5 failures in 15 minutes per
  client block further tries; the bottle is remembered in a signed cookie through login/registration.
- **One open account per email**: a partial unique index (`User_email_open_key`). Closed accounts keep their email,
  so a returning buyer gets a new account and admin sees both.
- **Transfer** (`server/transfer.ts`): on confirm the bottle goes to In Transfer and leaves the sender at once; the
  sender's ownership period closes with the privacy choice made at transfer; last bottle out → account Closed and
  logged out. Link tokens are stored hashed.
- **Ownership history** = `OwnershipPeriod` rows. The open period is the current owner; it also drives Bottle Owners.
- **Hidden codes** are encrypted (AES-256-GCM) with `HIDDEN_CODE_KEY`, readable by admins only. Never change that key
  once bottles exist.
- **Map pins** (`server/pins.ts`): added on the capital of the owner's country at the first claim or acceptance from
  that country (`lib/capitals.ts`). Admin can move, hide or add pins. `/api/map-pins` serves them to the landing.
- **Passport fields** are defined per series. Values set on the series apply to every bottle; a value set on one
  bottle replaces it for that bottle.
- **Admin cancel** returns the bottle to the sender and reopens a closed sender account — unless that person has
  since opened a new account with the same email; then the bottle goes to the new account.

## Deploy

Any Node host with PostgreSQL works (Vercel + Neon/Supabase is the default plan). Per environment:

1. Set every variable from `.env.example` (`APP_URL` = the public URL; `EMAIL_PROVIDER="postmark"` + `POSTMARK_TOKEN`).
2. `npm run db:deploy` to apply migrations, then `npm run db:seed` once to create the first admin.
3. `npm run build && npm start`.

**Never set `DEMO_OTP_CODE` on a real deployment.** It makes every email code the same value, for demos only.

## Open points (see the dev handoff doc)

- Serial and hidden-code format, contact link and email sender domain are to be confirmed by the client.
- Didot needs a web licence; GFS Didot stands in for now.
- Portal screens will be restyled when the designs arrive.
