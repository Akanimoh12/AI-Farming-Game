# 🔧 Fix Vercel "Cannot find module" Errors

## The Problem

You're seeing these errors on Vercel:
```
error TS2307: Cannot find module '@lib/wagmi/config'
error TS2307: Cannot find module '../lib/contracts/abis/GameRegistry.json'
```

**Why?** Vercel is building from the repository root, but your app is in the `frontend/` folder.

**Local build works?** Yes! This confirms it's a Vercel configuration issue.

---

## The Solution: Set Root Directory to `frontend`

### Option A: Fix Existing Vercel Project

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Find your project: **AI-Farming-Game**
   - Click on it

2. **Open Settings**
   - Click **Settings** in the top menu
   - Click **General** in the left sidebar

3. **Change Root Directory**
   - Scroll to **Build & Development Settings**
   - Find **Root Directory** (probably shows: `./`)
   - Click **Edit**
   - Enter: `frontend`
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click the three dots `...`
   - Click **Redeploy**
   - Watch the build logs

### Option B: Create New Vercel Project (Recommended if first time)

1. **Delete Old Project** (if it exists and is broken)
   - Go to Settings → General
   - Scroll to bottom
   - Click "Delete Project"

2. **Import Fresh**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select: **AI-Farming-Game**

3. **⚠️ BEFORE CLICKING DEPLOY:**
   - Find **Root Directory** setting
   - Click **Edit**
   - Enter: `frontend`
   - Click **Continue**

4. **Add Environment Variables** (all at once)
   ```
   VITE_CHAIN_ID=50312
   VITE_RPC_URL=https://dream-rpc.somnia.network
   VITE_WALLETCONNECT_PROJECT_ID=8fa4b535784defa6b860ee8c1dac3306
   VITE_ORANGE_TOKEN=0xb3474344dded8a5a272d8f7a664c0c521b0b97f9
   VITE_LAND_NFT=0x4c56e478dc65a4ef64aa6808d1a704f48fa3eba2
   VITE_BOT_NFT=0xade9f9c342af0570ed7a2eff4db6647f56fbc95f
   VITE_WATER_TOKEN=0xa8f3cab7ac4bcf903992b52a439083bd160a2f7c
   VITE_MARKETPLACE=0x8ce440485714900ac0f0ff8474328d1914960a7b
   VITE_HARVEST_SETTLEMENT=0xc460528fdd9b900624ad3984763d42330ef74d41
   VITE_GAME_REGISTRY=0xb16b618c534cbe35c63e3cf75e704a43ac591213
   VITE_REALTIME_HARVEST=0x098b7e17b3a6ba56d49b92b33f9b58e4872fae22
   ```

5. **Deploy**
   - Click **Deploy**
   - Build will succeed! ✅

---

## Visual Guide

### What Vercel Sees (WRONG):
```
Repository Root
├── contracts/          ← Vercel builds here (NO package.json!)
├── frontend/           ← Your app is here
│   ├── src/
│   ├── package.json    ← But Vercel can't find it
│   └── ...
└── README.md
```

### What You Want Vercel to See (CORRECT):
```
Root Directory: frontend
├── src/
│   ├── lib/
│   │   ├── wagmi/
│   │   └── contracts/
│   └── ...
├── package.json        ← Now Vercel finds this!
├── tsconfig.json
└── vite.config.ts
```

---

## How to Verify It's Fixed

After changing Root Directory and redeploying:

### ✅ Success Indicators:
```
Building...
Installing dependencies...
✓ node_modules installed
Running build command: npm run build
> frontend@0.0.0 build
> tsc -b && vite build
✓ 7180 modules transformed
✓ built in 34.56s
```

### ❌ Still Wrong Indicators:
```
error TS2307: Cannot find module '@lib/wagmi/config'
Cannot find package.json
```

---

## Quick Checklist

Before redeploying, verify:

- [ ] Root Directory is set to `frontend` (not `./`)
- [ ] Framework Preset shows: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] All 11 environment variables added

---

## Still Not Working?

### Check These:

1. **Root Directory Actually Changed?**
   - Go to Settings → General
   - Look at "Root Directory"
   - Should say: `frontend`
   - If it says `./` you need to change it

2. **Did You Redeploy After Changing?**
   - Changing settings doesn't auto-redeploy
   - Must manually trigger redeploy

3. **Check Build Logs**
   - Deployments tab → Click on deployment
   - Look at build logs
   - Should see: "Working Directory: /vercel/path/frontend"

---

## Contact Me If...

- You've set Root Directory to `frontend` ✓
- You've redeployed ✓  
- Build still fails with "Cannot find module" errors ✗

Then we'll need to check something else. But 99% of the time, this fixes it!

---

**TL;DR:** Set Root Directory to `frontend` in Vercel Settings → General → Root Directory → Edit → Save → Redeploy
