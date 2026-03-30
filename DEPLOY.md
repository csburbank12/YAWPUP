# YAWP — Deployment Guide

## Overview

Yawp deploys as two pieces:
- **Frontend + API** → Vercel (free tier works fine)
- **Database + Auth** → Supabase (free tier works fine)

---

## Part 1: Push to GitHub

You need a GitHub account. If you don't have one, create one free at github.com.

### Install Git (if needed)
- **Mac**: Open Terminal, type `git --version`. If not installed, it will prompt you to install it.
- **Windows**: Download from https://git-scm.com/download/win

### Push your project

Open a terminal in your `yawp` folder and run these commands one at a time:

```bash
git init
git add .
git commit -m "Initial Yawp commit"
```

Then:
1. Go to github.com → click **New repository**
2. Name it `yawp`, set it to **Private**, click **Create repository**
3. GitHub will show you commands — run the ones under **"push an existing repository"**

They'll look like this:
```bash
git remote add origin https://github.com/YOURUSERNAME/yawp.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy on Vercel

1. Go to https://vercel.com and sign up (use your GitHub account — easiest)
2. Click **Add New → Project**
3. Find your `yawp` repo and click **Import**
4. Under **Environment Variables**, add these (copy from your `.env.local`):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your supabase service role key |
   | `NEXT_PUBLIC_SITE_URL` | https://yawp.vercel.app (or your custom domain) |

5. Click **Deploy**

Vercel builds and deploys in about 60 seconds. You'll get a URL like `yawp-abc123.vercel.app`.

---

## Part 3: Update Supabase Auth Settings

Once deployed, tell Supabase about your live URL:

1. Go to your Supabase project → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://yawp.vercel.app`)
3. Under **Redirect URLs**, add: `https://yawp.vercel.app/**`
4. Click **Save**

This ensures email confirmation links and OAuth redirects work correctly.

---

## Part 4: Custom Domain (optional)

If you want `yawp.social` or similar:

1. Buy a domain at Namecheap, Cloudflare, or Google Domains (~$10-15/year)
2. In Vercel → your project → **Settings → Domains** → add your domain
3. Vercel gives you DNS records to add at your registrar
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your new domain
5. Update Supabase Site URL to match

---

## Redeploying after changes

Every time you push to GitHub, Vercel automatically redeploys:

```bash
git add .
git commit -m "describe your change"
git push
```

That's it. Vercel picks it up automatically.

---

## Monitoring & Logs

- **Vercel dashboard** → your project → **Functions** tab shows serverless function logs
- **Supabase dashboard** → **Logs** shows database queries and auth events
- Both have free tiers that are more than enough for early-stage Yawp

---

## Supabase Free Tier Limits (for reference)

| Resource | Free Limit |
|----------|-----------|
| Database | 500MB |
| Auth users | Unlimited |
| Storage | 1GB |
| Realtime connections | 200 concurrent |
| API requests | Unlimited |

You won't hit these limits until Yawp has thousands of active users.

---

## Environment Variables Checklist

Before deploying, make sure these are set in Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` (your actual deployed URL)
