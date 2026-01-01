// Get service ID from URL
const urlParams = new URLSearchParams(window.location.search);
const serviceId = urlParams.get('id');

const loadingState = document.getElementById('loadingState');
const serviceDetail = document.getElementById('serviceDetail');

let bookingModal, bookNowBtn, bookingForm;
let loadedService = null;

// Load service details on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadServiceDetail();
});

async function loadServiceDetail() {
    if (!serviceId) {
        showError('Service ID not provided');
        return;
    }

    try {
        console.log('Fetching service:', serviceId);

        const res = await fetch(`/api/services/${serviceId}`);
        if (!res.ok) throw new Error('Service not found');

        const service = await res.json();
        console.log('Service loaded:', service);
        loadedService = service;

        loadingState.style.display = 'none';
        serviceDetail.style.display = 'block';

        displayServiceDetail(service);
        initBookingModal();

    } catch (err) {
        console.error('Error:', err);
        showError('Service not found or failed to load');
    }
}

function displayServiceDetail(service) {
    const vendor = service.vendorId || {};
    const categorySpecificHTML = getCategorySpecificHTML(service);
    const priceDisplay = getPriceDisplay(service);

    serviceDetail.innerHTML = `

        <div class="row">
            <div class="col-lg-8">
                <div class="detail-card">
                    <span class="category-badge mb-3 d-inline-block">${service.category}</span>
                    <h1 class="mb-3">${service.name}</h1>
                    <div class="d-flex gap-4 mb-4 text-muted">
                        <span><i class="bi bi-building"></i> ${vendor.name || 'Vendor'}</span>
                        <span><i class="bi bi-geo-alt"></i> ${service.location}</span>
                    </div>
                    ${service.description ? `
                        <div class="mb-4">
                            <h5 class="fw-bold mb-3">About This Service</h5>
                            <p class="text-muted">${service.description}</p>
                        </div>
                    ` : ''}
                    ${categorySpecificHTML}
                </div>
            </div>

            <div class="col-lg-4">
                <div class="price-box mb-4">
                    <h4 class="mb-3">Pricing</h4>
                    <h2 class="fw-bold mb-4">${priceDisplay}</h2>
                    <button id="bookNowBtn" class="btn btn-warning btn-lg w-100">
                        <i class="bi bi-calendar-check"></i> Book Now
                    </button>
                </div>

                <div class="detail-card">
                    <h5 class="fw-bold mb-3">Vendor Information</h5>
                    <div class="info-row">
                        <div class="info-label">Company Name</div>
                        <div class="info-value">${vendor.name || 'N/A'}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email</div>
                        <div class="info-value">
                            <a href="mailto:${vendor.email || ''}">${vendor.email}</a>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Phone</div>
                        <div class="info-value">
                            <a href="tel:${vendor.contact || ''}">${vendor.contact || 'N/A'}</a>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Location</div>
                        <div class="info-value">${vendor.location || service.location}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Booking Modal with Dynamic Fields -->
        <div class="modal fade" id="bookingModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <form id="bookingForm">
                <div class="modal-header">
                  <h5 class="modal-title">Book ${service.category} Service</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  
                  <!-- Common Fields (All Categories) -->
                  <div class="mb-3">
                    <label>Customer Name *</label>
                    <input type="text" class="form-control" name="customerName" required>
                  </div>
                  
                  <div class="mb-3">
                    <label>Contact Number *</label>
                    <input type="text" class="form-control" name="contact" placeholder="03001234567" required>
                  </div>
                  
                  <div class="mb-3">
                    <label>Email *</label>
                    <input type="email" class="form-control" name="email" required>
                  </div>
                  
                  <div class="mb-3">
                    <label>Event Date *</label>
                    <input type="date" class="form-control" name="eventDate" required>
                  </div>
                  
                  <div class="mb-3">
                    <label>Event Time *</label>
                    <select class="form-select" name="eventTime" required>
                      <option value="">Select time</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  
                  <!-- Category-Specific Fields -->
                  ${getCategorySpecificFormFields(service.category)}
                  
                  <div class="mb-3">
                    <label>Additional Details</label>
                    <textarea class="form-control" name="details" rows="3" placeholder="Any special requests or requirements..."></textarea>
                  </div>
                  
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary">Submit Booking</button>
                </div>
              </form>
            </div>
          </div>
        </div>
    `;
}

// ========== GET CATEGORY-SPECIFIC FORM FIELDS ==========
function getCategorySpecificFormFields(category) {
    let html = '';
    
    if (category === 'venue') {
        html = `
            <!-- Venue-Specific: Number of Guests -->
            <div class="mb-3">
                <label>Number of Guests *</label>
                <input type="number" class="form-control" name="numberOfGuests" min="1" placeholder="e.g., 200" required>
            </div>
        `;
    }
    else if (category === 'catering') {
        html = `
            <!-- Catering-Specific: Number of Guests & Location -->
            <div class="mb-3">
                <label>Number of Guests *</label>
                <input type="number" class="form-control" name="numberOfGuests" min="1" placeholder="e.g., 150" required>
            </div>
            
            <div class="mb-3">
                <label>Event Location *</label>
                <input type="text" class="form-control" name="location" placeholder="e.g., DHA Phase 5, Lahore" required>
            </div>
        `;
    }
    else if (category === 'decor') {
        html = `
            <!-- Decor-Specific: Event Type & Decor Style -->
            <div class="mb-3">
                <label>Event Type *</label>
                <select class="form-select" name="eventType" required>
                    <option value="">Select event type</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Bridal Shower">Bridal Shower</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Nikkah">Nikkah</option>
                    <option value="Mehndi">Mehndi</option>
                    <option value="Barat">Barat</option>
                    <option value="Walima">Walima</option>
                    <option value="Dholki">Dholki</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label>Preferred Decor Style</label>
                <select class="form-select" name="decorStyle">
                    <option value="">Select style (Optional)</option>
                    <option value="Modern">Modern</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Floral">Floral</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Rustic">Rustic</option>
                </select>
            </div>

            <div class="mb-3">
                <label>Location *</label>
                <input type="text" class="form-control" name="location" required>
            </div>
        `;
    }
    else if (category === 'photographer') {
        html = `
            <!-- Photographer: Only Common Fields (no additional fields) -->
        `;
    }
    
    return html;
}

function initBookingModal() {
    bookNowBtn = document.getElementById('bookNowBtn');
    bookingForm = document.getElementById('bookingForm');
    bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));

    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const userToken = localStorage.getItem("userToken");
            if (!userToken) {
                window.location.href = "/user-login.html";
                return;
            }

            bookingModal.show();
        });
    }
}

// ====== BOOKING FORM SUBMIT HANDLER ======
document.addEventListener("submit", async (e) => {
    if (e.target.id !== "bookingForm") return;
    e.preventDefault();

    const form = e.target;

    // ====== GET USER INFO ======
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("userToken");

    if (!user || !token) {
        alert("Please log in first to make a booking.");
        window.location.href = "/user-login.html";
        return;
    }

    const userId = user._id;

    // ====== COMMON BOOKING FIELDS ======
    const bookingData = {
        userId,
        serviceId,
        vendorId: loadedService.vendorId?._id,
        customerName: form.customerName.value.trim(),
        contact: form.contact.value.trim(),
        email: form.email.value.trim(),
        eventDate: form.eventDate.value,
        eventTime: form.eventTime.value,
        details: form.details.value.trim(),
        category: loadedService.category,
        categoryDetails: {}
    };

    // ====== CATEGORY SPECIFIC FIELDS ======
    const category = loadedService.category;

    if (category === "venue") {
        bookingData.categoryDetails = {
            numberOfGuests: form.numberOfGuests.value
        };
    } else if (category === "catering") {
        bookingData.categoryDetails = {
            numberOfGuests: form.numberOfGuests.value,
            location: form.location.value
        };
    } else if (category === "decor") {
        bookingData.categoryDetails = {
            eventType: form.eventType.value,
            decorStyle: form.decorStyle?.value || null,
            location: form.location.value
        };
    } else if (category === "photography") {
        bookingData.categoryDetails = {};
    }

    console.log("Sending booking:", bookingData);

    // ====== SEND TO BACKEND ======
    try {
        const res = await fetch("/api/bookings/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });

        const data = await res.json();
        console.log("Booking Response:", data);

        if (!res.ok) {
            alert("Booking failed: " + data.message);
            return;
        }

        alert("Booking submitted successfully!");
        bootstrap.Modal.getInstance(document.getElementById("bookingModal")).hide();
        form.reset();

    } catch (err) {
        console.error("Booking error:", err);
        alert("Booking failed: Network or server error.");
    }
});



// ========== GET CATEGORY DETAILS HTML (for display) ==========
function getCategorySpecificHTML(service) {
    const details = service.categoryDetails || {};
    let html = '<div class="mb-4"><h5 class="fw-bold mb-3">Service Details</h5>';

    if (service.category === 'venue') {
        html += `
            <div class="row">
                <div class="col-md-6 info-row">
                    <div class="info-label">Venue Type</div>
                    <div class="info-value">${details.venueType || 'N/A'}</div>
                </div>
                <div class="col-md-6 info-row">
                    <div class="info-label">Capacity</div>
                    <div class="info-value">${details.capacity || 'N/A'} guests</div>
                </div>
                <div class="col-md-6 info-row">
                    <div class="info-label">Price per Head</div>
                    <div class="info-value">Rs. ${details.pricePerHead || 'N/A'}</div>
                </div>
                ${details.amenities && details.amenities.length ? `
                    <div class="col-12 info-row">
                        <div class="info-label">Amenities</div>
                        <div class="info-value">
                            ${details.amenities.map(a => `<span class="badge-item">${a}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    else if (service.category === 'catering') {
        html += `
            <div class="info-row">
                <div class="info-label">Cuisine Type</div>
                <div class="info-value">${details.cuisineType || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Guest Capacity</div>
                <div class="info-value">${details.minGuests || 'N/A'} - ${details.maxGuests || 'N/A'} guests</div>
            </div>
            ${details.pricePerPerson ? `
                <div class="info-row">
                    <div class="info-label">Price per Person</div>
                    <div class="info-value">Rs. ${details.pricePerPerson}</div>
                </div>
            ` : ''}
            ${details.starters ? `
                <div class="info-row">
                    <div class="info-label">Starters</div>
                    <div class="info-value">${details.starters}</div>
                </div>
            ` : ''}
            ${details.mainCourse ? `
                <div class="info-row">
                    <div class="info-label">Main Course</div>
                    <div class="info-value">${details.mainCourse}</div>
                </div>
            ` : ''}
            ${details.desserts ? `
                <div class="info-row">
                    <div class="info-label">Desserts</div>
                    <div class="info-value">${details.desserts}</div>
                </div>
            ` : ''}
        `;
    }
    else if (service.category === 'decor') {
        html += `
            <div class="info-row">
                <div class="info-label">Decor Style</div>
                <div class="info-value">${details.decorStyle || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Price Range</div>
                <div class="info-value">Rs. ${details.minPrice || 'N/A'} - Rs. ${details.maxPrice || 'N/A'}</div>
            </div>
            ${details.eventTypes && details.eventTypes.length ? `
                <div class="info-row">
                    <div class="info-label">Event Types</div>
                    <div class="info-value">
                        ${details.eventTypes.map(e => `<span class="badge-item">${e}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            ${details.includes ? `
                <div class="info-row">
                    <div class="info-label">What's Included</div>
                    <div class="info-value">${details.includes}</div>
                </div>
            ` : ''}
        `;
    }
    else if (service.category === 'photographer') {
        html += `
            ${details.experience ? `
                <div class="info-row">
                    <div class="info-label">Experience</div>
                    <div class="info-value">${details.experience} years</div>
                </div>
            ` : ''}
            <div class="info-row">
                <div class="info-label">Deliverables</div>
                <div class="info-value">${details.deliverables || 'N/A'}</div>
            </div>
            ${details.photoServices && details.photoServices.length ? `
                <div class="info-row">
                    <div class="info-label">Photography Services</div>
                    <div class="info-value">
                        ${details.photoServices.map(s => `<span class="badge-item">${s}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    html += '</div>';
    return html;
}

// ========== GET PRICE DISPLAY ==========
function getPriceDisplay(service) {
    const details = service.categoryDetails || {};
    
    if (service.category === 'venue') {
        return details.pricePerHead ? `Rs. ${details.pricePerHead}/head` : 'Contact for price';
    } 
    else if (service.category === 'catering') {
        if (details.pricePerPerson) return `Rs. ${details.pricePerPerson}/person`;
        if (details.packagePrice) return `Rs. ${details.packagePrice}`;
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

function showError(message) {
    loadingState.innerHTML = `
        <div class="alert alert-danger">
            <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
            <p>${message}</p>
            <a href="services.html" class="btn btn-primary mt-3">Back to Services</a>
        </div>
    `;
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