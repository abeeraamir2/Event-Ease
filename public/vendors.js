// ========== GET URL PARAMETERS ==========
const urlParams = new URLSearchParams(window.location.search);
const categoryFromUrl = urlParams.get('category');
const areaFromUrl = urlParams.get('area');
const guestsFromUrl = urlParams.get('guests');

// ========== DOM ELEMENTS ==========
const servicesContainer = document.getElementById('servicesGrid');
const loadingState = document.getElementById('loadingState');
const noResults = document.getElementById('noResults');
const categoryTitle = document.getElementById('categoryTitle');
const categorySubtitle = document.getElementById('categorySubtitle');

// ========== CATEGORY NAMES ==========
const categoryNames = {
    'venue': 'Venues',
    'catering': 'Catering Services',
    'decor': 'Decor Services',
    'photographer': 'Photography Services'
};

// ========== SET PAGE TITLE ==========
if (categoryFromUrl && categoryNames[categoryFromUrl]) {
    categoryTitle.textContent = categoryNames[categoryFromUrl];
    categorySubtitle.textContent = `Browse our ${categoryNames[categoryFromUrl].toLowerCase()}`;
} else {
    categoryTitle.textContent = 'All Services';
    categorySubtitle.textContent = 'Browse all available services';
}

// ========== LOAD SERVICES ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', loadServices);

async function loadServices() {
    try {
        let url = 'http://localhost:5000/api/services';

        console.log('Fetching services from:', url);
        console.log('Filters:', { category: categoryFromUrl, area: areaFromUrl, guests: guestsFromUrl });
        
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        let services = await res.json();
        console.log('Total services received:', services.length);

        services = applyFilters(services);
        console.log('Services after filtering:', services.length);

        // Hide loading
        loadingState.style.display = 'none';

        if (!services || services.length === 0) {
            noResults.style.display = 'block';
            servicesContainer.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            servicesContainer.style.display = 'flex';
            displayServices(services);
        }

    } catch (err) {
        console.error('Error loading services:', err);
        loadingState.style.display = 'none';
        noResults.style.display = 'block';
        servicesContainer.style.display = 'none';
        noResults.querySelector('h3').textContent = 'Error Loading Services';
        noResults.querySelector('p').textContent = 'Please try again later.';
    }
}

// ========== APPLY FILTERS ==========
function applyFilters(services) {
    let filtered = services;

    // Filter by category
    if (categoryFromUrl && categoryFromUrl !== '') {
        filtered = filtered.filter(service => 
            service.category.toLowerCase() === categoryFromUrl.toLowerCase()
        );
        console.log(`🔹 After category filter (${categoryFromUrl}):`, filtered.length);
    }

    // Filter by area/location 
    if (areaFromUrl && areaFromUrl !== '') {
        filtered = filtered.filter(service => {
            // Check service's location field (where the service is actually provided)
            const serviceLocation = (service.location || '').toLowerCase();
            const searchArea = areaFromUrl.toLowerCase();
            return serviceLocation.includes(searchArea);
        });
        console.log(`🔹 After area filter (${areaFromUrl}):`, filtered.length);
        console.log('Matching services:', filtered.map(s => ({ name: s.name, location: s.location })));
    }

    // Filter by guest count (only for venue and catering)
    if (guestsFromUrl && guestsFromUrl !== '') {
        const guestCount = parseInt(guestsFromUrl);
        
        filtered = filtered.filter(service => {
            // Only apply guest filter to venue and catering
            if (service.category !== 'venue' && service.category !== 'catering') {
                return true; // Don't filter other categories by guest count
            }

            const details = service.categoryDetails;
            
            if (!details) return false;

            // For venue - check capacity
            if (service.category === 'venue') {
                const capacity = parseInt(details.capacity) || 0;
                return capacity >= guestCount;
            }
            
            // For catering - check maxGuests
            if (service.category === 'catering') {
                const maxGuests = parseInt(details.maxGuests) || 0;
                return maxGuests >= guestCount;
            }

            return true;
        });
        console.log(`After guest filter (${guestCount}):`, filtered.length);
    }

    return filtered;
} 

// ========== DISPLAY SERVICES ==========
function displayServices(services) {
    servicesContainer.innerHTML = '';

    services.forEach(service => {
        const card = createServiceCard(service);
        servicesContainer.appendChild(card);
    });
}

// ========== CREATE SERVICE CARD ==========
function createServiceCard(service) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const priceDisplay = getPriceDisplay(service);
    const vendorName = service.vendorId?.name || 'Vendor';
    const vendorContact = service.vendorId?.contact || 'N/A';

    // Get capacity for display
    let capacityInfo = '';
    if (service.category === 'venue' && service.categoryDetails?.capacity) {
        capacityInfo = `
            <p class="text-muted mb-2">
                <i class="bi bi-people"></i> Capacity: ${service.categoryDetails.capacity} guests
            </p>
        `;
    } else if (service.category === 'catering' && service.categoryDetails?.maxGuests) {
        capacityInfo = `
            <p class="text-muted mb-2">
                <i class="bi bi-people"></i> Max Guests: ${service.categoryDetails.maxGuests}
            </p>
        `;
    }

    col.innerHTML = `
        <div class="card service-card h-100 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="category-badge text-capitalize">${service.category}</span>
                    <span class="badge bg-success">${service.status}</span>
                </div>
                
                <h5 class="card-title fw-bold mb-2">${service.name}</h5>
                
                <p class="text-muted mb-2">
                    <i class="bi bi-building"></i> ${vendorName}
                </p>
                
                <p class="text-muted mb-2">
                    <i class="bi bi-geo-alt"></i> ${service.location}
                </p>
                
                ${capacityInfo}
                
                <p class="text-muted mb-3">
                    <i class="bi bi-telephone"></i> ${vendorContact}
                </p>
                
                ${service.description ? `
                    <p class="card-text text-muted mb-3" style="font-size: 0.9rem;">
                        ${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}
                    </p>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-center">
                    <span class="price-tag">${priceDisplay}</span>
                    <a href="service-detail.html?id=${service._id}" class="btn btn-primary btn-sm">
                        View Details <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    return col;
}

// ========== GET PRICE DISPLAY ==========
function getPriceDisplay(service) {
    if (!service.categoryDetails) return 'Contact for price';
    
    const details = service.categoryDetails;
    
    if (service.category === 'venue') {
        return details.pricePerHead ? `Rs. ${details.pricePerHead}/head` : 'Contact for price';
    } 
    else if (service.category === 'catering') {
        if (details.pricePerPerson) {
            return `Rs. ${details.pricePerPerson}/person`;
        } else if (details.packagePrice) {
            return `Rs. ${details.packagePrice} (Package)`;
        }
        return 'Contact for price';
    } 
    else if (service.category === 'decor') {
        if (details.minPrice && details.maxPrice) {
            return `Rs. ${details.minPrice} - ${details.maxPrice}`;
        }
        return 'Contact for price';
    } 
    else if (service.category === 'photographer') {
        return details.price ? `Rs. ${details.price}` : 'Contact for price';
    }
    
    return 'Contact for price';
}

  // ===== LOGIN / LOGOUT BUTTON VISIBILITY =====
    const userToken = localStorage.getItem("userToken");

    if (userToken) {
        signinBtn.classList.add("d-none");
        logoutBtn.classList.remove("d-none");
    } else {
        signinBtn.classList.remove("d-none");
        logoutBtn.classList.add("d-none");
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        window.location.reload();
    });