// ================== DEBUG & AUTH CHECK ==================
console.log('🔍 Starting profile.js');
console.log('📦 LocalStorage contents:');
console.log('- userToken:', localStorage.getItem("userToken"));
console.log('- user:', localStorage.getItem("user"));
console.log('- userId:', localStorage.getItem("userId"));

const token = localStorage.getItem("userToken");
const storedUser = localStorage.getItem("user");
const signinBtn = document.getElementById("signinBtn");
const logoutBtn = document.getElementById("logoutBtn");
if (!token) {
  console.error('❌ No token found in localStorage');
  alert("Please login first");
  window.location.href = "user-login.html";
}

console.log('✅ Token exists, length:', token ? token.length : 0);

// Parse stored user if exists
let userFromStorage = null;
if (storedUser) {
  try {
    userFromStorage = JSON.parse(storedUser);
    console.log('👤 Stored user:', userFromStorage);
  } catch (e) {
    console.error('❌ Failed to parse stored user:', e);
  }
}

// ================== FETCH USER PROFILE ==================
async function loadProfile() {
  try {
    console.log('🔄 Fetching profile from API...');
    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    const res = await fetch("/api/user/profile", {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log('📡 Profile API response status:', res.status);
    console.log('📡 Response headers:', res.headers);

    // Try to get response body even on error
    let responseData;
    try {
      responseData = await res.json();
      console.log('📦 Response data:', responseData);
    } catch (jsonErr) {
      console.error('❌ Failed to parse response JSON:', jsonErr);
      const textResponse = await res.text();
      console.log('📝 Response as text:', textResponse);
      throw new Error('Invalid response from server');
    }

    if (!res.ok) {
      console.error('❌ API returned error:', responseData);
      if (res.status === 401) {
        throw new Error("Session expired - Invalid token");
      }
      throw new Error(responseData.message || "Failed to fetch profile");
    }

    const userData = responseData;
    console.log('✅ Profile loaded successfully:', userData);

    // Display profile
    document.getElementById("name").textContent = userData.name || "User";
    document.getElementById("email").textContent = userData.email || "-";
    document.getElementById("contact").textContent = userData.contact || "-";
    document.getElementById("city").textContent = userData.city || "-";

    // Pre-fill edit fields
    document.getElementById("editName").value = userData.name || "";
    document.getElementById("editEmail").value = userData.email || "";
    document.getElementById("editContact").value = userData.contact || "";
    document.getElementById("editCity").value = userData.city || "";

    // Store user ID for bookings
    const userId = userData._id;
    console.log('👤 User ID for bookings:', userId);
    
    // Load bookings
    await loadBookings(userId);

  } catch (err) {
    console.error("❌ Profile error details:", err);
    console.error("❌ Error stack:", err.stack);
    alert(`Session expired: ${err.message}\n\nPlease login again.`);
    
    // Clear storage and redirect
    console.log('🗑️ Clearing localStorage...');
    localStorage.clear();
    
    setTimeout(() => {
      window.location.href = "user-login.html";
    }, 1000);
  }
}

// ================== UPDATE PROFILE ==================
document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById("editForm");
  
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Prevent form submission
      
      console.log('💾 Updating profile...');
      
      const updatedData = {
        name: document.getElementById("editName").value.trim(),
        email: document.getElementById("editEmail").value.trim(),
        contact: document.getElementById("editContact").value.trim(),
        city: document.getElementById("editCity").value.trim()
      };

      console.log('📤 Update data:', updatedData);

      if (!updatedData.name) {
        alert("Name is required");
        return;
      }

      if (!updatedData.email) {
        alert("Email is required");
        return;
      }

      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        console.log('📡 Update response status:', res.status);

        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ Update error:', errorData);
          throw new Error(errorData.message || "Update failed");
        }
        
        const data = await res.json();
        console.log('✅ Profile updated:', data);
        
        alert("✅ Profile updated successfully");
        
        // Close modal
        const modalEl = document.getElementById('editModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
        
        // Reload profile
        await loadProfile();

      } catch (err) {
        console.error("❌ Update error:", err);
        alert("Failed to update profile: " + err.message);
      }
    });
  }
});

// ================== FETCH BOOKING HISTORY ==================
async function loadBookings(userId) {
  try {
    console.log('📋 Loading bookings for user:', userId);

    const res = await fetch(`/api/bookings/user/${userId}`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log('📡 Bookings response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Bookings error:', errorData);
      throw new Error(errorData.message || "Failed to fetch bookings");
    }

    const data = await res.json();
    console.log('✅ Bookings loaded:', data);

    const table = document.getElementById("bookingTable");
    table.innerHTML = "";

    // Handle different response structures
    const bookings = data.bookings || data;

    if (!bookings || bookings.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-3">
            No bookings found
          </td>
        </tr>
      `;
      return;
    }

    bookings.forEach(b => {
      const statusClass = 
        b.status === "Accepted" || b.status === "approved" ? "bg-success" :
        b.status === "Pending" || b.status === "pending" ? "bg-warning text-dark" :
        "bg-danger";

      table.innerHTML += `
        <tr>
          <td>${b.serviceId?.name || "N/A"}</td>
          <td>${new Date(b.eventDate).toLocaleDateString('en-GB')}</td>
          <td>${b.eventTime || "N/A"}</td>
          <td>
            <span class="badge ${statusClass}">
              ${b.status}
            </span>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("❌ Booking error:", err);
    const table = document.getElementById("bookingTable");
    table.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-3">
          Failed to load bookings
        </td>
      </tr>
    `;
  }
}
// ===== LOGIN / LOGOUT BUTTON VISIBILITY =====
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


// ================== LOGOUT BUTTON (if exists) ==================
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      console.log('👋 Logging out...');
      localStorage.clear();
      window.location.href = "user-login.html";
    }
  });
}


// ================== LOAD ON PAGE LOAD ==================
console.log('⏳ Waiting for DOM to load...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM loaded, starting profile load...');
  loadProfile();
  
  // Setup edit form listener
  const editForm = document.getElementById("editForm");
  
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Prevent form submission
      
      console.log('💾 Updating profile...');
      
      const updatedData = {
        name: document.getElementById("editName").value.trim(),
        email: document.getElementById("editEmail").value.trim(),
        contact: document.getElementById("editContact").value.trim(),
        city: document.getElementById("editCity").value.trim()
      };

      console.log('📤 Update data:', updatedData);

      if (!updatedData.name) {
        alert("Name is required");
        return;
      }

      if (!updatedData.email) {
        alert("Email is required");
        return;
      }

      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        console.log('📡 Update response status:', res.status);

        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ Update error:', errorData);
          throw new Error(errorData.message || "Update failed");
        }
        
        const data = await res.json();
        console.log('✅ Profile updated:', data);
        
        alert("✅ Profile updated successfully");
        
        // Close modal
        const modalEl = document.getElementById('editModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
        
        // Reload profile
        await loadProfile();

      } catch (err) {
        console.error("❌ Update error:", err);
        alert("Failed to update profile: " + err.message);
      }
    });
  }
});