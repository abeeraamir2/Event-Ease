document.addEventListener("DOMContentLoaded", () => {
    // ===== POPUP & AUTH LOGIC =====
    const signinBtn = document.getElementById("signinBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const overlay = document.getElementById("overlay");
    const rolePopup = document.getElementById("rolePopup");
    const closePopup = document.getElementById("closePopup");
    const vendorBtn = document.getElementById("vendorBtn");
    const customerBtn = document.getElementById("customerBtn");
    const profileBtn = document.getElementById("profileBtn");

    signinBtn.addEventListener("click", () => {
        overlay.style.display = "block";
        rolePopup.classList.add("show");
    });

    function hidePopup() {
        overlay.style.display = "none";
        rolePopup.classList.remove("show");
    }

    closePopup.addEventListener("click", hidePopup);
    overlay.addEventListener("click", hidePopup);

    vendorBtn.addEventListener("click", () => window.location.href = "vendor-login.html");
    customerBtn.addEventListener("click", () => window.location.href = "user-login.html");
    profileBtn.addEventListener("click", () => window.location.href = "profile.html");

    const userToken = localStorage.getItem("userToken");
    if (userToken) {
        signinBtn.classList.add("d-none");
        logoutBtn.classList.remove("d-none");
        profileBtn.classList.remove("d-none");
    } else {
        signinBtn.classList.remove("d-none");
        profileBtn.classList.add("d-none");
        logoutBtn.classList.add("d-none");
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        window.location.reload();
    });

    // ===== GUEST DROPDOWN LOGIC =====
    const serviceSelect = document.getElementById("selectService");
    const guestContainer = document.getElementById("guestContainer");

    function updateGuestVisibility() {
        if (serviceSelect.value === "venue" || serviceSelect.value === "catering") {
            guestContainer.classList.remove("d-none");
            guestContainer.setAttribute("aria-hidden", "false");
        } else {
            guestContainer.classList.add("d-none");
            guestContainer.setAttribute("aria-hidden", "true");
            document.getElementById("guestCountSelect").value = "";
        }
    }

    serviceSelect.addEventListener("change", updateGuestVisibility);
    updateGuestVisibility();

    // ===== SEARCH FORM LOGIC =====
    const searchForm = document.querySelector(".hero-search-pill");
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const category = serviceSelect.value;
        const area = document.getElementById("selectArea").value;
        const guests = document.getElementById("guestCountSelect").value;

        if (!category) { alert("Please select a service category"); return; }
        if (!area) { alert("Please select an area"); return; }
        if ((category === "venue" || category === "catering") && !guests) {
            alert("Please select guest count for " + category); return;
        }

        let url = `vendors.html?category=${encodeURIComponent(category)}&area=${encodeURIComponent(area)}`;
        if (guests) url += `&guests=${encodeURIComponent(guests)}`;
        url += "&alpha=0.5";
        window.location.href = url;
    });

    // ===== FETCH VENDORS FROM HYBRID SEARCH API =====
    const vendorsContainer = document.getElementById("vendorsContainer");

    async function loadVendors() {
    try {
        const params = new URLSearchParams(window.location.search);

        const category = (params.get("category") || "").trim().toLowerCase();
        const area = (params.get("area") || "").trim().toLowerCase();
        const guests = params.get("guests");
        const alpha = params.get("alpha") || "0.5";

        console.log("Filters:", { category, area, guests, alpha });

        let url;

        //If no search filters, fetch "all vendors" for home page top vendors
        if (!category && !area && !guests) {
            url = `/api/vendor`;
        } else {
            // Otherwise, build hybrid search URL (search page)
            url = `/api/search?alpha=${encodeURIComponent(alpha)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (area) url += `&location=${encodeURIComponent(area)}`;
            if (guests) {
                const minGuests = parseInt(guests);
                if (!isNaN(minGuests)) url += `&guestCount=${minGuests}`;
            }
        }

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error("Failed to fetch vendors");

        let vendors = await res.json();
        console.log("Vendors received:", vendors);

        // ===== FRONTEND FILTERING (optional fallback) =====
      /*  if (category || area || guests) {
            let minGuests = 0;
            if (guests) {
                const parsed = parseInt(guests);
                if (!isNaN(parsed)) minGuests = parsed;
            }

            vendors = vendors.filter(v => {
                let passes = true;

                if (category && v.category) {
                    passes = passes && v.category.toString().trim().toLowerCase() === category;
                }
                if (area && v.location) {
                    passes = passes && v.location.toString().trim().toLowerCase().includes(area);
                }
                if (minGuests > 0) {
                    const availableGuests = v.maxGuests || v.categoryDetails?.maxGuests || 0;
                    if (availableGuests) passes = passes && availableGuests >= minGuests;
                }
                return passes;
            });

            console.log("Vendors after frontend filtering:", vendors);
        } */

        // ===== RENDER VENDORS =====
        if (!vendors.length) {
            vendorsContainer.innerHTML = `
                <p class="text-center text-muted">
                    No vendors found for your search
                </p>`;
            return;
        }

        vendorsContainer.innerHTML = "";
        vendors.forEach(vendor => {
            vendorsContainer.innerHTML += `
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="vendor-card p-4 rounded-3 shadow-sm bg-white">
                        <h5 class="vendor-name fw-semibold">${vendor.name}</h5>
                        <p class="vendor-email text-muted mb-1">${vendor.email || "-"}</p>
                        <p class="vendor-contact text-muted mb-1">${vendor.contact || "-"}</p>
                        <p class="vendor-location text-muted mb-0">${vendor.location || "N/A"}</p>
                    </div>
                </div>`;
        });

    } catch (err) {
        console.error(" Vendors fetch error:", err);
        vendorsContainer.innerHTML = `
            <p class="text-center text-danger">
                Failed to load vendors
            </p>`;
    }

}
loadVendors();
});
