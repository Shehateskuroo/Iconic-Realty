// config.example.js
// Copy this file to `config.js` in the same folder and fill in your keys.
// IMPORTANT: Do NOT commit `config.js` to your repository. Add it to .gitignore.

// Example:
// window.SUPABASE_URL = 'https://your-project.supabase.co';
// window.SUPABASE_ANON_KEY = 'your-anon-key-here';

// Replace the placeholders below with your project's values when running locally.
window.SUPABASE_URL = 'REPLACE_WITH_YOUR_SUPABASE_URL';
window.SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';

// Optional: small helper to warn if using placeholder values in the browser console.
(function () {
  if (window.SUPABASE_URL && window.SUPABASE_URL.startsWith('REPLACE')) {
    console.warn('config.example.js loaded — please copy to config.js and set real SUPABASE keys.');
  }
})();
