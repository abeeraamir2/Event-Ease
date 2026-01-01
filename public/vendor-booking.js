document.addEventListener("DOMContentLoaded", () => {
    const vendor = JSON.parse(localStorage.getItem("vendor"));
    const vendorToken = localStorage.getItem("vendorToken"); // ← Use this

    if (!vendor || !vendor.id || !vendorToken) {
        alert("Session expired. Please login again.");
        window.location.href = "vendor-login.html";
        return;
    }

    loadBookings(vendor.id, vendorToken);

    // Popup close
    document.getElementById("closePopup").addEventListener("click", () => {
        document.getElementById("bookingPopup").classList.add("d-none");
    });

    document.getElementById("bookingPopup").addEventListener("click", (e) => {
        if (e.target.id === "bookingPopup") {
            e.target.classList.add("d-none");
        }
    });
});

// ================= LOAD BOOKINGS =================
async function loadBookings(vendorId, token) {
    try {
        const res = await fetch(`http://localhost:5000/api/bookings/vendor/${vendorId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error("Failed to fetch bookings");

        const bookings = await res.json();
        const container = document.getElementById("bookingList");
        container.innerHTML = "";

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `<p class="text-center text-muted">No bookings found</p>`;
            return;
        }

        bookings.forEach(b => {
            container.innerHTML += createBookingCard(b);
        });

    } catch (err) {
        console.error(err);
        document.getElementById("bookingList").innerHTML =
            `<p class="text-danger text-center">Error loading bookings.</p>`;
    }
}

// ================= BOOKING CARD =================
function createBookingCard(b) {
    const formatTime = t => {
        if (!t) return "Not specified";
        if (t.includes("T")) return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return t;
    };

    return `
    <div class="col-12 col-md-6 col-lg-4">
        <div class="card shadow-sm h-100">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title fw-bold text-primary">${b.customerName}</h5>
                <p><strong>Service:</strong> ${b.serviceId?.name || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(b.eventDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${formatTime(b.eventTime)}</p>
                <p><strong>Status:</strong>
                    <span class="badge ${getStatusBadge(b.status)}">${b.status}</span>
                </p>

                <div class="mt-auto d-flex gap-2">
                    ${b.status === "Pending" ? `
                        <button class="btn btn-success btn-sm" onclick="updateStatus('${b._id}', 'Accepted')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="updateStatus('${b._id}', 'Rejected')">Reject</button>
                    ` : ""}

                    <button class="btn btn-primary btn-sm ms-auto" onclick="openBookingDetail('${b._id}')">View</button>
                </div>
            </div>
        </div>
    </div>`;
}

// ================= STATUS BADGE =================
function getStatusBadge(status) {
    if (status === "Pending") return "bg-warning text-dark";
    if (status === "Accepted") return "bg-success text-white";
    if (status === "Rejected") return "bg-danger text-white";
    return "bg-secondary";
}

// ================= UPDATE STATUS =================
async function updateStatus(id, status) {
    const vendorToken = localStorage.getItem("vendorToken");
    if (!vendorToken) {
        alert("Session expired. Please login again.");
        window.location.href = "vendor-login.html";
        return;
    }

    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this booking?`)) return;

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/update-status/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${vendorToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        if (!res.ok) throw new Error("Failed");

        alert(`Booking ${status.toLowerCase()} successfully`);
        location.reload();

    } catch (err) {
        console.error(err);
        alert("Network error");
    }
}

// ================= BOOKING DETAILS =================
async function openBookingDetail(id) {
    const vendorToken = localStorage.getItem("vendorToken");
    if (!vendorToken) {
        alert("Session expired. Please login again.");
        window.location.href = "vendor-login.html";
        return;
    }

    const popup = document.getElementById("bookingPopup");
    const content = popup.querySelector(".popup-content");

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
            headers: {
                'Authorization': `Bearer ${vendorToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error("Failed to fetch booking");

        const b = await res.json();

        const formatTime = t => {
            if (!t) return "Not specified";
            if (t.includes("T")) return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return t;
        };

        content.innerHTML = `
            <h4>Booking Details</h4><hr>
            <p><strong>Customer:</strong> ${b.customerName}</p>
            <p><strong>Email:</strong> ${b.email}</p>
            <p><strong>Service:</strong> ${b.serviceId?.name || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(b.eventDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${formatTime(b.eventTime)}</p>
            <p><strong>Status:</strong>
                <span class="badge ${getStatusBadge(b.status)}">${b.status}</span>
            </p>
        `;

        popup.classList.remove("d-none");

    } catch (err) {
        console.error(err);
        alert("Unable to load booking details");
    }
}

// ================= LOGOUT =================
document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Logout?")) {
        localStorage.removeItem("vendor");
        localStorage.removeItem("vendorToken"); // ← Remove token too
        window.location.href = "vendor-login.html";
    }
});
