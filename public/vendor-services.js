document.addEventListener('DOMContentLoaded', () => {
  // --- config + DOM refs ---
  const vendor = JSON.parse(localStorage.getItem('vendor'));
  const vendorToken = localStorage.getItem('vendorToken');

  if (!vendor || !vendor.id || !vendorToken) {
    alert('Session expired. Please login again.');
    window.location.href = 'vendor-login.html';
    return;
  }
  const vendorId = vendor.id;

  const container = document.getElementById('serviceCardsContainer');
  const btnAdd = document.getElementById('openPopup');
  const logoutBtn = document.getElementById('logoutBtn');

  // Modal elements
  const serviceModalEl = document.getElementById('serviceModal');
  const serviceModal = new bootstrap.Modal(serviceModalEl);
  const serviceForm = document.getElementById('serviceForm');
  const serviceModalTitle = document.getElementById('serviceModalTitle');

  // Details modal
  const serviceDetailsBody = document.getElementById('serviceDetailsBody');
  const serviceDetailsModal = new bootstrap.Modal(document.getElementById('serviceDetailsModal'));

  // category fields
  const s_category = document.getElementById('s_category');
  const fieldsVenue = document.getElementById('fieldsVenue');
  const fieldsCatering = document.getElementById('fieldsCatering');
  const fieldsDecor = document.getElementById('fieldsDecor');
  const fieldsPhotographer = document.getElementById('fieldsPhotographer');

  // ------------------ Helpers ------------------
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function hideAllCategoryGroups() {
    [fieldsVenue, fieldsCatering, fieldsDecor, fieldsPhotographer].forEach(el => el.classList.add('d-none'));
  }

  function showGroupForCategory(cat) {
    hideAllCategoryGroups();
    if (cat === 'venue') fieldsVenue.classList.remove('d-none');
    else if (cat === 'catering') fieldsCatering.classList.remove('d-none');
    else if (cat === 'decor') fieldsDecor.classList.remove('d-none');
    else if (cat === 'photographer') fieldsPhotographer.classList.remove('d-none');
  }

  s_category.addEventListener('change', () => showGroupForCategory(s_category.value));

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('vendor');
    localStorage.removeItem('vendorToken');
    window.location.href = 'vendor-login.html';
  });

  async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${vendorToken}`;
    return fetch(url, options);
  }

  // ------------------ Load Services ------------------
  async function loadServices() {
    try {
      container.innerHTML = '';
      const res = await authFetch(`/api/services/vendor/${vendorId}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const services = await res.json();
      if (!services || services.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No services found</div>';
        return;
      }
      services.forEach(s => container.insertAdjacentHTML('beforeend', createServiceCard(s)));
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="text-center text-danger">Failed to load services.</div>`;
    }
  }

  function createServiceCard(s) {
    const shortDesc = s.description ? (s.description.length > 100 ? s.description.slice(0, 100) + '...' : s.description) : 'No description';
    const statusBadge = s.status === 'active' ? 'bg-success text-white' : 'bg-secondary text-white';

    let priceLine = '';
    if (s.category === 'venue' && s.categoryDetails?.pricePerHead) priceLine = `Rs. ${s.categoryDetails.pricePerHead}/head`;
    else if (s.category === 'catering' && s.categoryDetails?.pricePerPerson) priceLine = `Rs. ${s.categoryDetails.pricePerPerson}/person`;
    else if (s.category === 'decor' && s.categoryDetails?.minPrice) priceLine = `Rs. ${s.categoryDetails.minPrice || 0} - ${s.categoryDetails.maxPrice || 0}`;
    else if (s.category === 'photographer' && s.categoryDetails?.price) priceLine = `Rs. ${s.categoryDetails.price}`;

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card service-card shadow-sm h-100 p-3">
          <div class="d-flex justify-content-between align-items-start">
            <span class="badge badge-status ${statusBadge}">${s.status}</span>
            <small class="text-muted text-capitalize">${s.category}</small>
          </div>
          <h5 class="mt-2">${escapeHtml(s.name)}</h5>
          <p class="text-muted mb-1">${escapeHtml(s.location)}</p>
          <p class="short-desc">${escapeHtml(shortDesc)}</p>
          ${priceLine ? `<p class="mb-2"><strong>${priceLine}</strong></p>` : ''}
          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-primary btn-sm" onclick="openServiceDetails('${s._id}')"><i class="bi bi-eye"></i> View</button>
            <button class="btn btn-warning btn-sm" onclick="editService('${s._id}')"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-danger btn-sm ms-auto" onclick="deleteService('${s._id}')"><i class="bi bi-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }

// ------------------ Add/Edit Service ------------------
btnAdd.addEventListener('click', () => {
    serviceForm.reset();
    hideAllCategoryGroups();
    serviceModalTitle.textContent = 'Add New Service';
    document.getElementById('editServiceId').value = '';
    serviceModal.show();
});

serviceForm.addEventListener('submit', async e => {
    e.preventDefault();
    const editId = document.getElementById('editServiceId').value || null;

    const name = document.getElementById('s_name').value.trim();
    const categoryValue = document.getElementById('s_category').value;
    const location = document.getElementById('s_location').value.trim();
    const description = document.getElementById('s_description').value.trim();
    const status = document.getElementById('s_status').value;

    if (!name || !categoryValue || !location) {
        alert('Please fill all required fields (Name, Category, Location).');
        return;
    }

    // Build category-specific details
    let categoryDetails = {};

    if (categoryValue === "venue") {
        categoryDetails = {
            venueType: document.getElementById("v_venueType").value,
            capacity: parseInt(document.getElementById("v_capacity").value) || 0,
            pricePerHead: parseFloat(document.getElementById("v_pricePerHead").value) || 0,
            amenities: Array.from(document.querySelectorAll(".v_amenity:checked")).map(e => e.value)
        };
    } else if (categoryValue === "catering") {
        categoryDetails = {
            cuisineType: document.getElementById("c_cuisineType").value,
            minGuests: parseInt(document.getElementById("c_minGuests").value) || 0,
            maxGuests: parseInt(document.getElementById("c_maxGuests").value) || 0,
            starters: document.getElementById("c_starters").value,
            mainCourse: document.getElementById("c_mainCourse").value,
            desserts: document.getElementById("c_desserts").value,
            pricePerPerson: parseFloat(document.getElementById("c_pricePerPerson").value) || 0,
            packagePrice: parseFloat(document.getElementById("c_packagePrice").value) || 0,
            servicesIncluded: Array.from(document.querySelectorAll(".c_service:checked")).map(e => e.value)
        };
    } else if (categoryValue === "decor") {
        categoryDetails = {
            decorStyle: document.getElementById("d_decorStyle").value,
            minPrice: parseFloat(document.getElementById("d_minPrice").value) || 0,
            maxPrice: parseFloat(document.getElementById("d_maxPrice").value) || 0,
            eventTypes: Array.from(document.querySelectorAll(".d_event:checked")).map(e => e.value),
            includes: document.getElementById("d_includes").value
        };
    } else if (categoryValue === "photographer") {
        categoryDetails = {
            experience: parseInt(document.getElementById("p_experience").value) || 0,
            deliverables: document.getElementById("p_deliverables").value,
            photoServices: Array.from(document.querySelectorAll(".p_service:checked")).map(e => e.value),
            team: Array.from(document.querySelectorAll(".p_team:checked")).map(e => e.value),
            videoOptions: Array.from(document.querySelectorAll(".p_video:checked")).map(e => e.value),
            price: parseFloat(document.getElementById("p_price").value) || 0
        };
    }

    const serviceData = {
        vendorId,
        name,
        category: categoryValue,
        location,
        description,
        status,
        categoryDetails
    };

    try {
        const url = editId ? `/api/services/${editId}` : `/api/services/add`;
        const method = editId ? 'PUT' : 'POST';
        const res = await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serviceData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save service');

        serviceModal.hide();
        serviceForm.reset();
        document.getElementById('editServiceId').value = '';
        hideAllCategoryGroups();
        await loadServices();
        alert(editId ? 'Service updated!' : 'Service added!');
    } catch (err) {
        console.error(err);
        alert('Error saving service: ' + (err.message || err));
    }
});

// ------------------ Edit Service ------------------
window.editService = async function(id) {
    try {
        const res = await authFetch(`/api/services/${id}`);
        if (!res.ok) throw new Error('Failed to fetch service');
        const s = await res.json();

        document.getElementById('editServiceId').value = s._id;
        serviceModalTitle.textContent = 'Edit Service';
        document.getElementById('s_name').value = s.name || '';
        document.getElementById('s_category').value = s.category || '';
        showGroupForCategory(s.category);
        document.getElementById('s_location').value = s.location || '';
        document.getElementById('s_description').value = s.description || '';
        document.getElementById('s_status').value = s.status || 'active';

        const cd = s.categoryDetails || {};
        if (s.category === 'venue') {
            document.getElementById('v_venueType').value = cd.venueType || '';
            document.getElementById('v_capacity').value = cd.capacity || '';
            document.getElementById('v_pricePerHead').value = cd.pricePerHead || '';
            Array.from(document.querySelectorAll('.v_amenity')).forEach(cb => cb.checked = (cd.amenities || []).includes(cb.value));
        } else if (s.category === 'catering') {
            document.getElementById('c_cuisineType').value = cd.cuisineType || '';
            document.getElementById('c_minGuests').value = cd.minGuests || '';
            document.getElementById('c_maxGuests').value = cd.maxGuests || '';
            document.getElementById('c_starters').value = cd.starters || '';
            document.getElementById('c_mainCourse').value = cd.mainCourse || '';
            document.getElementById('c_desserts').value = cd.desserts || '';
            document.getElementById('c_pricePerPerson').value = cd.pricePerPerson || '';
            document.getElementById('c_packagePrice').value = cd.packagePrice || '';
            Array.from(document.querySelectorAll('.c_service')).forEach(cb => cb.checked = (cd.servicesIncluded || []).includes(cb.value));
        } else if (s.category === 'decor') {
            document.getElementById('d_decorStyle').value = cd.decorStyle || '';
            document.getElementById('d_minPrice').value = cd.minPrice || '';
            document.getElementById('d_maxPrice').value = cd.maxPrice || '';
            document.getElementById('d_includes').value = cd.includes || '';
            Array.from(document.querySelectorAll('.d_event')).forEach(cb => cb.checked = (cd.eventTypes || []).includes(cb.value));
        } else if (s.category === 'photographer') {
            document.getElementById('p_experience').value = cd.experience || '';
            document.getElementById('p_deliverables').value = cd.deliverables || '';
            document.getElementById('p_price').value = cd.price || '';
            Array.from(document.querySelectorAll('.p_service')).forEach(cb => cb.checked = (cd.photoServices || []).includes(cb.value));
            Array.from(document.querySelectorAll('.p_team')).forEach(cb => cb.checked = (cd.team || []).includes(cb.value));
            Array.from(document.querySelectorAll('.p_video')).forEach(cb => cb.checked = (cd.videoOptions || []).includes(cb.value));
        }

        serviceModal.show();
    } catch (err) {
        console.error(err);
        alert('Failed to load service for editing.');
    }
};


  // ------------------ Delete Service ------------------
  window.deleteService = async function(id) {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await authFetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Delete failed');
      }
      await loadServices();
      alert('Service deleted!');
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + (err.message || err));
    }
  };

  // ------------------ Service Details ------------------
  window.openServiceDetails = async function(id) {
    try {
      const res = await authFetch(`/api/services/${id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const s = await res.json();
      let html = `<h4>${escapeHtml(s.name)}</h4><hr>`;
      html += `<p><strong>Category:</strong> ${escapeHtml(s.category)}</p>`;
      html += `<p><strong>Location:</strong> ${escapeHtml(s.location)}</p>`;
      html += `<p><strong>Status:</strong> <span class="badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(s.status)}</span></p>`;
      if (s.description) html += `<p><strong>Description:</strong><br>${escapeHtml(s.description)}</p>`;
      const cd = s.categoryDetails || {};
      if (s.category === 'venue') {
        html += `<hr><h6>Venue Details</h6>`;
        html += `<p><strong>Venue Type:</strong> ${escapeHtml(cd.venueType || '')}</p>`;
        html += `<p><strong>Capacity:</strong> ${escapeHtml(cd.capacity || '')} guests</p>`;
        html += `<p><strong>Price per head:</strong> Rs. ${escapeHtml(cd.pricePerHead || '')}</p>`;
        if (cd.amenities) html += `<p><strong>Amenities:</strong> ${cd.amenities.map(a=>escapeHtml(a)).join(', ')}</p>`;
      } else if (s.category === 'catering') {
        html += `<hr><h6>Catering Details</h6>`;
        html += `<p><strong>Cuisine Type:</strong> ${escapeHtml(cd.cuisineType || '')}</p>`;
        html += `<p><strong>Guest Capacity:</strong> ${escapeHtml(cd.minGuests || '')} - ${escapeHtml(cd.maxGuests || '')}</p>`;
        html += `<p><strong>Price per person:</strong> Rs. ${escapeHtml(cd.pricePerPerson || '')}</p>`;
        if (cd.servicesIncluded) html += `<p><strong>Includes:</strong> ${cd.servicesIncluded.join(', ')}</p>`;
      } else if (s.category === 'decor') {
        html += `<hr><h6>Decor Details</h6>`;
        html += `<p><strong>Decor Style:</strong> ${escapeHtml(cd.decorStyle || '')}</p>`;
        html += `<p><strong>Event Types:</strong> ${(cd.eventTypes||[]).join(', ')}</p>`;
        html += `<p><strong>Price Range:</strong> Rs. ${escapeHtml(cd.minPrice || '')} - Rs. ${escapeHtml(cd.maxPrice || '')}</p>`;
        html += `<p><strong>Includes:</strong> ${escapeHtml(cd.includes || '')}</p>`;
      } else if (s.category === 'photographer') {
        html += `<hr><h6>Photographer Details</h6>`;
        html += `<p><strong>Experience:</strong> ${escapeHtml(cd.experience || '')} years</p>`;
        html += `<p><strong>Deliverables:</strong> ${escapeHtml(cd.deliverables || '')}</p>`;
        html += `<p><strong>Price:</strong> Rs. ${escapeHtml(cd.price || '')}</p>`;
      }
      serviceDetailsBody.innerHTML = html;
      serviceDetailsModal.show();
    } catch(err) {
      console.error(err);
      alert('Failed to load service details.');
    }
  };

  // ------------------ Initial Load ------------------
  loadServices();
});
