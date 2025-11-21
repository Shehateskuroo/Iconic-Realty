# How to Add a Property to Your Website

## The "Add" Button Explained

**The "add" button is called "Save Listing"** - it's at the bottom of the property upload form.

## Step-by-Step Guide

### 1. Click "Upload Property" Button
Located in the **top-right navigation bar** on every page.

```
┌──────────────────────────────────────────────────┐
│  Logo    Home  For Sale  For Rent  About  [Upload Property] │
└──────────────────────────────────────────────────┘
                                           ↑
                                    Click here first!
```

### 2. Enter Admin Credentials
A modal will appear asking for login:

```
┌─────────────────────────┐
│   Admin Access      [×] │
├─────────────────────────┤
│ Username: admin         │
│ Password: admin@2025    │
│                         │
│    [Cancel] [Sign In]   │
└─────────────────────────┘
```

### 3. Fill Out the Property Form
After logging in, the upload form appears:

```
┌──────────────────────────────────────────┐
│   Upload New Property            [×]     │
├──────────────────────────────────────────┤
│                                          │
│ Property Title: [___________]            │
│ Listing Type: [▼ For Sale/Rent]         │
│                                          │
│ Location: [___________]                  │
│ Price: [___________]                     │
│                                          │
│ Bedrooms: [___]  Bathrooms: [___]       │
│                                          │
│ Property Type: [▼ Apartment/House...]   │
│                                          │
│ Property Images: [Choose Files]          │
│ ↑ You can select MULTIPLE images here   │
│                                          │
│ Description: [________________]          │
│             [________________]           │
│                                          │
│ ☐ Feature this listing on home page     │
│                                          │
│         [Clear] [Save Listing] ← HERE!  │
└──────────────────────────────────────────┘
                      ↑
              This is the "add" button!
```

### 4. Click "Save Listing"
This button will:
- Upload all selected images
- Save the property to Supabase database
- Show the property on the website
- Close the form

### 5. Verify It Worked
After clicking "Save Listing":

✅ **Success indicators:**
- Modal closes automatically
- Alert says "✅ Property saved successfully!"
- Property appears on the appropriate page (For Sale / For Rent)
- If "Featured" was checked, it appears on the home page

❌ **If something went wrong:**
- Alert will say "❌ Error saving property: [reason]"
- Check browser console (F12) for details
- Verify Supabase setup (see QUICK_START.md)

## Where Do Properties Appear?

### If you selected "For Sale":
- Appears on: `for-sale.html` page
- Visible when you click "For Sale" in navigation

### If you selected "For Rent":
- Appears on: `for-rent.html` page
- Visible when you click "For Rent" in navigation

### If you checked "Feature on home page":
- Also appears on: `Index.html` in the "Client Uploads" section
- Shows above the "More Properties" card

## Image Upload Tips

### Multiple Images:
1. Click "Choose Files" button
2. **Hold Ctrl** (Windows) or **Cmd** (Mac) to select multiple images
3. Or click and drag to select a range
4. All selected images will be uploaded

### Image Requirements:
- Format: JPG, PNG, WEBP, GIF
- Size: Recommended under 5MB per image
- First image = Cover photo (main image shown on listing cards)
- Additional images = Gallery (shown in property details)

### If no images selected:
- A default placeholder image will be used
- You can always add images later

## Common Issues

### "Nothing happens when I click Save Listing"
**Solution:**
1. Make sure you filled all required fields (marked with *)
2. Check browser console (F12) for error messages
3. Verify Supabase is connected (should see "✅ Supabase connected" in console)

### "Button is disabled/greyed out"
**Solution:**
- The button temporarily disables while saving
- It shows "Saving..." while processing
- If it stays disabled, refresh the page and try again

### "Property saved but not showing"
**Solution:**
1. Refresh the page (F5)
2. Check the correct page (For Sale vs For Rent)
3. Go to Supabase Dashboard → Table Editor → `listings` to verify data saved

### "Images not uploading"
**Solution:**
1. Create the storage bucket in Supabase (see QUICK_START.md Step 2)
2. Make sure bucket is named exactly: `property-images`
3. Verify bucket is set to **Public**
4. Images will still save as data URLs if bucket doesn't exist (fallback)

## Video Walkthrough (If Needed)

1. **Navigate** → Open website
2. **Click** → "Upload Property" button (top right)
3. **Login** → admin / admin@2025
4. **Fill** → All form fields
5. **Select** → One or more images (hold Ctrl/Cmd for multiple)
6. **Click** → "Save Listing" button
7. **Done** → Property is live!

## Testing Checklist

- [ ] Can you see the "Upload Property" button?
- [ ] Does clicking it show the login modal?
- [ ] Can you login with admin/admin@2025?
- [ ] Does the upload form appear after login?
- [ ] Can you fill all fields?
- [ ] Can you select multiple images?
- [ ] Does "Save Listing" button exist at the bottom?
- [ ] Does clicking it save the property?
- [ ] Does the property appear on the site?
- [ ] Can you see it in Supabase Dashboard?

If you answered "no" to any of these, see the troubleshooting sections above or check `QUICK_START.md`.

---

**Remember: The "add" button is labeled "Save Listing" and it's at the bottom of the upload form!**

