const AUTH_CONFIG = {
  username: "admin",
  password: "admin@2025",
};

const AUTH_SESSION_KEY = "bb_admin_authed";
const STORAGE_KEY = "bb_uploaded_properties";
const DEFAULT_IMAGE = "./Houses/1.webp";

// Supabase configuration
const SUPABASE_URL = window.SUPABASE_URL || null;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || null;
let supabaseClient = null;
const STORAGE_BUCKET = "property-images";
const SUPABASE_TABLE = "listings"; // Changed to match existing code

// Initialize Supabase client when page loads
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase connected successfully");
    console.log("📍 Project URL:", SUPABASE_URL);
  } catch (error) {
    console.error("❌ Failed to initialize Supabase:", error);
  }
} else {
  console.warn("⚠️ Supabase not configured. Using localStorage only.");
}

/* -------------------------------------------------------------------------- */
/*                             Filter functionality                           */
/* -------------------------------------------------------------------------- */
const filterForm = document.getElementById("filterForm");
const clearBtn = document.getElementById("clearFilters");

if (filterForm) {
  filterForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const location = document.getElementById("location").value.toLowerCase();
    const bedrooms = document.getElementById("bedrooms").value;
    const bathrooms = document.getElementById("bathrooms").value;
    const priceRange = document.getElementById("priceRange").value;
    const propertyType = document.getElementById("propertyType").value;

    const [minPrice, maxPrice] = priceRange
      ? priceRange.includes("+")
        ? [parseInt(priceRange, 10), Infinity]
        : priceRange.split("-").map(Number)
      : [0, Infinity];

    const cards = document.querySelectorAll("#propertyList .card");
    const noResults = document.getElementById("noResults");
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardLocation = card.dataset.location.toLowerCase();
      const cardBedrooms = parseInt(card.dataset.bedrooms, 10);
      const cardBathrooms = parseInt(card.dataset.bathrooms, 10);
      const cardPrice = parseInt(card.dataset.price, 10);
      const cardType = card.dataset.type;

      const matches =
        (!location || cardLocation.includes(location)) &&
        (!bedrooms || cardBedrooms >= bedrooms) &&
        (!bathrooms || cardBathrooms >= bathrooms) &&
        cardPrice >= minPrice &&
        cardPrice <= maxPrice &&
        (!propertyType || cardType === propertyType);

      card.style.display = matches ? "block" : "none";
      if (matches) visibleCount++;
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }
  });

  if (clearBtn) {
    filterForm.addEventListener("input", () => {
      let isActive = false;
      filterForm.querySelectorAll("input, select").forEach((field) => {
        if (field.value.trim() !== "") isActive = true;
      });

      clearBtn.classList.toggle("visible", isActive);
    });

    clearBtn.addEventListener("click", () => {
      filterForm.reset();
      clearBtn.classList.remove("visible");

      const cards = document.querySelectorAll("#propertyList .card");
      cards.forEach((card) => (card.style.display = "block"));

      const noResults = document.getElementById("noResults");
      if (noResults) noResults.style.display = "none";
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                             Reviews carousel                               */
/* -------------------------------------------------------------------------- */
const reviewsWrapper = document.querySelector(".reviews-wrapper");
const prevBtn = document.querySelector(".carousel-btn.prev");
const nextBtn = document.querySelector(".carousel-btn.next");

if (reviewsWrapper) {
  const firstCard = reviewsWrapper.querySelector(".review-card");
  if (firstCard) {
    const scrollPerClick = firstCard.offsetWidth + 20;
    let autoScrollInterval = null;
    let isPaused = false;

    // Manual navigation buttons
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        scrollToNext();
        pauseAutoScroll();
        resumeAutoScroll();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        scrollToPrev();
        pauseAutoScroll();
        resumeAutoScroll();
      });
    }

    function scrollToNext() {
      const maxScroll = reviewsWrapper.scrollWidth - reviewsWrapper.clientWidth;
      const currentScroll = reviewsWrapper.scrollLeft;
      
      if (currentScroll >= maxScroll - 10) {
        // Reset to beginning for infinite scroll
        reviewsWrapper.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        reviewsWrapper.scrollBy({ left: scrollPerClick, behavior: "smooth" });
      }
    }

    function scrollToPrev() {
      const currentScroll = reviewsWrapper.scrollLeft;
      
      if (currentScroll <= 10) {
        // Scroll to end for infinite scroll
        const maxScroll = reviewsWrapper.scrollWidth - reviewsWrapper.clientWidth;
        reviewsWrapper.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        reviewsWrapper.scrollBy({ left: -scrollPerClick, behavior: "smooth" });
      }
    }

    function pauseAutoScroll() {
      isPaused = true;
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    }

    function resumeAutoScroll() {
      isPaused = false;
      if (!autoScrollInterval) {
        startAutoScroll();
      }
    }

    function startAutoScroll() {
      autoScrollInterval = setInterval(() => {
        if (!isPaused) {
          scrollToNext();
        }
      }, 4000); // Auto-scroll every 4 seconds
    }

    // Pause on hover
    reviewsWrapper.addEventListener("mouseenter", pauseAutoScroll);
    reviewsWrapper.addEventListener("mouseleave", resumeAutoScroll);

    // Start auto-scroll
    startAutoScroll();
  }
}

/* -------------------------------------------------------------------------- */
/*                         Upload/authentication logic                        */
/* -------------------------------------------------------------------------- */
const uploadTrigger = document.getElementById("uploadPropertyBtn");
const loginError = document.getElementById("loginError");
const loginForm = document.getElementById("adminLoginForm");
const propertyForm = document.getElementById("propertyUploadForm");

const loginModal = createModalInstance("loginModal");
const uploadModal = createModalInstance("uploadModal");

function createModalInstance(id) {
  if (typeof bootstrap === "undefined") return null;
  const el = document.getElementById(id);
  return el ? new bootstrap.Modal(el) : null;
}

function initSupabase() {
  const statusEl = document.getElementById("supabaseStatus");
  if (typeof supabase === "undefined") {
    if (statusEl) statusEl.textContent = "(Supabase lib missing)";
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.startsWith("REPLACE_")) {
    if (statusEl) statusEl.textContent = "(Supabase not configured)";
    return;
  }

  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (statusEl) statusEl.textContent = "(Supabase ready)";
    // quick test - try to fetch a small amount from listings to validate connectivity
    fetchAndRenderListings();
  } catch (err) {
    console.error("Failed to init Supabase", err);
    if (statusEl) statusEl.textContent = "(Supabase init error)";
  }
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

function setAuthenticated() {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
}

function ensureAuthenticated() {
  if (isAuthenticated()) return true;
  if (loginError) loginError.classList.add("d-none");
  loginModal?.show();
  return false;
}

if (uploadTrigger) {
  uploadTrigger.addEventListener("click", () => {
    if (isAuthenticated()) {
      uploadModal?.show();
    } else {
      ensureAuthenticated();
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("loginUsername")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();

    if (
      username === AUTH_CONFIG.username &&
      password === AUTH_CONFIG.password
    ) {
      setAuthenticated();
      if (loginError) loginError.classList.add("d-none");
      loginModal?.hide();
      setTimeout(() => uploadModal?.show(), 250);
      loginForm.reset();
    } else if (loginError) {
      loginError.classList.remove("d-none");
    }
  });
}

if (propertyForm) {
  propertyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ensureAuthenticated()) return;

    const property = await buildPropertyFromForm();

    // If Supabase is configured, attempt to upload images and insert into listings table.
    if (supabaseClient) {
      try {
        const files = document.getElementById("propertyImage")?.files || [];
        const uploadedUrls = [];

        for (const file of Array.from(files)) {
          const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            console.warn("Storage upload failed for", file.name, uploadError);
            continue; // skip this file
          }

          // get public URL
          const { data: publicUrlData } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
          if (publicUrlData && publicUrlData.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }

        const listingRow = {
          title: property.title,
          transaction: property.transaction,
          location: property.location,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          type: property.type,
          description: property.description,
          featured: property.featured,
          image_url: uploadedUrls[0] || property.image || null,
          images: uploadedUrls,
        };

        const { data: insertData, error: insertError } = await supabaseClient
          .from("listings")
          .insert([listingRow])
          .select();

        if (insertError) {
          console.error("Failed to insert listing", insertError);
          // fallback to localStorage
          persistProperty(property);
        } else {
          console.log("Inserted listing to Supabase", insertData);
        }
      } catch (err) {
        console.error("Supabase upload error", err);
        // fallback
        persistProperty(property);
      }
    } else {
      // Supabase not configured: save to localStorage
      persistProperty(property);
    }

    propertyForm.reset();
    uploadModal?.hide();
    // re-render local + remote sources
    fetchAndRenderListings();
  });
}

async function buildPropertyFromForm() {
  const files = document.getElementById("propertyImage")?.files;
  let images = [];

  if (files && files.length > 0) {
    const fileArray = Array.from(files);
    images = await Promise.all(fileArray.map((file) => fileToDataUrl(file)));
  }

  const firstImage = images.length > 0 ? images[0] : null;

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: document.getElementById("propertyTitle").value.trim(),
    transaction: document.getElementById("propertyStatus").value,
    location: document.getElementById("propertyLocation").value.trim(),
    price: Number(document.getElementById("propertyPrice").value),
    bedrooms: Number(document.getElementById("propertyBedrooms").value),
    bathrooms: Number(document.getElementById("propertyBathrooms").value),
    type: document.getElementById("propertyType").value,
    description: document.getElementById("propertyDescription").value.trim(),
    featured: document.getElementById("propertyFeatured").checked,
    image: firstImage,
    images,
    createdAt: new Date().toISOString(),
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getStoredProperties() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Failed to parse stored properties", error);
    return [];
  }
}

function persistProperty(property) {
  const existing = getStoredProperties();
  existing.push(property);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/* -------------------------------------------------------------------------- */
/*                             Rendering helpers                              */
/* -------------------------------------------------------------------------- */
function renderDynamicProperties() {
  // prefer remote listings when Supabase is configured and reachable
  if (supabaseClient) {
    fetchAndRenderListings();
    return;
  }

  const properties = getStoredProperties();
  renderFeatured(properties);
  renderStatusList(properties, "salePropertiesList", "sale");
  renderStatusList(properties, "rentPropertiesList", "rent");
}

// Fetch listings from Supabase (if available) and render; hide the localNotice when successful
async function fetchAndRenderListings() {
  const localNotice = document.getElementById("localNotice");
  if (!supabaseClient) {
    // render local fallback
    const properties = getStoredProperties();
    renderFeatured(properties);
    renderStatusList(properties, "salePropertiesList", "sale");
    renderStatusList(properties, "rentPropertiesList", "rent");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch listings from Supabase", error);
      // fallback to local
      const properties = getStoredProperties();
      renderFeatured(properties);
      renderStatusList(properties, "salePropertiesList", "sale");
      renderStatusList(properties, "rentPropertiesList", "rent");
      return;
    }

    // transform rows to the property shape expected by render helpers
    const properties = (data || []).map((row) => ({
      id: row.id || String(row.created_at) || String(Math.random()),
      title: row.title,
      transaction: row.transaction,
      location: row.location,
      price: row.price,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      type: row.type,
      description: row.description,
      featured: !!row.featured,
      image: row.image_url || (Array.isArray(row.images) && row.images[0]) || null,
      images: row.images || [],
      createdAt: row.created_at || null,
    }));

    renderFeatured(properties);
    renderStatusList(properties, "salePropertiesList", "sale");
    renderStatusList(properties, "rentPropertiesList", "rent");

    if (localNotice) {
      localNotice.style.display = "none";
    }
  } catch (err) {
    console.error("Error fetching listings", err);
  }
}

function renderFeatured(properties) {
  const anchor = document.getElementById("dynamicFeaturedAnchor");
  if (!anchor) return;

  const featured = properties.filter((property) => property.featured);
  anchor.innerHTML = "";

  if (!featured.length) return;

  const heading = document.createElement("div");
  heading.className = "featured-upload-label";
  heading.innerHTML =
    "<h4>Client Uploads</h4><p>Listings recently added by the owner.</p>";
  anchor.appendChild(heading);

  featured.forEach((property) => {
    anchor.appendChild(createPropertyCard(property));
  });
}

function renderStatusList(properties, containerId, status) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filtered = properties.filter(
    (property) => property.transaction === status,
  );

  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        No ${status === "sale" ? "sales" : "rental"} listings uploaded yet.
      </div>
    `;
    return;
  }

  filtered.forEach((property) => {
    container.appendChild(createPropertyCard(property));
  });
}

function createPropertyCard(property) {
  const card = document.createElement("div");
  card.className = "card uploaded-card";
  card.dataset.location = property.location || "";
  card.dataset.bedrooms = property.bedrooms || 0;
  card.dataset.bathrooms = property.bathrooms || 0;
  card.dataset.price = property.price || 0;
  card.dataset.type = property.type || "";

  const badgeClass =
    property.transaction === "sale" ? "badge-sale" : "badge-rent";
  const price = Number(property.price || 0).toLocaleString();
  const description = property.description
    ? `<p class="card-text small text-muted mb-0">${property.description}</p>`
    : "";

  const coverImage =
    property.image ||
    (Array.isArray(property.images) && property.images[0]) ||
    DEFAULT_IMAGE;

  card.innerHTML = `
    <button class="delete-property-btn" data-property-id="${property.id}" title="Delete Property">
      🗑️ Delete
    </button>
    <img src="${coverImage}" alt="${property.title}">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="card-title mb-0">${property.title}</h5>
        <span class="property-badge ${badgeClass}">
          ${property.transaction === "sale" ? "For Sale" : "For Rent"}
        </span>
      </div>
      <p class="card-text">
        📍 <strong>Location:</strong> ${property.location}<br>
        🛏️ ${property.bedrooms} Beds &nbsp; | &nbsp; 🛁 ${property.bathrooms} Baths
      </p>
      <strong><p class="card-text">R ${price}</p></strong>
      ${description}
    </div>
  `;

  // Add delete functionality
  const deleteBtn = card.querySelector('.delete-property-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleDeleteProperty(property.id, property.title);
    });
  }

  return card;
}

/* -------------------------------------------------------------------------- */
/*                         Delete Property Function                           */
/* -------------------------------------------------------------------------- */
async function handleDeleteProperty(propertyId, propertyTitle) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    alert("⚠️ You must be logged in as admin to delete properties.");
    ensureAuthenticated();
    return;
  }

  // Confirm deletion
  const confirmed = confirm(
    `Are you sure you want to delete:\n\n"${propertyTitle}"\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    // Delete from Supabase if connected
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('listings')
        .delete()
        .eq('id', propertyId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error('Failed to delete from database: ' + error.message);
      }

      console.log('✅ Property deleted from Supabase');
    } else {
      // Delete from localStorage
      const properties = getStoredProperties();
      const filtered = properties.filter(p => p.id !== propertyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Property deleted from localStorage');
    }

    // Refresh the display
    await renderDynamicProperties();
    alert('✅ Property deleted successfully!');

  } catch (error) {
    console.error('Delete error:', error);
    alert('❌ Error deleting property: ' + error.message);
  }
}

renderDynamicProperties();

// initialize Supabase client if configuration is present
try {
  initSupabase();
} catch (e) {
  console.warn("initSupabase call failed:", e);
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    renderDynamicProperties();
  }
});
