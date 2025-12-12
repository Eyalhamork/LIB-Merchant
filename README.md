# ShopManager

A cloud-based PWA inventory and sales management system for retail shops in Liberia.

## Overview

ShopManager helps retail shop owners:
- **Stop employee theft** through accountability and audit trails
- **Gain complete inventory control** with real-time tracking
- **Manage credit sales** and customer accounts
- **Track cash sessions** with automatic reconciliation
- **Work offline** with automatic sync when online

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Image Storage:** Cloudinary
- **State Management:** Zustand
- **Hosting:** Vercel (frontend), Supabase (backend)
- **PWA:** Service Worker + IndexedDB

## Prerequisites

- Node.js 18+ installed
- npm or pnpm installed
- Supabase account (free tier)
- Cloudinary account (free tier)
- Vercel account (free tier)

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd shopmanager
npm install
\`\`\`

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to SQL Editor
4. Copy the contents of `/SHOPMANAGER_DATABASE_SCHEMA.sql` from project files
5. Paste and run the SQL
6. Verify tables were created under "Table Editor"
7. Go to Settings > API
8. Copy your Project URL and anon/public key

### 3. Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) and create account
2. Go to Settings > Upload
3. Create an unsigned upload preset:
   - Name it something like "shopmanager_uploads"
   - Set Signing Mode to "Unsigned"
   - Set Folder to "shopmanager"
   - Enable "Unique filename"
4. Copy your Cloud Name from Dashboard
5. Copy the Upload Preset name

### 4. Configure Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your credentials:

\`\`\`env
# From Supabase Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Cloudinary Dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=shopmanager_uploads

# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ShopManager
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 6. Generate TypeScript Types from Supabase

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Generate types
npm run generate-types
\`\`\`

Replace `YOUR_PROJECT_ID` with your actual project ID from Supabase dashboard.

## Project Structure

\`\`\`
shopmanager/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root redirect
├── components/              # React components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   ├── pos/                # POS-specific components
│   ├── dashboard/          # Dashboard components
│   ├── forms/              # Form components
│   └── shared/             # Shared components
├── lib/                     # Utilities and configs
│   ├── supabase/           # Supabase client configs
│   ├── utils.ts            # Helper functions
│   └── constants.ts        # App constants
├── hooks/                   # Custom React hooks
├── store/                   # Zustand state stores
├── types/                   # TypeScript types
├── public/                  # Static assets
│   ├── icons/              # PWA icons
│   └── manifest.json       # PWA manifest
└── styles/                  # Global styles
    └── globals.css         # Tailwind + custom CSS
\`\`\`

## Development Workflow

### Creating New Components

\`\`\`bash
# Example: Create a Button component
touch components/ui/button.tsx
\`\`\`

### Adding New Pages

\`\`\`bash
# Example: Create a Reports page
mkdir -p app/(dashboard)/reports
touch app/(dashboard)/reports/page.tsx
\`\`\`

### Testing Database Connection

Create a test page to verify Supabase connection:

\`\`\`typescript
// app/test/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .limit(1);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      {error ? (
        <p className="text-red-600">Error: {error.message}</p>
      ) : (
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
\`\`\`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run generate-types` - Generate Supabase types

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
5. Deploy!

## Features Roadmap

See `SHOPMANAGER_IMPLEMENTATION_CHECKLIST.md` for detailed implementation plan.

### Phase 0: Pre-Development Setup ✅
- [x] Project initialization
- [x] Database schema
- [x] Environment setup

### Week 1-2: Foundation (In Progress)
- [ ] Authentication
- [ ] Base UI components
- [ ] Layout structure

### Week 3-4: Core Features
- [ ] Product management
- [ ] POS/Sales interface
- [ ] Split payments
- [ ] Customer credit system
- [ ] Cash sessions

### Week 5-6: Dashboard & Management
- [ ] Returns & exchanges
- [ ] Owner dashboard
- [ ] Reports
- [ ] Employee management
- [ ] Inventory management

### Week 7-8: Polish & Testing
- [ ] Offline support
- [ ] PWA features
- [ ] Testing
- [ ] Beta testing

### Week 9-12: Launch Preparation
- [ ] Onboarding flow
- [ ] Product catalog seeding
- [ ] Documentation
- [ ] Training materials
- [ ] Go live

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved

## Support

For support, contact:
- Email: [your-email]
- WhatsApp: [your-whatsapp]

---

**Last Updated:** 2024-11-29
