# 🚀 Quick Start Guide - Connecting Your Backend

## Current Status ✅

Your Brother Bright website is **already configured** to connect to Supabase!

- **Supabase URL:** `https://irigpadvcvetmwejeneu.supabase.co`
- **Connection:** Configured in `Index.html` (lines 10-14)
- **Code:** Ready in `script.js`

## 3-Step Setup (10 minutes)

### Step 1: Create the Database Table (5 min)

1. Go to: https://supabase.com/dashboard/project/irigpadvcvetmwejeneu
2. Click **SQL Editor** in the left menu
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  transaction TEXT NOT NULL CHECK (transaction IN ('sale', 'rent')),
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_transaction ON listings(transaction);
CREATE INDEX idx_listings_featured ON listings(featured);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listings"
  ON listings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert listings"
  ON listings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update listings"
  ON listings FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete listings"
  ON listings FOR DELETE USING (true);
```

5. Click **RUN** (bottom right)
6. You should see: ✅ "Success. No rows returned"

### Step 2: Create Storage Bucket (Optional - 3 min)

For storing property images on Supabase instead of in the database:

1. Go to **Storage** in left menu
2. Click **New Bucket**
3. Name: `property-images`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**
6. Click on the bucket → **Policies**
7. Click **New Policy** → **For full customization**
8. Add these 3 policies:

**Policy 1 - Public Read:**
```
Policy name: Public Access
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 2 - Public Upload:**
```
Policy name: Anyone can upload
Allowed operation: INSERT
Target roles: public
WITH CHECK expression: true
```

**Policy 3 - Public Delete:**
```
Policy name: Anyone can delete
Allowed operation: DELETE
Target roles: public
USING expression: true
```

### Step 3: Test It! (2 min)

1. Open your website (`Index.html`)
2. Open Browser Console (Press F12, click Console tab)
3. You should see: `✅ Supabase connected successfully`
4. Click **Upload Property** button (top right)
5. Login: `admin` / `admin@2025`
6. Fill the form and select images
7. Click **Save Listing**
8. Go to Supabase Dashboard → **Table Editor** → `listings`
9. You should see your property! 🎉

## How It Works

```
┌─────────────┐
│   Website   │
│ (Index.html)│
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│   script.js      │
│ - Detects Supabase│
│ - Uploads images  │
│ - Saves to DB     │
└──────┬───────────┘
       │
       ↓
┌─────────────────────┐
│   SUPABASE          │
│ ┌─────────────────┐ │
│ │  listings table │ │  ← Property data
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ property-images │ │  ← Images
│ │    (bucket)     │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## Features Now Working

✅ Upload property with multiple images  
✅ Automatically stores in Supabase  
✅ Fetches from Supabase on page load  
✅ Falls back to localStorage if offline  
✅ Works on all pages (Home, For Sale, For Rent, About Us)

## Troubleshooting

### "No add button" Issue
**Solution:** The button is there! It's called **"Save Listing"** at the bottom of the upload form.

Steps:
1. Click **Upload Property** (navbar)
2. Login
3. Fill form
4. Click **Save Listing** ← This is the "add" button

### Properties not showing?
- Check Console (F12) for errors
- Verify the SQL ran successfully
- Refresh the page

### Images not uploading?
- Create the storage bucket (Step 2 above)
- Check bucket is public
- Verify policies are created

### "Supabase not configured" in console?
- The keys are already in `Index.html` lines 13-14
- Make sure you're opening the file properly (use a web server or open in browser)

## Next Steps

1. ✅ **Test the upload** (most important!)
2. 🔒 **Secure the admin login** (use Supabase Auth instead of hardcoded password)
3. 🎨 **Customize the forms** (add more fields if needed)
4. 🚀 **Deploy** (Vercel, Netlify, or your hosting)

## Need Help?

1. Check browser console (F12)
2. Check Supabase logs: Dashboard → Logs
3. See full setup guide: `SUPABASE_SETUP.md`

---

**That's it! Your backend is connected. Start uploading properties!** 🏠

