// Admin Dashboard with Supabase Auth
const SUPABASE_URL = window.SUPABASE_URL || null;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || null;
let supabaseClient = null;
let currentUser = null;

// Initialize Supabase
function initSupabase() {
  if (typeof supabase === "undefined") {
    console.error("Supabase library not loaded");
    return false;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.startsWith("REPLACE_")) {
    console.error("Supabase not configured");
    return false;
  }

  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase client initialized");
    return true;
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    return false;
  }
}

// Check if user is logged in
async function checkAuth() {
  if (!supabaseClient) return false;

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) throw error;
    
    if (session && session.user) {
      currentUser = session.user;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
}

// Show/hide sections
function showLoginSection() {
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('dashboardSection').style.display = 'none';
  document.body.classList.add('login-active');
}

function showDashboardSection() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.body.classList.remove('login-active');
  document.getElementById('adminEmail').textContent = currentUser?.email || 'Admin';
  loadDashboardData();
}

// Login handler
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const loginError = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const loginText = submitBtn.querySelector('.login-text');
  const spinner = submitBtn.querySelector('.spinner-border');

  // Show loading
  submitBtn.disabled = true;
  spinner.classList.remove('d-none');
  loginError.classList.add('d-none');

  try {
    if (!supabaseClient) {
      throw new Error("Supabase not configured. Please check your config.js file.");
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    if (data.user) {
      currentUser = data.user;
      showDashboardSection();
    }
  } catch (error) {
    console.error("Login error:", error);
    loginError.textContent = error.message || "Login failed. Please check your credentials.";
    loginError.classList.remove('d-none');
  } finally {
    submitBtn.disabled = false;
    spinner.classList.add('d-none');
  }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    currentUser = null;
    // Redirect to main page after logout
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error logging out. Please try again.");
  }
});

// Change password handler
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const successMsg = document.getElementById('passwordChangeSuccess');
  const errorMsg = document.getElementById('passwordChangeError');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const submitText = submitBtn.querySelector('.submit-text');
  const spinner = submitBtn.querySelector('.spinner-border');

  // Hide previous messages
  successMsg.classList.add('d-none');
  errorMsg.classList.add('d-none');

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    errorMsg.textContent = "Passwords do not match!";
    errorMsg.classList.remove('d-none');
    return;
  }

  if (newPassword.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters long.";
    errorMsg.classList.remove('d-none');
    return;
  }

  // Show loading
  submitBtn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    if (!supabaseClient) {
      throw new Error("Supabase not configured");
    }

    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    successMsg.textContent = "✅ Password updated successfully!";
    successMsg.classList.remove('d-none');
    e.target.reset();

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMsg.classList.add('d-none');
    }, 5000);

  } catch (error) {
    console.error("Password change error:", error);
    errorMsg.textContent = error.message || "Failed to update password. Please try again.";
    errorMsg.classList.remove('d-none');
  } finally {
    submitBtn.disabled = false;
    spinner.classList.add('d-none');
  }
});

// Load dashboard data
async function loadDashboardData() {
  try {
    if (!supabaseClient) return;

    // Fetch all listings
    const { data: listings, error } = await supabaseClient
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allListings = listings || [];

    // Update stats
    document.getElementById('totalListings').textContent = allListings.length;
    document.getElementById('featuredListings').textContent = allListings.filter(l => l.featured).length;
    document.getElementById('forSaleListings').textContent = allListings.filter(l => l.transaction === 'sale').length;

    // Update listings table
    const tableBody = document.getElementById('listingsTableBody');
    if (allListings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No listings found</td></tr>';
      return;
    }

    tableBody.innerHTML = allListings.slice(0, 10).map(listing => {
      const createdDate = listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A';
      const featuredBadge = listing.featured 
        ? '<span class="badge bg-success">Yes</span>' 
        : '<span class="badge bg-secondary">No</span>';
      
      return `
        <tr>
          <td>${listing.title || 'Untitled'}</td>
          <td><span class="badge bg-primary">${listing.transaction || 'N/A'}</span></td>
          <td>${listing.location || 'N/A'}</td>
          <td>R ${Number(listing.price || 0).toLocaleString()}</td>
          <td>${featuredBadge}</td>
          <td>${createdDate}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    document.getElementById('listingsTableBody').innerHTML = 
      '<tr><td colspan="6" class="text-center text-danger">Error loading data</td></tr>';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (!initSupabase()) {
    document.getElementById('loginError').textContent = 
      "Supabase is not configured. Please add your Supabase credentials to config.js";
    document.getElementById('loginError').classList.remove('d-none');
    return;
  }

  // Check if already logged in
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    showDashboardSection();
  } else {
    showLoginSection();
  }

  // Listen for auth state changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session?.user || null;
      showDashboardSection();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLoginSection();
    }
  });

  // Add show/hide password toggles
  function setupPasswordToggle(toggleBtnId, inputId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    
    if (toggleBtn && input) {
      toggleBtn.addEventListener('click', () => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggleBtn.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
      });
    }
  }

  setupPasswordToggle('toggleLoginPassword', 'loginPassword');
  setupPasswordToggle('toggleNewPassword', 'newPassword');
  setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');
});
