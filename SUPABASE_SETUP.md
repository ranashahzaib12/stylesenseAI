# Supabase Project Setup — StyleSense.AI

Complete step-by-step guide to recreate the Supabase backend from scratch.

---

## Step 1 — Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose your organization
4. Set a **Project Name** (e.g. `style-sense`)
5. Set a strong **Database Password** (save it)
6. Choose a **Region** closest to your users
7. Click **Create new project** and wait for it to provision (~2 min)

---

## Step 2 — Get Your Credentials

After the project is ready:

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → e.g. `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** → the long JWT string under "Project API keys"

3. Open [lib/supabaseClient.ts](lib/supabaseClient.ts) and replace both values:

```ts
const SUPABASE_URL = 'YOUR_NEW_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_NEW_ANON_KEY';
```

---

## Step 3 — Authentication Setup

1. Go to **Authentication → Providers**
2. Ensure **Email** provider is **enabled** (it is by default)
3. Under **Email** settings:
   - **Confirm email**: You can turn this **OFF** for development so users can log in immediately without email confirmation
   - If you want email confirmation ON for production, leave it enabled

> The app uses `signUp()` and `signInWithPassword()` — no OAuth providers (Google, GitHub, etc.) are needed.

---

## Step 4 — Database Tables

Go to **SQL Editor** in the Supabase dashboard and run each block below **in order**.

---

### 4.1 — `profiles` Table

Stores each user's style quiz answers, linked 1:1 to `auth.users`.

```sql
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  quiz_data jsonb,
  updated_at timestamp with time zone,
  primary key (id)
);
```

---

### 4.2 — `tryon_history` Table

Stores every completed virtual try-on result for a user.

```sql
create table public.tryon_history (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  garment_name text,
  garment_image_url text,
  created_at timestamp with time zone default now(),
  primary key (id)
);
```

---

### 4.3 — `feedback` Table

Stores star ratings and comments submitted by users.

```sql
create table public.feedback (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating integer not null,
  comment text,
  created_at timestamp with time zone default now(),
  primary key (id)
);
```

---

## Step 5 — Enable Row Level Security (RLS)

Run this in the **SQL Editor** to enable RLS on all three tables:

```sql
alter table public.profiles enable row level security;
alter table public.tryon_history enable row level security;
alter table public.feedback enable row level security;
```

---

## Step 6 — RLS Policies

Run all of the following in the **SQL Editor**.

---

### 6.1 — `profiles` Policies

Users can only read and write their own profile row.

```sql
-- SELECT: user can read their own profile
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

-- INSERT: user can create their own profile
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- UPDATE: user can update their own profile
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
```

---

### 6.2 — `tryon_history` Policies

Users can only read and insert their own try-on records.

```sql
-- SELECT: user can read their own history
create policy "Users can view own tryon history"
on public.tryon_history
for select
using (auth.uid() = user_id);

-- INSERT: user can save their own try-on results
create policy "Users can insert own tryon history"
on public.tryon_history
for insert
with check (auth.uid() = user_id);

-- DELETE: user can delete their own records
create policy "Users can delete own tryon history"
on public.tryon_history
for delete
using (auth.uid() = user_id);
```

---

### 6.3 — `feedback` Policies

Any authenticated user can submit feedback. No read-back needed.

```sql
-- INSERT: authenticated users can submit feedback
create policy "Authenticated users can insert feedback"
on public.feedback
for insert
with check (auth.role() = 'authenticated');
```

---

## Step 7 — Storage Bucket

### 7.1 — Create the Bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Set name exactly as: `tryons`
4. Toggle **Public bucket** → **ON**
5. Click **Save** (or **Create bucket**)

> Setting the bucket to **Public** means anyone can view/download images — Supabase handles read access automatically. You do **not** need a SELECT policy.

---

### 7.2 — Storage Policies (Upload & Delete Only)

> **Important:** Do NOT go to Storage → Policies to run SQL. Instead, go to the **SQL Editor** in the left sidebar and run the two blocks below separately.

**Block 1 — Upload policy** (paste and run this alone):

```sql
create policy "Users can upload to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tryons'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

**Block 2 — Delete policy** (paste and run this alone):

```sql
create policy "Users can delete own images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tryons'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

> Files are stored as `{userId}/{timestamp}.png` — the first folder segment is always the user's UUID, which is how the policy enforces ownership.
>
> The `to authenticated` keyword ensures anonymous users can never upload or delete files.

---

## Step 8 — Verify Everything

Run this verification query in the **SQL Editor** to confirm all tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected output:
```
feedback
profiles
tryon_history
```

Run this to confirm RLS is enabled:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

All three tables should show `rowsecurity = true`.

---

## Step 9 — Summary Checklist

| Task | Done |
|------|------|
| Create Supabase project | ☐ |
| Copy Project URL + Anon Key | ☐ |
| Update `lib/supabaseClient.ts` | ☐ |
| Enable Email auth provider | ☐ |
| Create `profiles` table | ☐ |
| Create `tryon_history` table | ☐ |
| Create `feedback` table | ☐ |
| Enable RLS on all 3 tables | ☐ |
| Add RLS policies for `profiles` | ☐ |
| Add RLS policies for `tryon_history` | ☐ |
| Add RLS policies for `feedback` | ☐ |
| Create `tryons` storage bucket (public ON) | ☐ |
| Add storage Upload policy (SQL Editor) | ☐ |
| Add storage Delete policy (SQL Editor) | ☐ |
| Restart dev server (`npm run dev`) | ☐ |

---

## Data Reference

### `profiles.quiz_data` JSONB Shape

```json
{
  "vibe": "Casual | Chic | Edgy | Bohemian",
  "bodyType": "Hourglass | Pear | Apple | Rectangle",
  "gender": "Men | Women | Prefer Not To Say",
  "heightFt": 5,
  "heightIn": 8,
  "bust": 34,
  "waist": 28,
  "hips": 38,
  "season": "Summer | Winter | Spring | Fall",
  "occasion": "Streetwear | Old Money | Casual | Formal"
}
```

### Storage File Path Pattern

```
tryons/{userId}/{timestamp}.png
```

Example:
```
tryons/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1716041234567.png
```
