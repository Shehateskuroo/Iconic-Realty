# 🚀 Deployment Notes - Quick Reference

## ✅ Pre-Deployment Checklist

### 1. Admin Password
- **Location**: `script.js` line 5
- **Current**: `IconicRealty2025!Secure`
- **Action**: Change this to your preferred secure password before deployment

### 2. Config.js File
- **Status**: ✅ Already configured with Supabase credentials
- **Note**: This file is in `.gitignore` so it won't be committed to Git
- **For Git Deployment**: You'll need to manually add `config.js` to your deployment or use environment variables
- **For Drag & Drop**: The file will be included automatically

### 3. URLs Updated
- ✅ Open Graph URLs now set dynamically (works on any domain)
- ✅ Sitemap uses relative paths (update with your domain after deployment)
- ✅ Robots.txt uses relative paths

## 🌐 After Deployment - Update These

### Sitemap.xml
After you know your final domain, update `sitemap.xml`:
- Replace relative paths (`/`) with full URLs (`https://your-domain.com/`)
- Submit to Google Search Console

### Robots.txt
Update the sitemap URL in `robots.txt`:
- Change `/sitemap.xml` to `https://your-domain.com/sitemap.xml`

## 🔐 Security Reminder

**IMPORTANT**: The admin password is currently set to `IconicRealty2025!Secure`. 
- Change this in `script.js` before going live
- Consider using a strong, unique password
- Never commit passwords to Git

## 📦 Deployment Methods

### Netlify (Recommended)
1. **Drag & Drop**: Just drag your folder to Netlify dashboard
2. **Git**: Connect your GitHub repo to Netlify
3. **Config**: `netlify.toml` is already configured

### GitHub Pages
1. Push code to GitHub
2. Go to Settings → Pages
3. Select branch and folder
4. **Note**: Make sure `config.js` is included (it's in .gitignore, so you may need to temporarily remove it from .gitignore or use a different method)

## ✅ Testing Checklist

After deployment, test:
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Property upload works
- [ ] Admin login works (username: `admin`, password: `IconicRealty2025!Secure`)
- [ ] Filter/search functionality works
- [ ] Property detail pages load
- [ ] Images display correctly
- [ ] Mobile responsiveness
- [ ] Supabase connection works

## 🆘 Common Issues

### Images Not Loading
- Check that image paths are relative (`./Houses/image.jpg`)
- Verify all files are in the correct folders

### Supabase Not Working
- Verify `config.js` is included in deployment
- Check Supabase dashboard for errors
- Verify RLS (Row Level Security) is enabled

### 404 Errors
- Ensure `index.html` is lowercase (not `Index.html`)
- Check all links use lowercase filenames
- Verify `about-us.html` exists (not `About Us.html`)

## 📝 Current Status

✅ **Ready for Deployment**
- All critical fixes applied
- URLs configured for flexibility
- Security password updated
- Netlify configuration added
- GitHub Pages compatible

**You can deploy now!** Just remember to update the sitemap and robots.txt with your final domain after deployment.

