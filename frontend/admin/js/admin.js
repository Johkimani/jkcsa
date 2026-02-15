// ============ NEW: POSITION MAPPING BY CATEGORY ============
/**
 * Maps each category to its available positions
 * Used to populate position dropdown based on selected category
 */
const POSITION_BY_CATEGORY = {
    'Executive': [
        'Chairperson',
        'Vice Chairperson',
        'Organizing Secretary',
        'Treasurer',
        'Secretary',
        'Assistant Secretary'
    ],
    'Jumuia': [
        'Jumuia Coordinator',
        'Assistant Jumuia Coordinator'
    ],
    'Bible': [
        'Bible Study Coordinator',
        'Assistant Bible Study Coordinator'
    ],
    'Rosary': [
        'Rosary Coordinator',
        'Assistant Rosary Coordinator'
    ],
    'Pamphlet': [
        'Pamphlet Manager',
        'Assistant Pamphlet Manager'
    ],
    'Project': [
        'Project Manager',
        'Assistant Project Manager'
    ],
    'Liturgist': [
        'Liturgist',
        'Assistant Liturgist'
    ],
    'Choir': [
        'Choir Chairperson',
        'Choir Vise Chairperson'
    ],
    'Catechist': [
        'Catechist'
    ]
};

// ============ EXISTING CODE ============
const API_BASE_URL = 'http://localhost:3000/api/officials';

const CATEGORY_LIMITS = {
    'Executive': 6,
    'Jumuia': 2,
    'Bible': 2,
    'Rosary': 2,
    'Pamphlet': 2,
    'Project': 2,
    'Liturgist': 2,
    'Choir': 2,
    'Catechist': 1
};

// ============ UPDATED: DOM ELEMENTS WITH POSITION FIELDS ============
const elements = {
    // Stats
    statsGrid: document.getElementById('statsGrid'),
    
    // Add Form - UPDATED with position field
    addOfficialForm: document.getElementById('addOfficialForm'),
    officialName: document.getElementById('officialName'),
    officialCategory: document.getElementById('officialCategory'),
    officialPosition: document.getElementById('officialPosition'),  // NEW
    officialContact: document.getElementById('officialContact'),  // NEW
    officialPhoto: document.getElementById('officialPhoto'),
    addSubmitBtn: document.getElementById('addSubmitBtn'),
    addMessageArea: document.getElementById('addMessageArea'),
    
    // Table
    officialsTableBody: document.getElementById('officialsTableBody'),
    searchInput: document.getElementById('searchInput'),
    filterCategory: document.getElementById('filterCategory'),
    emptyState: document.getElementById('emptyState'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    
    // Edit Modal - UPDATED with position field
    editModal: document.getElementById('editModal'),
    editOfficialForm: document.getElementById('editOfficialForm'),
    editOfficialId: document.getElementById('editOfficialId'),
    editName: document.getElementById('editName'),
    editCategory: document.getElementById('editCategory'),
    editPosition: document.getElementById('editPosition'),  // NEW
    editContact: document.getElementById('editContact'),  // NEW (may be null if HTML not updated)
    editPhoto: document.getElementById('editPhoto'),
    currentPhoto: document.getElementById('currentPhoto'),
    currentPhotoPreview: document.getElementById('currentPhotoPreview'),
    editSubmitBtn: document.getElementById('editSubmitBtn'),
    editMessageArea: document.getElementById('editMessageArea'),
    
    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteMessage: document.getElementById('deleteMessage'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
};

// State
let currentOfficials = [];
let officialsToDelete = null;
let searchTimeout; // For debouncing search

// ============ PHONE VALIDATION ============
/**
 * Validates phone number format
 * Accepts: +1234567890, (123) 456-7890, 123-456-7890, etc.
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidPhone(phone) {
    if (!phone) return true; // Optional field
    // Allow digits, spaces, hyphens, parentheses, plus sign
    const phoneRegex = /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.trim());
}

// ============ DEBOUNCE FUNCTION ============
/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(searchTimeout);
            func(...args);
        };
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(later, wait);
    };
}

// ============ NEW: GET TAKEN POSITIONS IN CATEGORY ============
/**
 * Get all positions that are already taken in a category
 * @param {string} category - The category to check
 * @param {number} excludeOfficialId - Optional: Official ID to exclude (for editing)
 * @returns {Set} Set of taken positions
 */
function getTakenPositions(category, excludeOfficialId = null) {
    const officialsArray = Array.isArray(currentOfficials) ? currentOfficials : (currentOfficials.data || []);
    const takenPositions = new Set();
    
    officialsArray.forEach(official => {
        // Skip the official being edited
        if (excludeOfficialId && official.id === excludeOfficialId) {
            return;
        }
        
        // Add position if it's in this category
        if (official.category === category && official.position) {
            takenPositions.add(official.position);
        }
    });
    
    return takenPositions;
}

// ============ UPDATED: POPULATE POSITION DROPDOWN FUNCTION ============
/**
 * Populates position dropdown based on selected category
 * Hides positions that are already taken
 * Called when category selection changes
 * @param {string} category - The selected category
 * @param {HTMLElement} positionSelect - The position select element to populate
 * @param {number} excludeOfficialId - Optional: Official ID to exclude (for editing)
 */
function populatePositions(category, positionSelect, excludeOfficialId = null) {
    // Clear existing positions
    positionSelect.innerHTML = '<option value="">Select a position</option>';
    
    // Check if category has defined positions
    if (POSITION_BY_CATEGORY[category]) {
        // Get positions for this category
        const positions = POSITION_BY_CATEGORY[category];
        
        // Get taken positions in this category
        const takenPositions = getTakenPositions(category, excludeOfficialId);
        
        // Add each position as an option (only if not taken)
        positions.forEach(position => {
            const isTaken = takenPositions.has(position);
            
            if (!isTaken) {
                const option = document.createElement('option');
                option.value = position;
                option.textContent = position;
                positionSelect.appendChild(option);
            }
        });
        
        // If all positions are taken, show a message
        if (positionSelect.options.length === 1) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- All positions filled --';
            option.disabled = true;
            positionSelect.appendChild(option);
            positionSelect.disabled = true;
        } else {
            // Enable the position select
            positionSelect.disabled = false;
        }
    } else {
        // Disable if no positions defined
        positionSelect.disabled = true;
    }
}

// ============ EXISTING UTILITY FUNCTIONS ============
function showMessage(messageArea, message, type) {
    messageArea.textContent = message;
    messageArea.className = `message-area active message-${type}`;
    
    setTimeout(() => {
        messageArea.classList.remove('active');
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        // Handle both ISO format and timestamp
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'N/A';
    }
}

function getCategoryStatus(count, limit) {
    const percentage = (count / limit) * 100;
    if (count >= limit) return { status: 'full', class: 'full', badge: 'Full' };
    if (percentage >= 70) return { status: 'filling', class: 'filling', badge: 'Filling Up' };
    return { status: 'available', class: 'available', badge: 'Available' };
}

function setLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || originalText;
    }
}

// ============ STATS FUNCTIONS (UPDATED) ============
function fetchStats() {
    const categoryCounts = {};
    
    Object.keys(CATEGORY_LIMITS).forEach(category => {
        categoryCounts[category] = 0;
    });
    
    // Handle both response object with .data property and direct array
    const officialsArray = Array.isArray(currentOfficials) ? currentOfficials : (currentOfficials.data || []);
    
    officialsArray.forEach(official => {
        if (categoryCounts.hasOwnProperty(official.category)) {
            categoryCounts[official.category]++;
        }
    });
    
    renderStatsCards(categoryCounts);
}

function renderStatsCards(categoryCounts) {
    elements.statsGrid.innerHTML = '';
    
    Object.entries(CATEGORY_LIMITS).forEach(([category, limit]) => {
        const count = categoryCounts[category] || 0;
        const { status, class: statusClass, badge } = getCategoryStatus(count, limit);
        
        const card = document.createElement('div');
        card.className = `stats-card ${statusClass}`;
        card.innerHTML = `
            <div class="stats-category">${category}</div>
            <div class="stats-count">${count}/${limit}</div>
            <div class="stats-limit">Maximum allowed</div>
            <span class="stats-badge badge-${status}">${badge}</span>
        `;
        
        elements.statsGrid.appendChild(card);
    });
}

// ============ TABLE FUNCTIONS (UPDATED TO SHOW POSITION) ============
function renderTable(officials) {
    elements.officialsTableBody.innerHTML = '';
    
    if (officials.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.officialsTable.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.officialsTableBody.closest('table').style.display = 'table';
    
    officials.data.forEach(official => {
        const row = document.createElement('tr');
        console.log(official.photo);
        
        const photoUrl = official.photo 
            ? `http://localhost:3000/${official.photo}`
            : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect fill="%23e2e8f0" width="48" height="48"/><text fill="%2394a3b8" x="50%" y="50%" text-anchor="middle" dy="0.35em" font-size="20">👤</text></svg>';
        
        console.log(photoUrl);
        
        // NEW: Display position instead of just category
        const displayPosition = official.position || official.category;
        const displayContact = official.contact || '';
        
        row.innerHTML = `
            <td data-label="Photo">
                <img src="${photoUrl}" alt="${official.name}" class="photo-thumbnail">
            </td>
            <td data-label="Name">
                <span class="official-name">${official.name}</span>
            </td>
            <td data-label="Category">
                <span class="category-badge ${official.category.toLowerCase()}">${official.category}</span>
            </td>
            <td data-label="Position">
                <span class="position-text">${displayPosition}</span>
            </td>
            <td data-label="Contact">
                <span class="contact-text">${displayContact}</span>
            </td>
            <td data-label="Date Added">
                <span class="date-text">${formatDate(official.created_at)}</span>
            </td>
            <td data-label="Actions">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" data-official='${JSON.stringify(official)}' onclick="openEditModalFromButton(this)" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon btn-delete" onclick="handleDelete(${official.id}, '${official.name.replace(/'/g, "\\'")}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        elements.officialsTableBody.appendChild(row);
    });
}

function filterOfficials() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const filterCategory = elements.filterCategory.value;
    
    // Handle both response object with .data property and direct array
    const officialsArray = Array.isArray(currentOfficials) ? currentOfficials : (currentOfficials.data || []);
    
    const filtered = officialsArray.filter(official => {
        const matchesSearch = official.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCategory || official.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
    
    renderTable({ data: filtered });
}

// ============ API FUNCTIONS (UPDATED) ============
async function fetchOfficials() {
    elements.loadingIndicator.classList.add('active');
    elements.officialsTableBody.closest('table').style.display = 'none';
    elements.emptyState.style.display = 'none';
    
    try {
        const response = await fetch(API_BASE_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Update the global currentOfficials variable (not a local one)
        currentOfficials = await response.json();
        console.log(currentOfficials);
        
        renderTable(currentOfficials);
        fetchStats();
    } catch (error) {
        console.error('Error fetching officials:', error);
        elements.emptyState.style.display = 'block';
        elements.emptyState.innerHTML = `
            <div class="empty-icon">⚠️</div>
            <p>Error loading officials. Please make sure the server is running.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
        `;
    } finally {
        elements.loadingIndicator.classList.remove('active');
    }
}

// ============ UPDATED: HANDLE ADD WITH POSITION ============
/**
 * Handle adding a new official
 * Now includes position in the submission
 */
async function handleAdd(event) {
    event.preventDefault();
    
    // Get form values including NEW position field
    const name = elements.officialName.value.trim();
    const category = elements.officialCategory.value;
    const position = elements.officialPosition.value;  // NEW
    const contact = elements.officialContact ? elements.officialContact.value.trim() : '';
    const photo = elements.officialPhoto.files[0];
    
    // Validation - UPDATED to include position
    if (!name || !category || !position || !photo) {
        showMessage(elements.addMessageArea, 'Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate phone if provided
    if (contact && !isValidPhone(contact)) {
        showMessage(elements.addMessageArea, 'Please enter a valid phone number.', 'error');
        return;
    }
    
    // Validate file type
    if (photo && !photo.type.startsWith('image/')) {
        showMessage(elements.addMessageArea, 'Please select a valid image file.', 'error');
        return;
    }
    
    // Check category limit before sending request
    const officialsArray = Array.isArray(currentOfficials) ? currentOfficials : (currentOfficials.data || []);
    const categoryCount = officialsArray.filter(o => o.category === category).length;
    if (categoryCount >= CATEGORY_LIMITS[category]) {
        showMessage(elements.addMessageArea, `Cannot add official. ${category} category is full (${categoryCount}/${CATEGORY_LIMITS[category]}).`, 'error');
        return;
    }
    
    // Create FormData - UPDATED to include position and contact
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('position', position);  // NEW
    if (contact) formData.append('contact', contact);
    formData.append('photo', photo);
    
    setLoading(elements.addSubmitBtn, true, 'Add Official');
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        showMessage(elements.addMessageArea, 'Official added successfully!', 'success');
        elements.addOfficialForm.reset();
        
        // Reset position dropdown
        elements.officialPosition.innerHTML = '<option value="">Select category first</option>';
        elements.officialPosition.disabled = true;
        
        await fetchOfficials();
    } catch (error) {
        console.error('Error adding official:', error);
        showMessage(elements.addMessageArea, error.message || 'Error adding official. Please try again.', 'error');
    } finally {
        setLoading(elements.addSubmitBtn, false, 'Add Official');
    }
}

// ============ DELETE FUNCTIONS (UNCHANGED) ============
async function handleDelete(id, name) {
    officialsToDelete = { id, name };
    elements.deleteMessage.textContent = `Are you sure you want to delete ${name}?`;
    elements.deleteModal.classList.add('active');
}

async function confirmDelete() {
    if (!officialsToDelete) return;
    
    const { id } = officialsToDelete;
    
    setLoading(elements.confirmDeleteBtn, true, 'Delete');
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        closeModals();
        showMessage(elements.addMessageArea, 'Official deleted successfully!', 'success');
        await fetchOfficials();
    } catch (error) {
        console.error('Error deleting official:', error);
        showMessage(elements.addMessageArea, error.message || 'Error deleting official. Please try again.', 'error');
    } finally {
        setLoading(elements.confirmDeleteBtn, false, 'Delete');
        officialsToDelete = null;
    }
}

// ============ UPDATED: OPEN EDIT MODAL WITH POSITION ============
/**
 * Wrapper function to open edit modal from button click
 * Retrieves official data from data attribute
 */
function openEditModalFromButton(button) {
    const officialJson = button.getAttribute('data-official');
    openEditModal(officialJson);
}

/**
 * Open the edit modal and populate it with official data
 * Now also populates position dropdown based on category
 */
function openEditModal(officialJson) {
    // Handle both string and object inputs
    const official = typeof officialJson === 'string' ? JSON.parse(officialJson) : officialJson;
    
    elements.editOfficialId.value = official.id;
    elements.editName.value = official.name;
    elements.editCategory.value = official.category;
    elements.editPosition.value = official.position || '';  // NEW
    // Populate contact if present
    if (elements.editContact) elements.editContact.value = official.contact || '';
    
    // NEW: Populate position dropdown for the selected category, excluding current official
    populatePositions(official.category, elements.editPosition, official.id);
    
    // Show current photo
    if (official.photo) {
        elements.currentPhoto.src = `http://localhost:3000/${official.photo}`;
        elements.currentPhoto.style.display = 'block';
        elements.currentPhotoPreview.style.display = 'block';
    } else {
        elements.currentPhoto.style.display = 'none';
        elements.currentPhotoPreview.style.display = 'none';
    }
    
    elements.editMessageArea.classList.remove('active');
    elements.editModal.classList.add('active');
}

// ============ UPDATED: HANDLE EDIT WITH POSITION ============
/**
 * Handle editing an official
 * Now includes position in the submission
 */
async function handleEdit(event) {
    event.preventDefault();
    
    // Get form values including NEW position field
    const id = elements.editOfficialId.value;
    const name = elements.editName.value.trim();
    const category = elements.editCategory.value;
    const position = elements.editPosition.value;  // NEW
    const contact = elements.editContact ? elements.editContact.value.trim() : '';
    const photo = elements.editPhoto.files[0];
    
    // Validation - UPDATED to include position
    if (!name || !category || !position) {
        showMessage(elements.editMessageArea, 'Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate phone if provided
    if (contact && !isValidPhone(contact)) {
        showMessage(elements.editMessageArea, 'Please enter a valid phone number.', 'error');
        return;
    }
    
    // Validate file type if new photo selected
    if (photo && !photo.type.startsWith('image/')) {
        showMessage(elements.editMessageArea, 'Please select a valid image file.', 'error');
        return;
    }
    
    // Create FormData - UPDATED to include position
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('position', position);  // NEW
    if (contact) formData.append('contact', contact);
    if (photo) {
        formData.append('photo', photo);
    }
    
    setLoading(elements.editSubmitBtn, true, 'Save Changes');
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        closeModals();
        showMessage(elements.addMessageArea, 'Official updated successfully!', 'success');
        await fetchOfficials();
    } catch (error) {
        console.error('Error updating official:', error);
        showMessage(elements.editMessageArea, error.message || 'Error updating official. Please try again.', 'error');
    } finally {
        setLoading(elements.editSubmitBtn, false, 'Save Changes');
    }
}

function closeModals() {
    elements.editModal.classList.remove('active');
    elements.deleteModal.classList.remove('active');
    officialsToDelete = null;
}

// ============ UPDATED: EVENT LISTENERS WITH POSITION HANDLERS ============
/**
 * Setup all event listeners for the admin dashboard
 * UPDATED to include category change handlers for position dropdown
 */
function setupEventListeners() {
    // Add form submission
    elements.addOfficialForm.addEventListener('submit', handleAdd);
    
    // Edit form submission
    elements.editOfficialForm.addEventListener('submit', handleEdit);
    
    // Delete confirmation
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Search and filter with debouncing
    const debouncedFilter = debounce(filterOfficials, 300);
    elements.searchInput.addEventListener('input', debouncedFilter);
    elements.filterCategory.addEventListener('change', filterOfficials);
    
    // NEW: Category change handler for Add form - populate positions
    elements.officialCategory.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        // No exclusion needed for new officials
        populatePositions(selectedCategory, elements.officialPosition);
    });
    
    // NEW: Category change handler for Edit modal - populate positions
    elements.editCategory.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        // Exclude current official so their current position is still available
        const currentOfficialId = parseInt(elements.editOfficialId.value);
        populatePositions(selectedCategory, elements.editPosition, currentOfficialId);
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            if (modalId) {
                document.getElementById(modalId).classList.remove('active');
            }
        });
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
    
    // File input change - validate file type
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && !file.type.startsWith('image/')) {
                showMessage(
                    input.closest('.form-group').querySelector('.message-area') || elements.addMessageArea,
                    'Please select a valid image file (JPG, PNG, GIF).',
                    'error'
                );
                input.value = '';
            }
        });
    });
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchOfficials();
});