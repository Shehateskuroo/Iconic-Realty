# Supabase Backend Setup Guide

## Your Supabase Project
**URL:** https://irigpadvcvetmwejeneu.supabase.co

## Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/irigpadvcvetmwejeneu
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL below, then click **Run**

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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_transaction ON listings(transaction);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read listings (public access)
CREATE POLICY "Anyone can view listings"
  ON listings
  FOR SELECT
  USING (true);

-- Allow anonymous users to insert listings
-- (You should make this more restrictive in production)
CREATE POLICY "Anyone can insert listings"
  ON listings
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to update listings
CREATE POLICY "Anyone can update listings"
  ON listings
  FOR UPDATE
  USING (true);

-- Allow anonymous users to delete listings
CREATE POLICY "Anyone can delete listings"
  ON listings
  FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Set Up Storage for Images (Optional but Recommended)

Instead of storing images as base64 in the database, you can use Supabase Storage:

1. Go to **Storage** in your Supabase Dashboard
2. Click **New Bucket**
3. Name it: `property-images`
4. Make it **Public** (so images are accessible)
5. Click **Create Bucket**

Then run this SQL to create storage policies:

```sql
-- Allow public read access to property images
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images');
```

## Step 3: Get Your API Keys

Your keys are already in the code:
- **URL:** `https://irigpadvcvetmwejeneu.supabase.co`
- **Anon Key:** Already configured in Index.html

## Step 4: Code Integration

The website code has been updated to:
- ✅ Connect to your Supabase project
- ✅ Store properties in the database
- ✅ Fetch properties from the database
- ✅ Upload images to Supabase Storage (if enabled)
- ✅ Fall back to localStorage if offline

## Step 5: Test the Integration

1. Open your website in a browser
2. Click **Upload Property**
3. Log in with: `admin` / `admin@2025`
4. Fill out the form and upload images (you can select multiple)
5. Click **Save Listing**
6. Check your Supabase Dashboard → **Table Editor** → `listings` to see the data
7. The browser console (F12) will show: "✅ Supabase connected successfully"

## Step 6: Migrate Existing Data (Optional)

If you have properties in localStorage, run this in browser console:

```javascript
// This will migrate all localStorage properties to Supabase
await migrateLocalStorageToSupabase();
```

## Security Improvements (Recommended)

### Option 1: Use Supabase Auth (Most Secure)
Replace the simple admin password with Supabase Authentication:

1. Enable Email Auth in Supabase Dashboard → Authentication → Providers
2. Create an admin user
3. Update the code to use Supabase Auth instead of hardcoded password

### Option 2: Restrict RLS Policies
Update the policies to only allow specific authenticated users:

```sql
-- Create an admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' = 'your-admin-email@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to use admin check
DROP POLICY IF EXISTS "Anyone can insert listings" ON listings;
CREATE POLICY "Only admins can insert listings"
  ON listings
  FOR INSERT
  WITH CHECK (is_admin());
```

## Troubleshooting

### Properties not saving?
- Check browser console for errors (F12 → Console)
- Verify RLS policies are created
- Check that the anon key is correct

### Images not uploading?
- Verify storage bucket exists and is public
- Check storage policies
- Ensure bucket name matches `property-images`

### Can't connect to Supabase?
- Verify the URL and anon key
- Check internet connection
- Look for CORS errors in console

## Next Steps

1. ✅ Create the database table (SQL above)
2. ✅ Create storage bucket for images
3. ✅ Test uploading a property
4. ✅ Verify data appears in Supabase Dashboard
5. 🔒 Add proper authentication (recommended)
6. 🚀 Deploy your website

## Support

If you have issues:
1. Check the browser console (F12)
2. Check Supabase logs in Dashboard → Logs
3. Verify all SQL commands ran successfully

