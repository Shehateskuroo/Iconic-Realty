# Brother Bright Real Estate Website

A modern real estate website for Iconic Reality, featuring property listings, admin upload functionality, and Supabase backend integration.

## 🎯 Features

- ✅ **Property Listings** - For Sale and For Rent pages
- ✅ **Admin Upload** - Secure property upload with authentication
- ✅ **Multiple Images** - Upload multiple photos per property
- ✅ **Supabase Backend** - Cloud database storage
- ✅ **Image Storage** - Supabase Storage integration
- ✅ **Auto-Scrolling Reviews** - Client testimonials carousel
- ✅ **Property Filtering** - Search by location, price, bedrooms, etc.
- ✅ **Responsive Design** - Mobile-friendly layout
- ✅ **Featured Listings** - Highlight special properties on home page

## 📁 Project Structure

```
Brother Bright Website/
├── index.html              # Home page
├── about-us.html          # About page with company info
├── for-sale.html          # Properties for sale
├── for-rent.html          # Properties for rent
├── script.js              # Main JavaScript (includes Supabase integration)
├── styles.css             # All styling
├── Houses/                # Property images
├── Icons/                 # UI icons
├── README.md              # This file
├── QUICK_START.md         # Backend setup guide (START HERE!)
├── SUPABASE_SETUP.md      # Detailed Supabase documentation
└── HOW_TO_ADD_PROPERTY.md # Guide for adding properties
```

## 🚀 Getting Started

### For Users (Adding Properties)

1. Read: `HOW_TO_ADD_PROPERTY.md`
2. Click "Upload Property" button
3. Login: `admin` / `admin@2025`
4. Fill form and upload images
5. Click "Save Listing"

### For Developers (Backend Setup)

1. **Read:** `QUICK_START.md` ← **START HERE!**
2. Run SQL to create database table (5 min)
3. Create storage bucket (optional, 3 min)
4. Test the upload (2 min)

**Total setup time: ~10 minutes**

## 🔧 Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Framework:** Bootstrap 5.3.3
- **Backend:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (for images)
- **Auth:** Simple admin login (can upgrade to Supabase Auth)

## 🔐 Security

### Current Setup (Development)
- Username: `admin`
- Password: `admin@2025`
- Stored in: `script.js` lines 1-4

### Production Recommendations
1. **Use Supabase Auth** instead of hardcoded credentials
2. **Restrict RLS Policies** to specific admin emails
3. **Use environment variables** for API keys
4. **Enable MFA** for admin accounts

See `SUPABASE_SETUP.md` → Security Improvements section

## 📝 Configuration

### Supabase Connection

Already configured in `index.html`:

```html
<script>
  window.SUPABASE_URL = 'https://irigpadvcvetmwejeneu.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
```

### Table Name
The database table is named `listings` (configured in `script.js`)

### Storage Bucket
Image uploads go to: `property-images` bucket

## 🎨 Customization

### Change Colors
Edit `styles.css` lines 1-7:
```css
:root {
    --brand-color: #1A0C4B;        /* Main purple */
    --brand-accent: #f3f1ff;       /* Light purple */
    --brand-border: #dcd6f7;       /* Border color */
    --brand-gradient: linear-gradient(135deg, #1A0C4B, #35206f);
}
```

### Change Login Credentials
Edit `script.js` lines 1-4:
```javascript
const AUTH_CONFIG = {
  username: "your-username",
  password: "your-password",
};
```

### Add New Property Fields
1. Add field to upload form in all HTML files
2. Update `buildPropertyFromForm()` in `script.js`
3. Add column to Supabase `listings` table

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | This file - project overview |
| `QUICK_START.md` | **10-minute backend setup** |
| `SUPABASE_SETUP.md` | Detailed Supabase documentation |
| `HOW_TO_ADD_PROPERTY.md` | Guide for adding properties |

## 🐛 Troubleshooting

### Properties not showing?
1. Check browser console (F12)
2. Verify Supabase table exists
3. Refresh the page (F5)

### Can't upload images?
1. Create `property-images` bucket in Supabase
2. Make bucket public
3. Add storage policies

### "No add button"?
- The button is labeled **"Save Listing"**
- It's at the bottom of the upload form
- See `HOW_TO_ADD_PROPERTY.md`

### More issues?
- Check browser console (F12 → Console tab)
- Check Supabase logs (Dashboard → Logs)
- Review error messages

## 📊 Database Schema

```sql
TABLE listings (
  id             UUID PRIMARY KEY,
  title          TEXT NOT NULL,
  transaction    TEXT,              -- 'sale' or 'rent'
  location       TEXT,
  price          NUMERIC,
  bedrooms       INTEGER,
  bathrooms      INTEGER,
  type           TEXT,              -- 'apartment', 'house', etc.
  description    TEXT,
  featured       BOOLEAN,           -- Show on home page?
  image_url      TEXT,              -- Main image URL
  images         JSONB,             -- Array of all image URLs
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ
)
```

## 🔄 Data Flow

```
User Action → Admin Login → Upload Form → script.js
                                             ↓
                                    ┌────────┴─────────┐
                                    │  Supabase Check  │
                                    └────────┬─────────┘
                                             ↓
                          ┌──────────────────┴──────────────────┐
                          ↓                                     ↓
                   ✅ Supabase Available              ❌ Offline/Not Setup
                          ↓                                     ↓
              1. Upload images to Storage           Save to localStorage
              2. Get public URLs                           ↓
              3. Save to 'listings' table          Show on page
              4. Fetch and display                 (temporary)
                          ↓
                   Show on website
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Import to Vercel
3. Deploy (auto SSL, CDN, etc.)

### Option 2: Netlify
1. Drag and drop folder to Netlify
2. Or connect GitHub repo
3. Deploy

### Option 3: Traditional Hosting
1. Upload all files via FTP
2. Ensure server can serve HTML/CSS/JS
3. Configure SSL certificate

**Note:** Supabase credentials are already in the code, no environment variables needed.

## 📞 Support

For issues or questions:
1. Check the documentation files listed above
2. Review browser console for errors
3. Check Supabase Dashboard → Logs

## 📜 License

Private project for Iconic Reality / Brother Bright

## 🎉 Quick Links

- 📘 **[Backend Setup](QUICK_START.md)** ← Start here for database
- 📗 **[Add Properties](HOW_TO_ADD_PROPERTY.md)** ← User guide
- 📙 **[Supabase Details](SUPABASE_SETUP.md)** ← Technical docs

---

**Need help?** Open `QUICK_START.md` to get your backend running in 10 minutes!



