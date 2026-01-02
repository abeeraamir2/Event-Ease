//CHECK LOGIN & GET TOKEN 
const vendor = JSON.parse(localStorage.getItem("vendor"));
const vendorToken = localStorage.getItem("vendorToken"); 

if (!vendor || !vendor.id || !vendorToken) {
    alert("Session expired. Please login again.");
    window.location.href = "/vendor-login.html";
}

const vendorId = vendor.id;

console.log('Vendor logged in:', vendor.name);
console.log('Token exists:', !!vendorToken);

//DOM ELEMENTS
const openPopupBtn = document.getElementById("openPopup");
const closePopupBtn = document.getElementById("closePopup");
const popup = document.getElementById("addServicePopup");
const serviceForm = document.getElementById("serviceForm");
const tableBody = document.querySelector("#servicesTable tbody");
const category = document.getElementById("category");
const bookingsTable = document.getElementById("bookingsTable");

// Category fields containers
const venueFields = document.getElementById("venueFields");
const cateringFields = document.getElementById("cateringFields");
const decorFields = document.getElementById("decorFields");
const photographerFields = document.getElementById("photographerFields");

//POPUP CONTROLS
openPopupBtn.addEventListener("click", () => {
    popup.classList.remove("d-none");
    document.body.style.overflow = "hidden";
    serviceForm.reset();
    hideAllCategoryFields();
});

closePopupBtn.addEventListener("click", () => {
    popup.classList.add("d-none");
    document.body.style.overflow = "auto";
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.classList.add("d-none");
        document.body.style.overflow = "auto";
    }
});

//CATEGORY FIELD TOGGLING
function hideAllCategoryFields() {
    venueFields.style.display = "none";
    cateringFields.style.display = "none";
    decorFields.style.display = "none";
    photographerFields.style.display = "none";
}

hideAllCategoryFields();

category.addEventListener("change", () => {
    hideAllCategoryFields();
    switch (category.value) {
        case "venue":
            venueFields.style.display = "block";
            break;
        case "catering":
            cateringFields.style.display = "block";
            break;
        case "decor":
            decorFields.style.display = "block";
            break;
        case "photographer":
            photographerFields.style.display = "block";
            break;
    }
});

//LOAD SERVICES + BOOKINGS ON PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
    loadServices();
    loadBookings();
});

// ======================= LOAD SERVICES =======================
async function loadServices() {
    try {
        const res = await fetch(
            `/api/services/vendor/${vendorId}`,
            {
                headers: {
                    Authorization: `Bearer ${vendorToken}`
                }
            }
        );

        const services = await res.json();

        if (!res.ok) {
            alert(services.message || "Unauthorized");
            return;
        }

        tableBody.innerHTML = "";

        if (!services.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-3">
                        No services added yet
                    </td>
                </tr>`;
            updateStats(0, 0, 0);
            return;
        }

        services.forEach(addServiceToTable);

        updateStats(
            services.length,
            services.filter(s => s.status === "active").length,
            services.filter(s => s.status === "inactive").length
        );

    } catch (err) {
        console.error(err);
        alert("Failed to load services.");
    }
}

// ======================= UPDATE STATS BOXES =======================
function updateStats(total, active, inactive) {
    document.getElementById("totalServices").textContent = total;
    document.getElementById("activeServices").textContent = active;
    document.getElementById("inactiveServices").textContent = inactive;
}

// ======================= ADD SERVICE TO TABLE =======================
function addServiceToTable(service) {
    const row = document.createElement("tr");
    row.setAttribute("data-id", service._id);
    row.setAttribute("data-service", JSON.stringify(service));

    const price = getPriceDisplay(service);
    const statusClass = service.status === "active" ? "status-active" : "status-inactive";

    row.innerHTML = `
        <td><strong>${service.name}</strong></td>
        <td><span class="badge bg-secondary">${service.category}</span></td>
        <td>${service.location}</td>
        <td>${price}</td>
        <td><span class="status-badge ${statusClass}">${service.status}</span></td>
        <td>
            <button class="btn btn-sm btn-warning edit-btn">Edit</button>
            <button class="btn btn-sm btn-secondary toggle-btn">
                ${service.status === "active" ? "Deactivate" : "Activate"}
            </button>
            <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
    `;

    tableBody.appendChild(row);
}

// ======================= PRICE DISPLAY PER CATEGORY =======================
function getPriceDisplay(service) {
    if (!service.categoryDetails) return "-";
    const d = service.categoryDetails;

    switch (service.category) {
        case "venue":
            return `Rs. ${d.pricePerHead || "N/A"}/head`;
        case "catering":
            return `Rs. ${d.pricePerPerson || "N/A"}/person`;
        case "decor":
            return `Rs. ${d.minPrice || 0} - ${d.maxPrice || 0}`;
        case "photographer":
            return `Rs. ${d.price || "N/A"}`;
        default:
            return "-";
    }
}

// ======================= ADD / EDIT SERVICE SUBMISSION =======================
serviceForm.addEventListener("submit", async e => {
    e.preventDefault();

    const editId = serviceForm.getAttribute("data-edit-id");
    const formData = new FormData(serviceForm);

    const name = formData.get("name");
    const categoryValue = formData.get("category");
    const location = formData.get("location");
    const description = formData.get("description");

    if (!name || !categoryValue || !location) {
        alert("Please fill all required fields (Name, Category, Location).");
        return;
    }

    let categoryDetails = {};

    if (categoryValue === "venue") {
        categoryDetails = {
            venueType: document.getElementById("venueType").value,
            capacity: document.getElementById("venueCapacity").value,
            pricePerHead: document.getElementById("pricePerHead").value,
            amenities: Array.from(document.querySelectorAll(".venueAmenity:checked")).map(e => e.value)
        };
    } else if (categoryValue === "catering") {
        categoryDetails = {
            cuisineType: document.getElementById("cuisineType").value,
            minGuests: document.getElementById("minGuests").value,
            maxGuests: document.getElementById("maxGuests").value,
            starters: document.getElementById("starters").value,
            mainCourse: document.getElementById("mainCourse").value,
            desserts: document.getElementById("desserts").value,
            pricePerPerson: document.getElementById("pricePerPerson").value,
            packagePrice: document.getElementById("packagePrice").value,
            servicesIncluded: Array.from(document.querySelectorAll(".cateringService:checked")).map(e => e.value)
        };
    } else if (categoryValue === "decor") {
        categoryDetails = {
            decorStyle: document.getElementById("decorStyle").value,
            minPrice: document.getElementById("decorMinPrice").value,
            maxPrice: document.getElementById("decorMaxPrice").value,
            eventTypes: Array.from(document.querySelectorAll(".decorEvent:checked")).map(e => e.value),
            includes: document.getElementById("decorIncludes").value
        };
    } else if (categoryValue === "photographer") {
        categoryDetails = {
            experience: document.getElementById("experience").value,
            deliverables: document.getElementById("deliverables").value,
            photoServices: Array.from(document.querySelectorAll(".photoService:checked")).map(e => e.value),
            team: Array.from(document.querySelectorAll(".photoTeam:checked")).map(e => e.value),
            videoOptions: Array.from(document.querySelectorAll(".videoOption:checked")).map(e => e.value),
            price: document.getElementById("photographerPrice").value
        };
    }

    const serviceData = {
        vendorId,
        name,
        category: categoryValue,
        location,
        description,
        categoryDetails
    };

    try {
        let url = "/api/services/add";
        let method = "POST";

        if (editId) {
            url = `/api/services/${editId}`;
            method = "PUT";
        } else {
            serviceData.status = "active";
        }

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${vendorToken}`
            },
            body: JSON.stringify(serviceData)
        });

        const data = await res.json();

        if (res.ok) {
            alert(editId ? "Service updated successfully!" : "Service added successfully!");
            popup.classList.add("d-none");
            document.body.style.overflow = "auto";
            serviceForm.reset();
            serviceForm.removeAttribute("data-edit-id");
            loadServices();
        } else {
            alert(data.message || "Failed to save service");
        }

    } catch (err) {
        console.error("Error saving service:", err);
        alert("Error saving service. Check console for details.");
    }
});

// ======================= TABLE BUTTON FUNCTIONALITY =======================
tableBody.addEventListener("click", async e => {
    const row = e.target.closest("tr");
    if (!row) return;
    const serviceId = row.getAttribute("data-id");

    // EDIT BUTTON
    if (e.target.classList.contains("edit-btn")) {
        popup.classList.remove("d-none");
        const service = JSON.parse(row.getAttribute("data-service"));

        document.getElementById("name").value = service.name;
        document.getElementById("category").value = service.category;
        document.getElementById("location").value = service.location;
        document.getElementById("description").value = service.description || "";

        category.dispatchEvent(new Event("change"));

        const details = service.categoryDetails || {};

        if (service.category === "venue") {
            document.getElementById("venueType").value = details.venueType || "";
            document.getElementById("venueCapacity").value = details.capacity || "";
            document.getElementById("pricePerHead").value = details.pricePerHead || "";
            document.querySelectorAll('.venueAmenity').forEach(cb => {
                cb.checked = details.amenities?.includes(cb.value);
            });
        } else if (service.category === "catering") {
            document.getElementById("cuisineType").value = details.cuisineType || "";
            document.getElementById("minGuests").value = details.minGuests || "";
            document.getElementById("maxGuests").value = details.maxGuests || "";
            document.getElementById("starters").value = details.starters || "";
            document.getElementById("mainCourse").value = details.mainCourse || "";
            document.getElementById("desserts").value = details.desserts || "";
            document.getElementById("pricePerPerson").value = details.pricePerPerson || "";
            document.getElementById("packagePrice").value = details.packagePrice || "";
            document.querySelectorAll('.cateringService').forEach(cb => {
                cb.checked = details.servicesIncluded?.includes(cb.value);
            });
        } else if (service.category === "decor") {
            document.getElementById("decorStyle").value = details.decorStyle || "";
            document.getElementById("decorMinPrice").value = details.minPrice || "";
            document.getElementById("decorMaxPrice").value = details.maxPrice || "";
            document.getElementById("decorIncludes").value = details.includes || "";
            document.querySelectorAll('.decorEvent').forEach(cb => {
                cb.checked = details.eventTypes?.includes(cb.value);
            });
        } else if (service.category === "photographer") {
            document.getElementById("experience").value = details.experience || "";
            document.getElementById("deliverables").value = details.deliverables || "";
            document.getElementById("photographerPrice").value = details.price || "";
            document.querySelectorAll('.photoService').forEach(cb => {
                cb.checked = details.photoServices?.includes(cb.value);
            });
            document.querySelectorAll('.photoTeam').forEach(cb => {
                cb.checked = details.team?.includes(cb.value);
            });
            document.querySelectorAll('.videoOption').forEach(cb => {
                cb.checked = details.videoOptions?.includes(cb.value);
            });
        }

        serviceForm.setAttribute("data-edit-id", serviceId);
    }

    // TOGGLE STATUS BUTTON
    if (e.target.classList.contains("toggle-btn")) {
        const statusSpan = row.querySelector(".status-badge");
        const currentStatus = statusSpan.textContent.trim();
        const newStatus = currentStatus === "active" ? "inactive" : "active";

        try {
            const res = await fetch(
                `/api/services/${serviceId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${vendorToken}`
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            const data = await res.json();

            if (res.status === 200) {
                statusSpan.textContent = newStatus;
                statusSpan.className = `status-badge ${newStatus === "active" ? "status-active" : "status-inactive"}`;
                e.target.textContent = newStatus === "active" ? "Deactivate" : "Activate";
                loadServices();
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    }

    // DELETE BUTTON
    if (e.target.classList.contains("delete-btn")) {
        if (!confirm("Are you sure you want to delete this service?")) return;

        try {
            const res = await fetch(
                `/api/services/${serviceId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${vendorToken}`
                    }
                }
            );

            const data = await res.json();

            if (res.status === 200) {
                alert("Service deleted successfully!");
                loadServices();
            } else {
                alert(data.message || "Failed to delete service");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete service");
        }
    }
});

// ======================= LOAD BOOKINGS (WITH AUTH TOKEN) =======================
async function loadBookings() {
    try {
        console.log('📋 Loading bookings for vendor:', vendorId);
        console.log('🔑 Using token:', vendorToken.substring(0, 20) + '...');

        const res = await fetch(`/api/bookings/vendor/${vendorId}`, {
            headers: {
                'Authorization': `Bearer ${vendorToken}`, // ← IMPORTANT: Include token
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', res.status);

        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ Error response:', errorData);
            throw new Error(errorData.message || "Failed to fetch bookings");
        }

        const bookings = await res.json();
        console.log('✅ Bookings loaded:', bookings.length);

        bookingsTable.innerHTML = "";

        if (!bookings.length) {
            bookingsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">No bookings yet.</td>
                </tr>
            `;
            return;
        }

        bookings.forEach(booking => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.customerName}</td>
                <td>${booking.serviceId?.name || 'N/A'}</td>
                <td>${new Date(booking.eventDate).toLocaleDateString('en-GB')}</td>
                <td>${booking.eventTime || 'N/A'}</td>
                <td class="text-capitalize">${booking.status}</td>
                <td>
                    ${booking.status === 'Pending' ? `
                        <button class="btn btn-sm btn-success me-1" onclick="updateBookingStatus('${booking._id}', 'Accepted')">
                            Accept
                        </button>
                        <button class="btn btn-sm btn-danger me-1" onclick="updateBookingStatus('${booking._id}', 'Rejected')">
                            Reject
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-info view-booking-btn" data-id="${booking._id}">
                        View
                    </button>
                </td>
            `;
            bookingsTable.appendChild(row);
        });

    } catch (err) {
        console.error("❌ Error loading bookings:", err);
        bookingsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    ${err.message || 'Failed to load bookings'}
                </td>
            </tr>
        `;
    }
}

// ======================= VIEW BOOKING DETAILS =======================
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("view-booking-btn")) {
        const bookingId = e.target.getAttribute("data-id");
        await loadBookingDetails(bookingId);
    }
});

async function loadBookingDetails(bookingId) {
    try {
        console.log('🔍 Loading booking details:', bookingId);

        const res = await fetch(`/api/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${vendorToken}`, // ← Include token
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to load booking");
        }

        const booking = await res.json();
        console.log('✅ Booking loaded:', booking);
        showBookingPopup(booking);

    } catch (err) {
        console.error("❌ Error loading booking details:", err);
        alert("Failed to load booking details: " + err.message);
    }
}

// ======================= SHOW BOOKING POPUP =======================
function showBookingPopup(booking) {
    if (!document.getElementById("bookingDetailsPopup")) {
        const popupOverlay = document.createElement("div");
        popupOverlay.id = "bookingDetailsPopup";
        popupOverlay.className = "popup-overlay";
        popupOverlay.innerHTML = `
            <div class="popup-box">
                <button id="closeBookingPopup" class="btn btn-outline-danger btn-sm mb-3">
                    <i class="bi bi-x-lg"></i> Close
                </button>
                <div id="bookingDetailsContent"></div>
            </div>
        `;
        document.body.appendChild(popupOverlay);

        document.getElementById("closeBookingPopup").addEventListener("click", () => {
            popupOverlay.classList.add("d-none");
            document.body.style.overflow = "auto";
        });
    }

    const popup = document.getElementById("bookingDetailsPopup");
    const content = document.getElementById("bookingDetailsContent");

    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let detailsHTML = `
        <h5>Booking Details</h5>
        <hr>
        <p><strong>Customer Name:</strong> ${booking.customerName}</p>
        <p><strong>Contact:</strong> ${booking.contact || 'N/A'}</p>
        <p><strong>Email:</strong> ${booking.email || 'N/A'}</p>
        <p><strong>Service:</strong> ${booking.serviceId?.name || 'N/A'}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
        <p><strong>Event Time:</strong> ${booking.eventTime || 'N/A'}</p>
        <p><strong>Status:</strong> <span class="badge ${getStatusBadge(booking.status)}">${booking.status}</span></p>
        ${booking.details ? `<p><strong>Notes:</strong> ${booking.details}</p>` : ''}
    `;

    if (booking.categoryDetails && Object.keys(booking.categoryDetails).length > 0) {
        const cd = booking.categoryDetails;
        const category = booking.serviceId?.category?.toLowerCase();

        detailsHTML += '<hr><h6>Additional Details:</h6>';

        if (category === 'venue') {
            detailsHTML += `<p><strong>Number of Guests:</strong> ${cd.numberOfGuests || cd.guests || 'N/A'}</p>`;
        } else if (category === 'catering') {
            detailsHTML += `
                <p><strong>Number of Guests:</strong> ${cd.numberOfGuests || cd.guests || 'N/A'}</p>
                <p><strong>Location:</strong> ${cd.location || 'N/A'}</p>
            `;
        } else if (category === 'decor') {
            detailsHTML += `
                <p><strong>Decor Style:</strong> ${cd.decorStyle || 'N/A'}</p>
                <p><strong>Event Type:</strong> ${cd.eventType || 'N/A'}</p>
                <p><strong>Location:</strong> ${cd.location || 'N/A'}</p>
            `;
        }
    }

    if (booking.status === 'Pending') {
        detailsHTML += `
            <div class="mt-3">
                <button class="btn btn-success me-1" onclick="updateBookingStatus('${booking._id}', 'Accepted')">Accept</button>
                <button class="btn btn-danger" onclick="updateBookingStatus('${booking._id}', 'Rejected')">Reject</button>
            </div>
        `;
    }

    content.innerHTML = detailsHTML;
    popup.classList.remove("d-none");
    document.body.style.overflow = "hidden";
}

function getStatusBadge(status) {
    switch(status) {
        case 'Accepted': return 'bg-success';
        case 'Rejected': return 'bg-danger';
        case 'Pending': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}

// ======================= UPDATE BOOKING STATUS (WITH AUTH TOKEN) =======================
async function updateBookingStatus(bookingId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this booking?`)) return;

    try {
        console.log('🔄 Updating booking status:', { bookingId, newStatus });

        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${vendorToken}`, // ← Include token
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`Booking ${newStatus.toLowerCase()} successfully!`);
            const popup = document.getElementById("bookingDetailsPopup");
            if (popup) {
                popup.classList.add("d-none");
                document.body.style.overflow = "auto";
            }
            loadBookings();
        } else {
            alert(data.message || "Failed to update booking status");
        }
    } catch (err) {
        console.error("❌ Error updating booking status:", err);
        alert("Failed to update booking status");
    }
}

// Make function globally accessible
window.updateBookingStatus = updateBookingStatus;

// ======================= LOGOUT =======================
document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("vendor");
        localStorage.removeItem("vendorToken"); // ← Remove token
        window.location.href = "/vendor-login.html";
    }
});