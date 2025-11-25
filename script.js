// ⚠️ SECURITY WARNING: Change these credentials before deployment!
// Consider moving to environment variables or a secure backend for production.
const AUTH_CONFIG = {
  username: "admin",
  password: "IconicRealty2025!Secure", // ⚠️ CHANGE THIS PASSWORD BEFORE DEPLOYMENT!
};

const AUTH_SESSION_KEY = "bb_admin_authed";
const STORAGE_KEY = "bb_uploaded_properties";
const DEFAULT_IMAGE = "./Houses/1.webp";

// Debug mode - set to false for production
const DEBUG_MODE = false;

// Helper function for conditional logging
function debugLog(...args) {
  if (DEBUG_MODE) console.log(...args);
}

function debugError(...args) {
  if (DEBUG_MODE) console.error(...args);
}

function debugWarn(...args) {
  if (DEBUG_MODE) console.warn(...args);
}

// Supabase configuration
const SUPABASE_URL = window.SUPABASE_URL || null;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || null;
let supabaseClient = null;
const STORAGE_BUCKET = "property-images";
const SUPABASE_TABLE = "listings"; // Changed to match existing code
// Live store of currently loaded properties (from Supabase or localStorage)
let currentProperties = [];

// Simple UI helpers for showing a small loading indicator above the properties
function showFilterLoading() {
  let el = document.getElementById('bb-filter-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bb-filter-loading';
    el.style.textAlign = 'center';
    el.style.padding = '12px 0';
    el.innerHTML = `<div class="spinner-border text-primary" role="status" style="width:1.5rem;height:1.5rem;margin-right:8px;vertical-align:middle;"></div><span style="vertical-align:middle;color:#333">Searching…</span>`;
    const propertyList = document.getElementById('propertyList');
    if (propertyList) propertyList.parentNode.insertBefore(el, propertyList);
  }
  el.style.display = 'block';
}

function hideFilterLoading() {
  const el = document.getElementById('bb-filter-loading');
  if (el) el.style.display = 'none';
}

/* -------------------------------------------------------------------------- */
/*                             Filter functionality                           */
/* -------------------------------------------------------------------------- */
const filterForm = document.getElementById("filterForm");
const clearBtn = document.getElementById("clearFilters");
const seeMoreBtn = document.getElementById("seeMoreBtn");
const advancedFilters = document.getElementById("advancedFilters");
// In markup the select is named `listingType` — check that first and fall back to old id
const transactionTypeSelect = document.getElementById("listingType") || document.getElementById("transactionType");
const priceRangeSelect = document.getElementById("priceRange");
const priceRangeLabel = document.getElementById("priceRangeLabel");

// Dynamic price range based on transaction type
if (transactionTypeSelect && priceRangeSelect && priceRangeLabel) {
  transactionTypeSelect.addEventListener("change", () => {
    const transactionType = transactionTypeSelect.value;
    const currentValue = priceRangeSelect.value;
    
    // Hide all price options first
    priceRangeSelect.querySelectorAll(".price-rent, .price-sale").forEach(opt => {
      opt.style.display = "none";
    });
    
    // Show "Any" option
    priceRangeSelect.querySelector('option[value=""]').style.display = "block";
    
    // Show relevant price options based on transaction type
    if (transactionType === "rent") {
      priceRangeSelect.querySelectorAll(".price-rent").forEach(opt => {
        opt.style.display = "block";
      });
      priceRangeLabel.textContent = "Price Range (p/m)";
      // Reset to "Any" if current selection is a sale price
      if (currentValue && !priceRangeSelect.querySelector(`option[value="${currentValue}"].price-rent`)) {
        priceRangeSelect.value = "";
      }
    } else if (transactionType === "sale") {
      priceRangeSelect.querySelectorAll(".price-sale").forEach(opt => {
        opt.style.display = "block";
      });
      priceRangeLabel.textContent = "Price Range";
      // Reset to "Any" if current selection is a rental price
      if (currentValue && !priceRangeSelect.querySelector(`option[value="${currentValue}"].price-sale`)) {
        priceRangeSelect.value = "";
      }
    } else {
      // Show all options when "All" is selected
      priceRangeSelect.querySelectorAll("option").forEach(opt => {
        opt.style.display = "block";
      });
      priceRangeLabel.textContent = "Price Range";
    }
  });
}

// See More Filters Toggle - Modern smooth animation
if (seeMoreBtn && advancedFilters) {
  seeMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isExpanded = advancedFilters.classList.contains("show");
    const seeMoreText = seeMoreBtn.querySelector(".see-more-text");
    const seeLessText = seeMoreBtn.querySelector(".see-less-text");
    const icon = seeMoreBtn.querySelector(".see-more-icon");
    
    if (isExpanded) {
      // Collapse
      advancedFilters.classList.remove("show");
      seeMoreBtn.classList.remove("active");
      if (seeMoreText) seeMoreText.style.display = "inline";
      if (seeLessText) seeLessText.style.display = "none";
      if (icon) icon.style.transform = "rotate(0deg)";
      
      // Hide after animation completes
      setTimeout(() => {
        if (!advancedFilters.classList.contains("show")) {
          advancedFilters.style.display = "none";
        }
      }, 500);
    } else {
      // Expand
      advancedFilters.style.display = "block";
      // Force reflow
      void advancedFilters.offsetHeight;
      
      setTimeout(() => {
        advancedFilters.classList.add("show");
        seeMoreBtn.classList.add("active");
        if (seeMoreText) seeMoreText.style.display = "none";
        if (seeLessText) seeLessText.style.display = "inline";
        if (icon) icon.style.transform = "rotate(180deg)";
      }, 10);
    }
  });
}

if (filterForm) {
  filterForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    // If using Supabase and properties aren't loaded yet, fetch them first
    if (supabaseClient && (!currentProperties || currentProperties.length === 0)) {
      showFilterLoading();
      try {
        await fetchAndRenderListings();
      } catch (err) {
        debugError('Failed to fetch properties before filtering', err);
      } finally {
        hideFilterLoading();
      }
    }

    // Use the listingType select in the DOM (legacy fallback for transactionType)
    const transactionType = (document.getElementById("listingType") || document.getElementById("transactionType"))?.value || "";
    const location = document.getElementById("location").value.toLowerCase();
    const bedrooms = document.getElementById("bedrooms").value;
    const bathrooms = document.getElementById("bathrooms").value;
    const priceRange = document.getElementById("priceRange").value;
    const propertyType = document.getElementById("filterPropertyType").value;
    const size = document.getElementById("size")?.value || "";
    const parking = document.getElementById("parking")?.value || "";
    const yearBuilt = document.getElementById("yearBuilt")?.value || "";

    const [minPrice, maxPrice] = priceRange
      ? priceRange.includes("+")
        ? [parseInt(priceRange.replace("+", "").replace(/\D/g, ""), 10), Infinity]
        : priceRange.split("-").map(Number)
      : [0, Infinity];

    const minSize = size ? parseInt(size, 10) : 0;
    const furnished = document.getElementById("furnished")?.value || "";

    showFilterLoading();
    // Build visibleProperties by applying the same filter criteria to `currentProperties`
    const visibleProperties = (currentProperties || []).filter((p) => {
      const cardLocation = (p.location || "").toLowerCase();
      const cardBedrooms = Number(p.bedrooms || 0);
      const cardBathrooms = Number(p.bathrooms || 0);
      const cardPrice = Number(p.price || 0);
      const cardType = p.type || "";
      const cardTransaction = p.transaction || "";
      const cardSize = Number(p.size || 0);
      const cardParking = Number(p.parking || 0);
      const cardYearBuilt = p.yearBuilt || p.year_built || "";
      const cardFurnished = (p.furnished || "").toLowerCase();

      // Year built matching (same rules)
      let yearMatchesLocal = true;
      if (yearBuilt) {
        if (yearBuilt === "2020+") {
          yearMatchesLocal = cardYearBuilt && parseInt(cardYearBuilt, 10) >= 2020;
        } else if (yearBuilt === "before-1990") {
          yearMatchesLocal = cardYearBuilt && parseInt(cardYearBuilt, 10) < 1990;
        } else if (yearBuilt.includes("-")) {
          const [start, end] = yearBuilt.split("-").map(y => parseInt(y.substring(0, 4), 10));
          const cardYear = cardYearBuilt ? parseInt(cardYearBuilt, 10) : 0;
          yearMatchesLocal = cardYear >= start && cardYear <= end;
        }
      }

      const matches =
        (!transactionType || cardTransaction === transactionType) &&
        (!location || cardLocation.includes(location)) &&
        (!bedrooms || cardBedrooms >= parseInt(bedrooms, 10)) &&
        (!bathrooms || cardBathrooms >= parseInt(bathrooms, 10)) &&
        cardPrice >= minPrice &&
        cardPrice <= maxPrice &&
        (!propertyType || cardType === propertyType) &&
        cardSize >= minSize &&
        (!parking || cardParking >= parseInt(parking, 10)) &&
        (!yearBuilt || yearMatchesLocal) &&
        (!furnished || cardFurnished === furnished.toLowerCase());

      return matches;
    });

    // Render results into the grid
    const container = document.getElementById('propertyList');
    if (container) {
      // Get noResults element before clearing (it might be inside container)
      const noResultsEl = document.getElementById('noResults');
      
      // keep the heading (first child may be <h3>Our Properties</h3>), remove other dynamic cards
      // clear after the header node
      const header = container.querySelector('h3');
      container.innerHTML = '';
      if (header) container.appendChild(header);
      
      // Show no results message if no properties match
      if (visibleProperties.length === 0) {
        if (noResultsEl) {
          noResultsEl.style.display = 'block';
          // Insert noResults message right after the header
          container.appendChild(noResultsEl);
        }
      } else {
        // Hide no results message
        if (noResultsEl) noResultsEl.style.display = 'none';
        
        // Insert dynamic featured anchor if not present
        let anchor = document.getElementById('dynamicFeaturedAnchor');
        if (!anchor) {
          anchor = document.createElement('div');
          anchor.id = 'dynamicFeaturedAnchor';
          anchor.className = 'w-100';
          container.appendChild(anchor);
        } else {
          container.appendChild(anchor);
        }

        // Append ALL filtered property cards to the main list
        visibleProperties.forEach(p => container.appendChild(createPropertyCard(p)));
        
        // Append More Properties card back if it exists in DOM or recreate minimal CTA
        const more = document.querySelector('.more-properties-card');
        if (more) container.appendChild(more);
        else {
          const moreCard = document.createElement('div');
          moreCard.className = 'card more-properties-card';
          moreCard.innerHTML = `<div class="card-body d-flex flex-column justify-content-center align-items-center text-center"><h5 class="card-title">More Properties</h5><p class="card-text">Looking for more options? Check out our listings for sale or rent!</p><div class="more-btns"><a href="for-sale.html" class="btn btn-sale">For Sale</a> <a href="for-rent.html" class="btn btn-rent">For Rent</a></div></div>`;
          container.appendChild(moreCard);
        }
      }
    }

    hideFilterLoading();

    // Also update the featured area temporarily with the first 3 visible properties
    try {
      if ((visibleProperties || []).length > 0) {
        const tempFeatured = visibleProperties.slice(0, 3).map(p => ({ ...p, featured: true }));
        renderFeatured(tempFeatured);
      } else {
        // restore real featured when no search results
        renderFeatured(currentProperties || []);
      }
    } catch (err) {
      debugError('Failed to update featured area after filter', err);
    }

    // Scroll to properties section after filtering
    const propertySection = document.getElementById('propertyList');
    if (propertySection) propertySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      
      // Close advanced filters if open
      if (advancedFilters && advancedFilters.classList.contains("show")) {
        advancedFilters.classList.remove("show");
        if (seeMoreBtn) {
          seeMoreBtn.classList.remove("active");
          const seeMoreText = seeMoreBtn.querySelector(".see-more-text");
          const seeLessText = seeMoreBtn.querySelector(".see-less-text");
          const icon = seeMoreBtn.querySelector(".see-more-icon");
          if (seeMoreText) seeMoreText.style.display = "inline";
          if (seeLessText) seeLessText.style.display = "none";
          if (icon) icon.style.transform = "rotate(0deg)";
        }
        setTimeout(() => {
          if (!advancedFilters.classList.contains("show")) {
            advancedFilters.style.display = "none";
          }
        }, 500);
      }

      const cards = document.querySelectorAll("#propertyList .card");
      cards.forEach((card) => (card.style.display = "block"));

      const noResults = document.getElementById("noResults");
      if (noResults) noResults.style.display = "none";
      // Restore featured area when filters are cleared
      try {
        renderDynamicProperties();
      } catch (err) {
        debugError('Failed to restore featured after clearing filters', err);
      }
      // hide any filter loading indicator
      hideFilterLoading();
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
function createModalInstance(id) {
  if (typeof bootstrap === "undefined") return null;
  const el = document.getElementById(id);
  return el ? new bootstrap.Modal(el) : null;
}

// Global variables for modals (will be initialized in DOMContentLoaded)
let loginModal = null;
let uploadModal = null;
let uploadTrigger = null;
let loginError = null;
let loginForm = null;
let propertyForm = null;

function initSupabase() {
  const statusEl = document.getElementById("supabaseStatus");
  if (typeof window.supabase === "undefined") {
    if (statusEl) statusEl.textContent = "(Supabase lib missing)";
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.startsWith("REPLACE_")) {
    if (statusEl) statusEl.textContent = "(Supabase not configured)";
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (statusEl) statusEl.textContent = "(Supabase ready)";
    // quick test - try to fetch a small amount from listings to validate connectivity
    fetchAndRenderListings();
  } catch (err) {
      debugError("Failed to init Supabase", err);
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

// Initialize upload/authentication functionality when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  uploadTrigger = document.getElementById("uploadPropertyBtn");
  loginError = document.getElementById("loginError");
  loginForm = document.getElementById("adminLoginForm");
  propertyForm = document.getElementById("propertyUploadForm");
  const propertyStatusSelect = document.getElementById("propertyStatus");
  const propertyPriceLabelEl = document.querySelector('label[for="propertyPrice"]');

  // Update price label when listing type changes (sale vs rent)
  if (propertyStatusSelect && propertyPriceLabelEl) {
    const updatePriceLabelForStatus = () => {
      const val = propertyStatusSelect.value;
      if (val === "rent") {
        propertyPriceLabelEl.textContent = "Price (p/m)";
      } else {
        propertyPriceLabelEl.textContent = "Price (numbers only)";
      }
    };
    propertyStatusSelect.addEventListener("change", updatePriceLabelForStatus);
    // set initial label state
    updatePriceLabelForStatus();
  }

  // Create modal instances
  loginModal = createModalInstance("loginModal");
  uploadModal = createModalInstance("uploadModal");

  // Set up upload button click handler
  if (uploadTrigger) {
    uploadTrigger.addEventListener("click", () => {
      if (isAuthenticated()) {
        // Reset form to create mode when opening via upload button
        resetFormToCreateMode();
        uploadModal?.show();
      } else {
        ensureAuthenticated();
      }
    });
  }

  // Reset form when modal is closed
  const uploadModalElement = document.getElementById("uploadModal");
  if (uploadModalElement) {
    uploadModalElement.addEventListener("hidden.bs.modal", () => {
      resetFormToCreateMode();
    });
  }

  // Set up login form handler
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

  // Set up property form handler
  if (propertyForm) {
    propertyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ensureAuthenticated()) return;

    try {

    // Show loading state
    const submitBtn = document.getElementById("formSubmitBtn");
    const submitText = submitBtn?.querySelector(".submit-text");
    const loadingText = submitBtn?.querySelector(".loading-text");
    const spinner = submitBtn?.querySelector(".spinner-border");
    const resetBtn = document.getElementById("formResetBtn");
    
    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitText) submitText.classList.add("d-none");
      if (loadingText) loadingText.classList.remove("d-none");
      if (spinner) spinner.classList.remove("d-none");
    }
    if (resetBtn) resetBtn.disabled = true;

    // Check if we're in edit mode
    const isEditMode = propertyForm.dataset.editMode === "true";
    const editPropertyId = propertyForm.dataset.editPropertyId;

    // Check featured property cap (max 3) - but allow if editing the same property
    const isFeatured = document.getElementById("propertyFeatured").checked;
    if (isFeatured) {
      const MAX_FEATURED = 3;
      let currentFeaturedCount = 0;
      
      // Count current featured properties
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from("listings")
            .select("id, featured")
            .eq("featured", true);
          
          if (!error && data) {
            // If editing, exclude the current property from the count
            const featuredList = isEditMode 
              ? data.filter(p => p.id !== editPropertyId)
              : data;
            currentFeaturedCount = featuredList.length;
          }
        } catch (err) {
          debugError("Error checking featured count:", err);
        }
      }
      
      // Also check localStorage
      const localProperties = getStoredProperties();
      const localFeatured = localProperties.filter(p => {
        if (isEditMode && p.id === editPropertyId) return false;
        return p.featured && p.id;
      });
      currentFeaturedCount = Math.max(currentFeaturedCount, localFeatured.length);
      
      if (currentFeaturedCount >= MAX_FEATURED) {
        alert(`⚠️ Maximum ${MAX_FEATURED} featured properties allowed.\n\nPlease unfeature another property first, or upload this property without the "Feature this listing" option.`);
        return;
      }
    }

    const property = await buildPropertyFromForm();
    
    // If editing, preserve the original ID, creation date, and existing images
    if (isEditMode && editPropertyId) {
      property.id = editPropertyId;
      
      // Preserve existing property data if available
      let existingProperty = null;
      
      // Try to get from Supabase
      if (supabaseClient) {
        try {
          const { data } = await supabaseClient
            .from("listings")
            .select("*")
            .eq("id", editPropertyId)
            .single();
          
          if (data) {
            existingProperty = {
              createdAt: data.created_at,
              images: data.images || [],
              image: data.image_url || data.image,
            };
          }
        } catch (err) {
            debugWarn("Could not fetch existing property:", err);
        }
      }
      
      // Fallback to localStorage
      if (!existingProperty) {
        const storedProperties = getStoredProperties();
        const found = storedProperties.find(p => p.id === editPropertyId);
        if (found) {
          existingProperty = {
            createdAt: found.createdAt,
            images: found.images || [],
            image: found.image,
          };
        }
      }
      
      // Preserve creation date and images if no new images uploaded
      if (existingProperty) {
        property.createdAt = existingProperty.createdAt;
        // Only preserve existing images if no new files were selected
        const files = document.getElementById("propertyImage")?.files || [];
        if (files.length === 0 && existingProperty.images && existingProperty.images.length > 0) {
          property.images = existingProperty.images;
          property.image = existingProperty.image;
        }
      }
    }

    // If Supabase is configured, attempt to upload images and insert/update into listings table.
    if (supabaseClient) {
      try {
        const files = document.getElementById("propertyImage")?.files || [];
        let uploadedUrls = [];

        // Only upload new images if files are selected
        if (files.length > 0) {
          for (const file of Array.from(files)) {
            const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from(STORAGE_BUCKET)
              .upload(path, file, { cacheControl: "3600", upsert: false });

            if (uploadError) {
              debugWarn("Storage upload failed for", file.name, uploadError);
              continue; // skip this file
            }

            // get public URL
            const { data: publicUrlData } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
            if (publicUrlData && publicUrlData.publicUrl) {
              uploadedUrls.push(publicUrlData.publicUrl);
            }
          }
        }

        const listingRow = {
          title: property.title,
          transaction: property.transaction,
          location: property.location,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          size: property.size || 0,
          parking: property.parking || 0,
          year_built: property.yearBuilt || null,
          furnished: property.furnished || null,
          type: property.type,
          description: property.description,
          featured: property.featured || false,  // Ensure boolean
        };

        // If editing, preserve existing images if no new ones uploaded
        if (isEditMode) {
          // Try to get existing property to preserve images
          try {
            const { data: existingData } = await supabaseClient
              .from("listings")
              .select("images, image_url")
              .eq("id", editPropertyId)
              .single();
            
            if (existingData) {
              // If new images uploaded, use them; otherwise keep existing
              if (uploadedUrls.length > 0) {
                listingRow.image_url = uploadedUrls[0];
                listingRow.images = uploadedUrls;
              } else {
                listingRow.image_url = existingData.image_url || property.image;
                listingRow.images = existingData.images || (property.images || []);
              }
            }
          } catch (err) {
            debugWarn("Could not fetch existing images:", err);
            listingRow.image_url = uploadedUrls[0] || property.image || null;
            listingRow.images = uploadedUrls.length > 0 ? uploadedUrls : (property.images || []);
          }

          // Update existing listing
          const { data: updateData, error: updateError } = await supabaseClient
            .from("listings")
            .update(listingRow)
            .eq("id", editPropertyId)
            .select();

          if (updateError) {
            debugError("Failed to update listing", updateError);
            // fallback to localStorage
            updatePropertyInStorage(property);
            throw new Error("Failed to update property in database. Changes saved locally as backup.");
          } else {
            debugLog("✅ Updated listing in Supabase", updateData);
            // Also update localStorage as backup
            updatePropertyInStorage(property);
          }
        } else {
          // Create new listing
          listingRow.image_url = uploadedUrls[0] || property.image || null;
          listingRow.images = uploadedUrls;

          const { data: insertData, error: insertError } = await supabaseClient
            .from("listings")
            .insert([listingRow])
            .select();

          if (insertError) {
            debugError("Failed to insert listing", insertError);
            // fallback to localStorage
            persistProperty(property);
            throw new Error("Failed to save property to database. Saved locally as backup.");
          } else {
            debugLog("✅ Inserted listing to Supabase", insertData);
            // Also save to localStorage as backup
            persistProperty(property);
          }
        }
      } catch (err) {
        debugError("Supabase upload error", err);
        // fallback
        try {
          if (isEditMode) {
            updatePropertyInStorage(property);
          } else {
            persistProperty(property);
          }
          // If localStorage save succeeds, show warning but continue
          if (err.message && !err.message.includes("Failed to save")) {
            throw new Error("Database connection issue. Property saved locally. Please check your connection.");
          }
        } catch (storageErr) {
          throw new Error("Failed to save property. Please try again or contact support.");
        }
      }
    } else {
      // Supabase not configured: save to localStorage
      if (isEditMode) {
        updatePropertyInStorage(property);
      } else {
        persistProperty(property);
      }
    }

    // Reset form and close modal
    resetFormToCreateMode();
    const uploadModal = bootstrap.Modal.getInstance(document.getElementById("uploadModal"));
    uploadModal?.hide();
    
    // Wait a moment for Supabase to process, then re-render
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchAndRenderListings();
    
    // Show success message
    const message = isEditMode
      ? "✅ Property updated successfully!"
      : (property.featured 
        ? "✅ Property uploaded successfully! It will appear on the home page." 
        : "✅ Property uploaded successfully! Check the For Sale or For Rent pages to see it.");
    alert(message);
    } catch (error) {
      // User-friendly error message
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      alert(`❌ ${errorMessage}`);
      debugError("Property form submission error:", error);
    } finally {
      // Reset loading state
      const submitBtn = document.getElementById("formSubmitBtn");
      const submitText = submitBtn?.querySelector(".submit-text");
      const loadingText = submitBtn?.querySelector(".loading-text");
      const spinner = submitBtn?.querySelector(".spinner-border");
      const resetBtn = document.getElementById("formResetBtn");
      
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitText) submitText.classList.remove("d-none");
        if (loadingText) loadingText.classList.add("d-none");
        if (spinner) spinner.classList.add("d-none");
      }
      if (resetBtn) resetBtn.disabled = false;
    }
    });
  }
}); // End of DOMContentLoaded

// Function to update property in localStorage
function updatePropertyInStorage(property) {
  const properties = getStoredProperties();
  const index = properties.findIndex(p => p.id === property.id);
  
  if (index !== -1) {
    // Preserve original creation date if it exists
    if (properties[index].createdAt) {
      property.createdAt = properties[index].createdAt;
    }
    properties[index] = property;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    debugLog("✅ Updated property in localStorage");
  } else {
    // If not found, add as new
    persistProperty(property);
  }
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
    size: Number(document.getElementById("propertySize")?.value || 0),
    parking: Number(document.getElementById("propertyParking")?.value || 0),
    yearBuilt: document.getElementById("propertyYearBuilt")?.value || "",
    furnished: document.getElementById("propertyFurnished")?.value || "",
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
    debugError("Failed to parse stored properties", error);
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
  // keep live store in sync for filtering
  currentProperties = properties;
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
    // keep live store in sync
    currentProperties = properties;
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
      debugError("Failed to fetch listings from Supabase", error);
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
      size: row.size || 0,
      parking: row.parking || 0,
      yearBuilt: row.year_built || row.yearBuilt || "",
      furnished: row.furnished || "",
      type: row.type,
      description: row.description,
      featured: !!row.featured,  // Convert to boolean
      image: row.image_url || (Array.isArray(row.images) && row.images[0]) || null,
      images: row.images || [],
      createdAt: row.created_at || null,
    }));

    // Update live store so filters operate against backend data
    currentProperties = properties;

    debugLog("📊 Fetched properties from Supabase:", properties.length);
    debugLog("⭐ Featured properties:", properties.filter(p => p.featured).length);
    
    renderFeatured(properties);
    renderStatusList(properties, "salePropertiesList", "sale");
    renderStatusList(properties, "rentPropertiesList", "rent");

    if (localNotice) {
      localNotice.style.display = "none";
    }
  } catch (err) {
    debugError("Error fetching listings", err);
  }
}

function renderFeatured(properties) {
  const anchor = document.getElementById("dynamicFeaturedAnchor");
  if (!anchor) {
    debugWarn("⚠️ dynamicFeaturedAnchor not found");
    return;
  }

  // Filter for featured properties only
  const featured = properties.filter((property) => {
    const isFeatured = !!property.featured;
    if (isFeatured) {
      debugLog("⭐ Rendering featured property:", property.title);
    }
    return isFeatured;
  });
  
  // Save the "More Properties" card before clearing
  const moreCard = document.getElementById("morePropertiesCard");
  const wasInAnchor = moreCard && anchor.contains(moreCard);
  
  anchor.innerHTML = "";

  // Sort by creation date (newest first) and limit to 3
  const sorted = featured.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  // Limit to 3 featured properties (newest first)
  const MAX_FEATURED = 3;
  const limited = sorted.slice(0, MAX_FEATURED);

  if (limited.length > 0) {
    debugLog(`✅ Rendering ${limited.length} featured property/properties`);
    limited.forEach((property) => {
      anchor.appendChild(createPropertyCard(property));
    });
  } else {
    debugLog("ℹ️ No featured properties to display");
  }
  
  // Always move "More Properties" card beside the cards (even if no featured properties)
  setTimeout(() => moveMorePropertiesCard(limited.length), 100);
}

function renderStatusList(properties, containerId, status) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filtered = properties.filter(
    (property) => property.transaction === status,
  );

  container.innerHTML = "";

  // Update count display
  const countElement = document.getElementById(status === "sale" ? "saleCount" : "rentCount");
  if (countElement) {
    countElement.textContent = filtered.length;
  }

  if (!filtered.length) {
    const emptyIcon = status === "sale" ? "🏠" : "🔑";
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${emptyIcon}</div>
        <h3>No Properties Available</h3>
        <p>No ${status === "sale" ? "sales" : "rental"} listings uploaded yet. Use the "Upload Property" button to add one.</p>
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
  // ensure each card has the property id available for filter/feature logic
  card.dataset.propertyId = property.id || "";
  card.dataset.location = property.location || "";
  card.dataset.bedrooms = property.bedrooms || 0;
  card.dataset.bathrooms = property.bathrooms || 0;
  card.dataset.price = property.price || 0;
  card.dataset.type = property.type || "";
  card.dataset.transaction = property.transaction || "";
  card.dataset.size = property.size || property.size || 0;
  card.dataset.parking = property.parking || property.parking || 0;
  card.dataset.yearBuilt = property.yearBuilt || property.year_built || "";

  const price = Number(property.price || 0).toLocaleString();
  const coverImage =
    property.image ||
    (Array.isArray(property.images) && property.images[0]) ||
    DEFAULT_IMAGE;

  // Check if property is for rent to add "p/m" to price
  const transactionType = (property.transaction || "").toLowerCase().trim();
  const priceLabel = (transactionType === "rent" || transactionType === "for rent") ? "p/m" : "";

  // Build details string with optional size and parking
  let details = `📍 <strong>Location:</strong> ${property.location}<br>🛏️ ${property.bedrooms} Beds &nbsp; | &nbsp; 🛁 ${property.bathrooms} Baths`;
  if (property.size && property.size > 0) {
    details += ` &nbsp; | &nbsp; 📐 ${property.size.toLocaleString()} sqft`;
  }
  if (property.parking && property.parking > 0) {
    details += ` &nbsp; | &nbsp; 🚗 ${property.parking} Parking`;
  }

  // Match the exact design of existing cards - no badge, same format
  // Separate buttons: Edit on top-left, Delete on top-right
  card.innerHTML = `
    <button class="edit-property-btn" data-property-id="${property.id}" title="Edit Property">
      ✏️ Edit
    </button>
    <button class="delete-property-btn" data-property-id="${property.id}" title="Delete Property">
      🗑️ Delete
    </button>
    <a href="property-detail.html?id=${property.id}" class="card-link-wrapper">
      <img src="${coverImage}" alt="${property.title}">
      <div class="card-body">
        <h5 class="card-title">${property.title}</h5>
        <p class="card-text">
          ${details}
        </p>
        <strong><p class="card-text">R ${price}${priceLabel ? ` ${priceLabel}` : ''}</p></strong>
        <span class="btn btn-primary">View Details</span>
      </div>
    </a>
  `;

  // Add edit functionality
  const editBtn = card.querySelector('.edit-property-btn');
  if (editBtn) {
    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleEditProperty(property);
    });
  }

  // Add delete functionality
  const deleteBtn = card.querySelector('.delete-property-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleDeleteProperty(property.id, property.title);
    });
  }

  // Prevent card link from triggering when clicking buttons
  const cardLink = card.querySelector('.card-link-wrapper');
  if (cardLink) {
    cardLink.addEventListener('click', (e) => {
      // If clicking on a button, don't navigate
      if (e.target.closest('.edit-property-btn') || e.target.closest('.delete-property-btn')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  return card;
}

/* -------------------------------------------------------------------------- */
/*                         Edit Property Function                             */
/* -------------------------------------------------------------------------- */
async function handleEditProperty(property) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    alert("⚠️ You must be logged in as admin to edit properties.");
    ensureAuthenticated();
    return;
  }

  // Load property data into the form
  loadPropertyIntoForm(property);

  // Show the upload modal
  const uploadModal = new bootstrap.Modal(document.getElementById("uploadModal"));
  uploadModal.show();
}

function loadPropertyIntoForm(property) {
  // Set edit mode flag
  const form = document.getElementById("propertyUploadForm");
  if (!form) return;

  // Store the property ID for update
  form.dataset.editPropertyId = property.id;
  form.dataset.editMode = "true";

  // Update modal title
  const modalTitle = document.getElementById("uploadModalLabel");
  if (modalTitle) {
    modalTitle.textContent = "Edit Property";
  }

  // Update submit button text
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Update Property";
  }

  // Fill in all form fields
  document.getElementById("propertyTitle").value = property.title || "";
  document.getElementById("propertyStatus").value = property.transaction || "";
  // Update price label in edit mode based on transaction
  const _priceLabelEl = document.querySelector('label[for="propertyPrice"]');
  if (_priceLabelEl) {
    const t = (property.transaction || "").toString().toLowerCase();
    _priceLabelEl.textContent = (t === "rent" || t === "for rent") ? "Price (p/m)" : "Price (numbers only)";
  }
  document.getElementById("propertyLocation").value = property.location || "";
  document.getElementById("propertyPrice").value = property.price || "";
  document.getElementById("propertyBedrooms").value = property.bedrooms || "";
  document.getElementById("propertyBathrooms").value = property.bathrooms || "";
  document.getElementById("propertySize").value = property.size || "";
  document.getElementById("propertyParking").value = property.parking || "";
  document.getElementById("propertyYearBuilt").value = property.yearBuilt || property.year_built || "";
  document.getElementById("propertyFurnished").value = property.furnished || "";
  document.getElementById("propertyType").value = property.type || "";
  document.getElementById("propertyDescription").value = property.description || "";
  document.getElementById("propertyFeatured").checked = property.featured || false;

  // Note: Images are not pre-filled as file inputs can't be set programmatically for security
  // The existing images will be preserved if no new images are uploaded
}

function resetFormToCreateMode() {
  const form = document.getElementById("propertyUploadForm");
  if (!form) return;

  // Remove edit mode flags
  delete form.dataset.editPropertyId;
  delete form.dataset.editMode;

  // Reset modal title
  const modalTitle = document.getElementById("uploadModalLabel");
  if (modalTitle) {
    modalTitle.textContent = "Upload New Property";
  }

  // Reset submit button text
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Save Listing";
  }

  // Reset form
  form.reset();

  // Reset price label to default
  const _defaultPriceLabel = document.querySelector('label[for="propertyPrice"]');
  if (_defaultPriceLabel) _defaultPriceLabel.textContent = "Price (numbers only)";
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
        debugError('Supabase delete error:', error);
        throw new Error('Failed to delete from database: ' + error.message);
      }

      debugLog('✅ Property deleted from Supabase');
    } else {
      // Delete from localStorage
      const properties = getStoredProperties();
      const filtered = properties.filter(p => p.id !== propertyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      debugLog('✅ Property deleted from localStorage');
    }

    // Refresh all displays - main page, for-sale, and for-rent
    await fetchAndRenderListings();
    alert('✅ Property deleted successfully!');

  } catch (error) {
    debugError('Delete error:', error);
    const errorMessage = error.message || "An unexpected error occurred while deleting the property.";
    alert(`❌ ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
  }
}

// Function to move "More Properties" card beside featured cards
function moveMorePropertiesCard(featuredCount) {
  const moreCard = document.getElementById("morePropertiesCard");
  const anchor = document.getElementById("dynamicFeaturedAnchor");
  
  if (!moreCard || !anchor) {
    debugWarn("⚠️ More Properties card or anchor not found");
    return;
  }
  
  // Always show the card
  moreCard.style.display = "block";
  
  // Remove from current parent if it exists (to avoid duplicates)
  if (moreCard.parentNode) {
    moreCard.parentNode.removeChild(moreCard);
  }
  
  // Move card to be beside the featured cards (within the grid)
  anchor.appendChild(moreCard);
  
  debugLog("✅ More Properties card moved to anchor");
}

renderDynamicProperties();

// initialize Supabase client if configuration is present
try {
  initSupabase();
} catch (e) {
  debugWarn("initSupabase call failed:", e);
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    renderDynamicProperties();
  }
});
