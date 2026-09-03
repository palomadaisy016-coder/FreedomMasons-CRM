# Freedom Masons CRM

A small team CRM: leads, projects, invoices, and tasks, with separate logins
per teammate. Built with Next.js + Supabase (database + auth), deployed on
Vercel — both have free tiers that are enough for a small team.

Total setup time: about 15 minutes, no coding required.

## 1. Create the database (Supabase)

1. Go to https://supabase.com and sign up (free).
2. Click **New project**. Pick any name and a database password (save it
   somewhere safe — you likely won't need it again).
3. Once the project is ready, open the **SQL Editor** in the left sidebar.
4. Click **New query**, paste in the entire contents of `supabase-schema.sql`
   from this project, and click **Run**. This creates the four tables
   (leads, projects, invoices, tasks) and the permission rules.
5. In the left sidebar, go to **Project Settings -> API**. You'll need two
   values from this page in step 3 below:
   - **Project URL**
   - **anon public** key

## 2. Add your team as users

1. In Supabase, go to **Authentication -> Users**.
2. Click **Add user -> Create new user** for each teammate. Set an email and
   a temporary password for each person (they can change it later, or you
   can add a "forgot password" flow — see note at the bottom).
3. That's your login list. No public sign-up page exists in this app on
   purpose, so only people you add can get in.

## 3. Deploy the app (Vercel)

1. Go to https://vercel.com and sign up (free) — signing up with GitHub is
   easiest.
2. Push this project to a GitHub repository (create a new repo on GitHub,
   then follow GitHub's "push an existing folder" instructions), or use
   Vercel's CLI/drag-and-drop import if you'd rather not use GitHub.
3. In Vercel, click **Add New -> Project** and import the repository.
4. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from Supabase step 1.5
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key from the same page
5. Click **Deploy**. After a minute or two you'll get a live URL like
   `freedom-masons-crm.vercel.app` — that's your CRM's permanent address.
   You can later attach a custom domain (e.g. `crm.freedommasons.com`) for
   free in Vercel's project settings under **Domains**.

## 4. Try it

Visit your new URL, sign in with one of the accounts you created in step 2,
and you're in. Any teammate who signs in sees and edits the same shared
leads, projects, invoices, and tasks.

## Running it locally (optional, for making changes)

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run dev
```

Visit http://localhost:3000.

## Notes

- **Password resets**: this build uses email/password login without a
  "forgot password" email flow, to keep setup simple. If a teammate forgets
  their password, reset it for them in Supabase under
  **Authentication -> Users**. Ask if you'd like a self-serve reset flow
  added — it's a small addition.
- **Everyone sees everything**: all signed-in teammates share one pool of
  data (no per-person permissions or private records). That fits a small
  team; say so if you'd like role-based access (e.g. admins vs. viewers)
  instead.
- **Costs**: Supabase and Vercel are both free at this scale. You'd only
  hit a paid tier with heavy usage (thousands of records/requests) or if
  you want extras like a custom domain email.
