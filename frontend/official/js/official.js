/**
 * Official Page JavaScript
 * Church Officials Management System - Public Page
 */

// API Configuration
const API_BASE_URL = "http://localhost:3000/api/officials";
const API_UPLOAD_URL= "http://localhost:3000"

// Category Order (as specified)
const CATEGORY_ORDER = [
  "Executive",
  "Jumuia",
  "Bible",
  "Rosary",
  "Pamphlet",
  "Project",
  "Liturgist",
  "Choir",
  "Catechist",
];

// Category Display Names
const CATEGORY_NAMES = {
  Executive: "Executive Committee",
  Jumuia: "Jumuia Coordinators",
  Bible: "Bible Study Coordinators",
  Rosay: "Rosary Coordinators",
  Pamphlet: "Pamphlet Managers",
  Project: "Project Managers",
  Liturgist: "Liturgists",
  Choir: "Choir Official",
  Catechist: "Catechists",
};

// Placeholder image for missing photos
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23999" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

// DOM Elements
let officialsContainer;
let loadingContainer;
let errorContainer;
let errorMessage;
let errorDetails;

/**
 * Initialize the page
 */
function init() {
  // Cache DOM elements
  officialsContainer = document.getElementById("officials-container");
  loadingContainer = document.getElementById("loading-container");
  errorContainer = document.getElementById("error-container");
  errorMessage = document.getElementById("error-message");
  errorDetails = document.getElementById("error-details");

  // Fetch officials data
  fetchOfficials();
}

/**
 * Fetch officials from API
 */
async function fetchOfficials() {
  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}`);
console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const officials = await response.json();

    renderOfficials(officials);
  } catch (error) {
    console.error("Error fetching officials:", error);
    showError(error.message);
  }
}

/**
 * Render officials grouped by category
 * @param {Array} officials - Array of official objects
 */
function renderOfficials(officials) {
  // Hide loading
  hideLoading();

  // Clear existing content
  officialsContainer.innerHTML = "";

  // Check if officials array is empty
  if (!officials || officials.length === 0) {
    showEmptyState();
    return;
  }

  // Group officials by category
  const officialsByCategory = groupOfficialsByCategory(officials);

  // Render each category in order
  CATEGORY_ORDER.forEach((category) => {
    const categoryOfficials = officialsByCategory[category] || [];
    const sortedOfficials = sortOfficialsByHierarchy(category, categoryOfficials);
    renderCategorySection(category, sortedOfficials);
  });
}

/**
 * Sort officials by position hierarchy within a category
 * @param {string} category - Category name
 * @param {Array} officials - Array of officials to sort
 * @returns {Array} Sorted officials by hierarchy
 */
function sortOfficialsByHierarchy(category, officials) {
  const POSITION_HIERARCHY = {
    'Executive': ['Chairperson', 'Vice Chairperson', 'Organizing Secretary', 'Treasurer', 'Secretary', 'Assistant Secretary'],
    'Jumuia': ['Jumuia Coordinator', 'Assistant Jumuia Coordinator'],
    'Bible': ['Bible Study Coordinator', 'Assistant Bible Study Coordinator'],
    'Rosary': ['Rosary Coordinator', 'Assistant Rosary Coordinator'],
    'Pamphlet': ['Pamphlet Manager', 'Assistant Pamphlet Manager'],
    'Project': ['Project Manager', 'Assistant Project Manager'],
    'Liturgist': ['Liturgist', 'Assistant Liturgist'],
    'Choir': ['Choir Chairperson', 'Choir Vice Chairperson'],
    'Catechist': ['Catechist']
  };

  const hierarchy = POSITION_HIERARCHY[category] || [];
  
  return [...officials].sort((a, b) => {
    const posA = a.position || a.category || '';
    const posB = b.position || b.category || '';
    const indexA = hierarchy.indexOf(posA);
    const indexB = hierarchy.indexOf(posB);
    
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * Group officials by their category
 * @param {Array} officials - Array of official objects
 * @returns {Object} Officials grouped by category
 */
function groupOfficialsByCategory(officials = []) {
  const grouped = {};

  officials.data.forEach((official) => {
    const category = official.category || "Other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(official);
  });

  return grouped;
}

/**
 * Render a category section with its officials
 * @param {string} category - Category name
 * @param {Array} officials - Array of officials in this category
 */
function renderCategorySection(category, officials) {
  const displayName = CATEGORY_NAMES[category] || category;

  // Create section element
  const section = document.createElement("section");
  section.className = "category-section";
  section.setAttribute("aria-labelledby", `category-${category.toLowerCase()}`);

  // Create header
  const header = document.createElement("div");
  header.className = "category-header";

  const title = document.createElement("h3");
  title.id = `category-${category.toLowerCase()}`;
  title.textContent = displayName;

  const badge = document.createElement("span");
  badge.className = "category-badge";
  badge.textContent = `${officials.length} member${officials.length !== 1 ? "s" : ""}`;

  const divider = document.createElement("div");
  divider.className = "category-divider";

  header.appendChild(title);
  header.appendChild(badge);
  header.appendChild(divider);

  // Create grid for officials
  const grid = document.createElement("div");
  grid.className = "officials-grid";
  grid.setAttribute("role", "list");

  if (officials.length === 0) {
    // Show empty state for this category
    const emptyState = createEmptyStateForCategory(displayName);
    grid.appendChild(emptyState);
  } else {
    // Render each official card
    officials.forEach((official) => {
      const card = createOfficialCard(official);
      grid.appendChild(card);
    });
  }

  // Assemble section
  section.appendChild(header);
  section.appendChild(grid);

  // Add to container
  officialsContainer.appendChild(section);
}

// /**
//  * Create an official card element
//  * @param {Object} official - Official object
//  * @returns {HTMLElement} Official card element
//  */
// function createOfficialCard(official) {
//   console.log(official);

//   const card = document.createElement("article");
//   card.className = "official-card";
//   card.setAttribute("role", "listitem");

//   // Get photo URL or use placeholder
//   const photoUrl = official.photo || PLACEHOLDER_IMAGE;
  

//   // Create photo container
//   const photoContainer = document.createElement("div");
//   photoContainer.className = "official-photo-container";

//   // Check if official has a valid photo
//   if (official.photo) {
//     const img = document.createElement("img");
//     img.className = "official-photo";
//     img.src =`${API_UPLOAD_URL}/${photoUrl}`;
//     img.alt = `${official.name}'s photo`;
//     img.onerror = handleImageError;
//     photoContainer.appendChild(img);
//   } else {
//     // Use placeholder
//     const placeholder = document.createElement("div");
//     placeholder.className = "official-photo-placeholder";
//     placeholder.textContent = "👤";
//     placeholder.setAttribute(
//       "aria-label",
//       `Photo placeholder for ${official.name}`,
//     );
//     photoContainer.appendChild(placeholder);
//   }

//   // Create name element
//   const name = document.createElement("h4");
//   name.className = "official-name";
//   name.textContent = official.name;

//   // Create category badge
//   const category = document.createElement("span");
//   category.className = "official-category";
//   category.textContent = official.category || "Member";

//   // Assemble card
//   card.appendChild(photoContainer);
//   card.appendChild(name);
//   card.appendChild(category);

//   return card;
// }

/**
 * Create an official card element
 * @param {Object} official - Official object
 * @returns {HTMLElement} Official card element
 */
function createOfficialCard(official) {
  console.log(official);

  const card = document.createElement("article");
  card.className = "official-card";
  card.setAttribute("role", "listitem");

  // Create photo container
  const photoContainer = document.createElement("div");
  photoContainer.className = "official-photo-container";

  // Check if official has a valid photo
  if (official.photo) {
    const img = document.createElement("img");
    img.className = "official-photo";
    // Build photo URL - handle both absolute and relative paths
    const photoPath = official.photo.startsWith('/') 
      ? official.photo 
      : '/' + official.photo;
    img.src = `${API_UPLOAD_URL}${photoPath}`;
    img.alt = `${official.name}'s photo`;
    img.onerror = handleImageError;
    photoContainer.appendChild(img);
  } else {
    // Use placeholder
    const img = document.createElement("img");
    img.className = "official-photo";
    img.src = PLACEHOLDER_IMAGE;
    img.alt = `${official.name}'s photo (placeholder)`;
    img.onerror = handleImageError;
    photoContainer.appendChild(img);
  }

  // Create name element
  const name = document.createElement("h4");
  name.className = "official-name";
  name.textContent = official.name;

  // Create position badge (changed from category)
  const position = document.createElement("span");
  position.className = "official-position";
  position.textContent = official.position || official.category || "Member";

  // Create contact element (phone only)
  const phone = official.contact || '';
  let contactEl = null;
  if (phone) {
    contactEl = document.createElement('p');
    contactEl.className = 'official-contact';
    const a = document.createElement('a');
    a.href = `tel:${phone.replace(/[^+0-9]/g, '')}`;
    a.textContent = phone;
    contactEl.appendChild(a);
  }

  // Assemble card
  card.appendChild(photoContainer);
  card.appendChild(name);
  card.appendChild(position);
  if (contactEl) card.appendChild(contactEl);

  return card;
}

/**
 * Create empty state for a category
 * @param {string} categoryName - Category display name
 * @returns {HTMLElement} Empty state element
 */
function createEmptyStateForCategory(categoryName) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
        <div class="empty-state-icon">📋</div>
        <p>No officials at the momement in the ${categoryName} category</p>
    `;
  return emptyState;
}

/**
 * Handle image loading error
 * @param {Event} event - Error event
 */
function handleImageError(event) {
  const img = event.target;
  img.src = PLACEHOLDER_IMAGE;
  img.alt = `${img.alt.split("'")[0]}'s photo (placeholder)`;
  img.onerror = null; // Prevent infinite loop
}

/**
 * Show loading state
 */
function showLoading() {
  loadingContainer.style.display = "flex";
  officialsContainer.style.display = "none";
  errorContainer.style.display = "none";
}

/**
 * Hide loading state
 */
function hideLoading() {
  loadingContainer.style.display = "none";
  officialsContainer.style.display = "block";
}

/**
 * Show error state
 * @param {string} message - Error message
 * @param {string} details - Optional error details
 */
function showError(message, details = "") {
  loadingContainer.style.display = "none";
  officialsContainer.style.display = "none";
  errorContainer.style.display = "block";

  errorMessage.textContent = "Unable to load officials";
  errorDetails.textContent =
    details || `Please try again later. (Error: ${message})`;
}

/**
 * Show empty state (no officials at all)
 */
function showEmptyState() {
  officialsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem;">
            <div class="empty-state-icon">📋</div>
            <h3>No Officials Found</h3>
            <p>There are currently no officials listed for this ministry.</p>
        </div>
    `;
  officialsContainer.style.display = "grid";
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
