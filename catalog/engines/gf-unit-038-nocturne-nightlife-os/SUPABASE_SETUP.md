# Nocturne Nightlife OS — 3-Minute Supabase Quickstart

Welcome to **Nocturne Nightlife OS**. Follow these 3 simple steps to connect your live Supabase database for VIP bottle tables, live stage lineup scheduling, and cellar reserve inventory:

---

### Step 1: Create Supabase Project
1. Log into your dashboard at [Supabase.com](https://supabase.com).
2. Click **New Project** and name it `premium-nightlife-os`.
3. Choose your nearest region and copy your **Project URL** and **Anon Public Key**.

---

### Step 2: Run Database Migrations & Seeds
1. Open the **SQL Editor** tab in your Supabase dashboard.
2. Open `supabase/schema.sql` from this folder, paste the entire contents into the SQL Editor, and click **RUN**.
3. Open `supabase/seed.sql`, paste the contents, and click **RUN** to seed initial mock tables and artists.

---

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Restart your Vite development server:
```bash
npm run dev
```

Your Nocturne Nightlife OS is now 100% turnkey and synced with real-time cloud data!
