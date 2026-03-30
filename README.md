# YAWP — Setup Guide

## Step 1: Install Node.js

If you don't have Node.js installed:

1. Go to https://nodejs.org
2. Download the **LTS** version (the one labeled "Recommended for most users")
3. Run the installer — click through the defaults
4. Open a terminal (Mac: Spotlight → "Terminal", Windows: Start → "Command Prompt")
5. Type `node --version` and press Enter — you should see a version number like `v20.x.x`

---

## Step 2: Install dependencies

Open a terminal, navigate to this folder, and run:

```bash
cd yawp
npm install
```

This installs everything Yawp needs. It takes about a minute.

---

## Step 3: Set up Supabase (your database)

1. Go to https://supabase.com and create a free account
2. Click **New Project**, name it `yawp`, pick a region close to you
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** (left sidebar)
5. Click **New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - **anon public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - **service_role key** → paste as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

Your `.env.local` should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 4: Run it locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser. That's Yawp running on your machine.

---

## Step 5: Deploy to Vercel (put it on the internet)

1. Go to https://vercel.com and create a free account
2. Push this project to GitHub (or drag the folder into Vercel)
3. In Vercel, click **New Project** → import your repo
4. Under **Environment Variables**, add the same values from your `.env.local`
5. Click **Deploy**

Vercel gives you a live URL instantly (e.g. `yawp.vercel.app`).

---

## Project Structure

```
yawp/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & signup pages
│   │   ├── (main)/          # Feed, Circles, Discover, Profile
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── feed/            # PostCard, Composer, FeedClient
│   │   ├── circles/         # CirclesList, CircleChat
│   │   ├── discover/        # DiscoverClient
│   │   ├── profile/         # ProfileClient
│   │   └── ui/              # NavBar, Avatar
│   ├── lib/supabase/        # Database clients
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Auth routing
├── supabase/
│   └── schema.sql           # Run this in Supabase SQL Editor
├── .env.local               # Your environment variables (fill this in)
└── README.md                # This file
```

---

## What's built

- ✅ Landing page
- ✅ Sign up / Sign in
- ✅ Chronological feed with hearts & echoes
- ✅ Post composer with hashtag detection
- ✅ Circles — community rooms with real-time chat
- ✅ Discover — trending tags + people search + follow
- ✅ Profile — edit bio, view your posts, Yawp+ CTA
- ✅ Auth-protected routes via middleware
- ✅ Row-level security on all data

## What's next

- Stripe integration for Yawp+ subscriptions
- Replies / threads
- React Native mobile app
- Yawp Radio (community listening rooms)
- Direct messages
