# Deployment Guide for Vercel

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in/sign up
2. Click "Add New Project"
3. Import your Git repository OR drag and drop the project folder
4. Vercel will auto-detect Vite and configure it automatically
5. Click "Deploy"

## Option 2: Deploy via Vercel CLI

1. Open terminal in this directory
2. Run: `vercel login` (follow the browser authentication)
3. Run: `vercel --prod` to deploy to production

## Option 3: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect and deploy

## Build Configuration

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

The `vercel.json` file is already configured for optimal deployment.
