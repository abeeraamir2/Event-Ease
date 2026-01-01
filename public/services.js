document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".service-card");
  const vendorList = document.getElementById("vendor-list");
  const vendorTitle = document.getElementById("vendor-title");
  const signinBtn = document.getElementById("signinBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;

      cards.forEach(c => c.classList.remove("active-card"));
      card.classList.add("active-card");

      fetchVendors(category);
    });
  });

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

});


