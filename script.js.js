document.getElementById("filterForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const location = document.getElementById("location").value.toLowerCase();
  const bedrooms = document.getElementById("bedrooms").value;
  const bathrooms = document.getElementById("bathrooms").value;
  const priceRange = document.getElementById("priceRange").value;
  const propertyType = document.getElementById("propertyType").value;

  const [minPrice, maxPrice] = priceRange
    ? priceRange.includes("+")
      ? [parseInt(priceRange), Infinity]
      : priceRange.split("-").map(Number)
    : [0, Infinity];

  const cards = document.querySelectorAll("#propertyList .card");
  const noResults = document.getElementById("noResults");
  let visibleCount = 0;

  cards.forEach((card) => {
    const cardLocation = card.dataset.location.toLowerCase();
    const cardBedrooms = parseInt(card.dataset.bedrooms);
    const cardBathrooms = parseInt(card.dataset.bathrooms);
    const cardPrice = parseInt(card.dataset.price);
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

  // If no matches show message, else hide it
  if (visibleCount === 0) {
    noResults.style.display = "block";
  } else {
    noResults.style.display = "none";
  }
});

// Clear button functionality
const filterForm = document.getElementById("filterForm");
const clearBtn = document.getElementById("clearFilters");

// Watch for user input to show Clear button
filterForm.addEventListener("input", () => {
  let isActive = false;
  filterForm.querySelectorAll("input, select").forEach(field => {
    if (field.value.trim() !== "") isActive = true;
  });

  if (isActive) {
    clearBtn.classList.add("visible");
  } else {
    clearBtn.classList.remove("visible");
  }
});

// Reset everything when Clear is clicked
clearBtn.addEventListener("click", () => {
  filterForm.reset();
  clearBtn.classList.remove("visible");

  const cards = document.querySelectorAll("#propertyList .card");
  cards.forEach(card => card.style.display = "block");

  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = "none";
});

// Reviews Card

const wrapper = document.querySelector('.reviews-wrapper');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

const scrollPerClick = wrapper.querySelector('.review-card').offsetWidth + 20; // card width + gap

nextBtn.addEventListener('click', () => {
  wrapper.scrollBy({ left: scrollPerClick, behavior: 'smooth' });
});

prevBtn.addEventListener('click', () => {
  wrapper.scrollBy({ left: -scrollPerClick, behavior: 'smooth' });
});
