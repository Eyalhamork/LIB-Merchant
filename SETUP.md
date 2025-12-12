# ShopManager - Setup Instructions

Follow these steps to get ShopManager running locally and deployed.

## Phase 0: Pre-Development Setup

### Step 1: Create Required Accounts (15 minutes)

#### Supabase (Database & Auth)
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - Project name: `shopmanager` (or your choice)
   - Database password: Generate a strong password and **SAVE IT**
   - Region: Choose closest to Liberia (e.g., eu-west-1)
6. Click "Create new project"
7. Wait ~2 minutes for database to initialize
8. ✅ **SAVE:** Project URL and API keys (Settings > API)

#### Cloudinary (Image Storage)
1. Go to https://cloudinary.com
2. Sign up for free account
3. Verify email
4. Go to Settings > Upload
5. Add Upload Preset:
   - Click "Add upload preset"
   - Preset name: `shopmanager_uploads`
   - Signing Mode: **Unsigned**
   - Folder: `shopmanager`
   - Unique filename: **Enabled**
   - Save
6. ✅ **SAVE:** Cloud Name (from Dashboard) and Upload Preset name

#### Vercel (Hosting)
1. Go to https://vercel.com
2. Sign up with GitHub
3. No project setup yet - we'll do this later
4. ✅ Account created

#### GitHub (Code Repository)
1. Go to https://github.com
2. Create new repository:
   - Name: `shopmanager`
   - Private repository
   - Don't initialize with README (we have one)
3. ✅ **SAVE:** Repository URL

---

### Step 2: Local Development Environment (10 minutes)

#### Install Node.js
1. Check if installed: `node --version`
2. If not: Download from https://nodejs.org (v18 or higher)
3. Install and verify: `node --version` should show v18+

#### Install pnpm (optional but recommended)
\`\`\`bash
npm install -g pnpm
\`\`\`

Or use npm (comes with Node.js):
\`\`\`bash
# Verify npm is installed
npm --version
\`\`\`

#### Clone Project Files
\`\`\`bash
# Navigate to where you want the project
cd ~/projects

# Clone the repository (use your GitHub URL)
git clone <your-github-url> shopmanager

# Enter project directory
cd shopmanager

# Install dependencies
npm install
# OR
pnpm install
\`\`\`

---

### Step 3: Database Setup (10 minutes)

1. **Open Supabase Project**
   - Go to https://app.supabase.com
   - Click on your `shopmanager` project

2. **Run Database Schema**
   - Click "SQL Editor" in sidebar
   - Click "New query"
   - Open `SHOPMANAGER_DATABASE_SCHEMA.sql` from project files
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL editor
   - Click "Run" button
   - Wait for completion (should see "Success" messages)

3. **Verify Tables Created**
   - Click "Table Editor" in sidebar
   - You should see tables:
     * shops
     * profiles
     * products
     * shop_products
     * customers
     * transactions
     * transaction_items
     * transaction_payments
     * cash_sessions
     * credit_payments
     * returns
     * return_items
     * stock_movements
     * activity_log
     * price_history

4. **Get API Credentials**
   - Click "Settings" > "API" in sidebar
   - Copy the following:
     * Project URL (looks like: `https://xxxxx.supabase.co`)
     * `anon` `public` key (long JWT token)
     * `service_role` `secret` key (even longer JWT token)
   - ✅ **IMPORTANT:** Keep these secure!

---

### Step 4: Configure Environment Variables (5 minutes)

1. **Copy example env file**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Edit `.env.local`**
   Open the file in your editor and fill in:

   \`\`\`env
   # Supabase - from Settings > API
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Cloudinary - from Dashboard
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=shopmanager_uploads

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=ShopManager
   \`\`\`

3. **Save the file**

---

### Step 5: Test Local Setup (5 minutes)

1. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Open browser**
   - Go to http://localhost:3000
   - You should see a redirect to `/login`
   - The login page should load (even if it's basic/unstyled for now)

3. **Check for errors**
   - Look at terminal for any errors
   - Open browser console (F12) for errors
   - If you see errors about environment variables, double-check `.env.local`

4. **Test database connection** (optional)
   - Create file `app/test/page.tsx`:
   \`\`\`typescript
   import { createClient } from '@/lib/supabase/server';

   export default async function TestPage() {
     const supabase = await createClient();
     const { data, error } = await supabase.from('shops').select('*').limit(1);
     
     return (
       <div className="p-8">
         <h1 className="text-2xl font-bold">Database Test</h1>
         {error ? <p>Error: {error.message}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
       </div>
     );
   }
   \`\`\`
   - Visit http://localhost:3000/test
   - Should show empty array `[]` (no shops yet) - that's good!

---

### Step 6: Push to GitHub (5 minutes)

\`\`\`bash
# Add files
git add .

# Commit
git commit -m "Initial ShopManager setup"

# Add remote (if not already added)
git remote add origin <your-github-url>

# Push
git push -u origin main
\`\`\`

---

## ✅ Phase 0 Complete!

You should now have:
- [x] Supabase project with database schema
- [x] Cloudinary account configured
- [x] Local development environment running
- [x] Code pushed to GitHub
- [x] Environment variables configured

## Next Steps

Proceed to **Week 1-2: Foundation** in the implementation checklist:
1. Build authentication pages (login/register)
2. Create base UI components
3. Set up layout structure

---

## Troubleshooting

### Database Connection Issues
- **Error:** "Invalid API key"
  - **Fix:** Double-check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Ensure no extra spaces or quotes

### Build Errors
- **Error:** "Cannot find module '@/...' "
  - **Fix:** Run `npm install` again
  - Check `tsconfig.json` has paths configured

### Supabase Schema Errors
- **Error:** "relation already exists"
  - **Fix:** Tables were already created. Either:
    1. Drop tables and re-run schema, OR
    2. Continue (tables are fine)

### Port Already in Use
- **Error:** "Port 3000 is already in use"
  - **Fix:** Stop other processes using port 3000, OR
  - Run on different port: `npm run dev -- -p 3001`

---

## Support

Having issues? Contact:
- Developer: [Your contact info]
- Documentation: See `README.md` and `SHOPMANAGER_PROJECT_CONTEXT.md`
