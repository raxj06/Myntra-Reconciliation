# 🚀 Deployment Guide - Myntra Reconciliation

## Quick Deploy Options

### Option 1: Railway (Backend) + Vercel (Frontend) ✅ Recommended

#### Backend on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `raxj06/Myntra-Reconciliation`
4. Set **Root Directory**: `backend`
5. Add environment variables:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   CORS_ORIGINS=https://your-app.vercel.app
   ```
6. Deploy! Railway auto-detects Node.js

#### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import `raxj06/Myntra-Reconciliation`
4. Set **Root Directory**: `frontend`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
6. Deploy!

---

### Option 2: Render (Backend) + Netlify (Frontend)

#### Backend on Render
1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Set **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables in Render dashboard

#### Frontend on Netlify
1. Go to [netlify.com](https://netlify.com)
2. Add new site → Import from Git
3. Set **Base directory**: `frontend`
4. **Build command**: `npm run build`
5. **Publish directory**: `frontend/dist`
6. Add `VITE_API_URL` in environment variables

---

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor and run the schema from `backend/supabase_schema.sql`
4. Copy Project URL and anon key from Settings → API

---

## After Deployment

1. Update backend `CORS_ORIGINS` with your frontend URL
2. Update frontend `VITE_API_URL` with your backend URL
3. Redeploy both services
4. Test the application!

---

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGINS` in backend includes your frontend URL
- No trailing slash in URLs

### API Not Working
- Check backend logs in Railway/Render dashboard
- Verify Supabase credentials are correct

### Database Errors
- Run the SQL schema in Supabase SQL Editor
- Check RLS policies are disabled for MVP
