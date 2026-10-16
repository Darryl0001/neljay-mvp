function makePlaceholder(text) {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23a1a1aa">${encodeURIComponent(text)}</text></svg>`;
}

const DEFAULT_DATA = {
  session: null,
  businesses: [
    {
      id: "biz-valencia-brews",
      name: "Valencia Brews & Bakes",
      description: "Specialty coffee, local artisan pastries, and cozy study nook located right at the heart of the city.",
      category: "Food & Beverage",
      barangay: "Poblacion",
      contactNumber: "0917-123-4567",
      lat: 7.9065,
      lng: 125.0938
    }
  ],
  offerings: []
};

let state = {
  activeView: 'directory',
  selectedBusinessId: null,
  directoryTab: 'businesses',
  ownerTab: 'products'
};

let publicMap = null;
let ownerMap = null;
let ownerMarker = null;

function getStorageData() {
  const stored = localStorage.getItem('nel_jay_v7_data');
  if (!stored) {
    localStorage.setItem('nel_jay_v7_data', JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
  return JSON.parse(stored);
}

function saveStorageData(data) {
  localStorage.setItem('nel_jay_v7_data', JSON.stringify(data));
  renderAuthNav();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

function hideToast() {
  document.getElementById('toast').classList.add('hidden');
}

function resetDemoData() {
  localStorage.setItem('nel_jay_v7_data', JSON.stringify(DEFAULT_DATA));
  initApp();
  showToast('Demo reset.');
}

function renderAuthNav() {
  const data = getStorageData();
  const container = document.getElementById('auth-nav-container');

  if (data.session) {
    const biz = data.businesses.find(b => b.id === data.session);
    container.innerHTML = `
      <div class="flex items-center gap-1.5">
        <button onclick="switchView('portal')" class="text-xs px-2.5 py-1.5 rounded bg-zinc-900 text-white font-medium flex items-center gap-1.5 cursor-pointer geist-mono">
          <i data-lucide="layout-dashboard" class="w-3 h-3"></i> 
        </button>
        <button onclick="logoutOwner()" class="text-xs text-zinc-400 hover:text-zinc-900 font-medium cursor-pointer px-1 py-1">Log Out</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-900 text-zinc-900 rounded text-xs font-medium cursor-pointer flex items-center gap-1.5 geist-mono">
        Login
      </button>
    `;
  }
  lucide.createIcons();
}

function openAuthModal() {
  const data = getStorageData();
  const select = document.getElementById('login-biz-select');
  select.innerHTML = data.businesses.map(b => `<option value="${b.id}">${b.name} (${b.barangay})</option>`).join('');
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab('login');
  lucide.createIcons();
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function openAddOfferingModal() {
  document.getElementById('add-offering-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeAddOfferingModal() {
  document.getElementById('add-offering-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tab === 'login') {
    formLogin.classList.remove('hidden');
    formSignup.classList.add('hidden');
    tabLogin.className = "pb-1.5 border-b-2 border-zinc-900 text-zinc-900 cursor-pointer font-semibold";
    tabSignup.className = "pb-1.5 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer font-medium";
  } else {
    formLogin.classList.add('hidden');
    formSignup.classList.remove('hidden');
    tabLogin.className = "pb-1.5 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer font-medium";
    tabSignup.className = "pb-1.5 border-b-2 border-zinc-900 text-zinc-900 cursor-pointer font-semibold";
  }
}

function switchDirectoryTab(tab) {
  state.directoryTab = tab;
  const btnBiz = document.getElementById('tab-dir-businesses');
  const btnProd = document.getElementById('tab-dir-products');
  const btnMap = document.getElementById('tab-dir-map');
  const contentBiz = document.getElementById('dir-content-businesses');
  const contentProd = document.getElementById('dir-content-products');
  const contentMap = document.getElementById('dir-content-map');

  btnBiz.className = "pb-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer flex items-center gap-1.5";
  btnProd.className = "pb-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer flex items-center gap-1.5";
  btnMap.className = "pb-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer flex items-center gap-1.5";
  
  contentBiz.classList.add('hidden');
  contentProd.classList.add('hidden');
  contentMap.classList.add('hidden');

  if (tab === 'businesses') {
    contentBiz.classList.remove('hidden');
    btnBiz.className = "pb-2 border-b-2 border-zinc-900 text-zinc-900 font-semibold cursor-pointer flex items-center gap-1.5";
  } else if (tab === 'products') {
    contentProd.classList.remove('hidden');
    btnProd.className = "pb-2 border-b-2 border-zinc-900 text-zinc-900 font-semibold cursor-pointer flex items-center gap-1.5";
  } else if (tab === 'map') {
    contentMap.classList.remove('hidden');
    btnMap.className = "pb-2 border-b-2 border-zinc-900 text-zinc-900 font-semibold cursor-pointer flex items-center gap-1.5";
    setTimeout(() => initPublicMap(), 200);
  }
  renderDirectory();
}

function switchOwnerTab(tab) {
  state.ownerTab = tab;
  const btnProd = document.getElementById('tab-btn-products');
  const btnSet = document.getElementById('tab-btn-settings');
  const contentProd = document.getElementById('tab-content-products');
  const contentSet = document.getElementById('tab-content-settings');

  if (tab === 'products') {
    contentProd.classList.remove('hidden');
    contentSet.classList.add('hidden');
    btnProd.className = "pb-2 border-b-2 border-zinc-900 text-zinc-900 font-semibold cursor-pointer flex items-center gap-1.5";
    btnSet.className = "pb-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer flex items-center gap-1.5";
  } else {
    contentProd.classList.add('hidden');
    contentSet.classList.remove('hidden');
    btnProd.className = "pb-2 border-b-2 border-transparent text-zinc-400 hover:text-zinc-900 cursor-pointer flex items-center gap-1.5";
    btnSet.className = "pb-2 border-b-2 border-zinc-900 text-zinc-900 font-semibold cursor-pointer flex items-center gap-1.5";
    setTimeout(() => initOwnerMap(), 200);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const data = getStorageData();
  data.session = document.getElementById('login-biz-select').value;
  saveStorageData(data);
  closeAuthModal();
  switchView('portal');
  showToast('Signed in.');
}

function handleRegisterBusiness(e) {
  e.preventDefault();
  const data = getStorageData();
  const newBiz = {
    id: 'biz-' + Date.now(),
    name: document.getElementById('reg-name').value,
    category: document.getElementById('reg-category').value,
    barangay: document.getElementById('reg-barangay').value,
    contactNumber: document.getElementById('reg-contact').value,
    description: document.getElementById('reg-desc').value,
    lat: 7.9050,
    lng: 125.0940
  };

  data.businesses.push(newBiz);
  data.session = newBiz.id;
  saveStorageData(data);
  closeAuthModal();
  switchView('portal');
  showToast('Business created.');
}

function logoutOwner() {
  const data = getStorageData();
  data.session = null;
  saveStorageData(data);
  switchView('directory');
  showToast('Logged out.');
}

function switchView(viewName, businessId = null) {
  state.activeView = viewName;
  if (businessId) state.selectedBusinessId = businessId;

  document.getElementById('view-directory').classList.add('hidden');
  document.getElementById('view-profile').classList.add('hidden');
  document.getElementById('view-owner-portal').classList.add('hidden');

  if (viewName === 'directory') {
    document.getElementById('view-directory').classList.remove('hidden');
    renderDirectory();
  } else if (viewName === 'profile') {
    document.getElementById('view-profile').classList.remove('hidden');
    renderPublicProfile(state.selectedBusinessId);
  } else if (viewName === 'portal') {
    const data = getStorageData();
    if (!data.session) {
      openAuthModal();
      return;
    }
    document.getElementById('view-owner-portal').classList.remove('hidden');
    renderOwnerPortal();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

function viewMyPublicProfile() {
  const data = getStorageData();
  if (data.session) switchView('profile', data.session);
}

function setCategoryPill(category) {
  document.getElementById('category-filter').value = category;
  const pills = [
    { id: 'pill-all', cat: '' },
    { id: 'pill-food', cat: 'Food & Beverage' },
    { id: 'pill-retail', cat: 'Retail' },
    { id: 'pill-services', cat: 'Services' },
    { id: 'pill-agri', cat: 'Agriculture' },
    { id: 'pill-home', cat: 'Home & Hardware' }
  ];

  pills.forEach(p => {
    const el = document.getElementById(p.id);
    el.className = p.cat === category 
      ? "px-3 py-1.5 rounded-md bg-zinc-900 text-white font-medium text-xs shrink-0 cursor-pointer"
      : "px-3 py-1.5 rounded-md bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 font-medium text-xs shrink-0 cursor-pointer";
  });

  renderDirectory();
}

function renderDirectory() {
  const data = getStorageData();
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const category = document.getElementById('category-filter').value;

  const matchingBusinesses = data.businesses.filter(biz => {
    const publicOfferings = data.offerings.filter(o => o.businessId === biz.id && o.isPublic);
    const matchesSearch = !query || 
                          biz.name.toLowerCase().includes(query) || 
                          biz.description.toLowerCase().includes(query) ||
                          biz.barangay.toLowerCase().includes(query) ||
                          publicOfferings.some(o => o.name.toLowerCase().includes(query));
    const matchesCategory = !category || biz.category === category;
    return matchesSearch && matchesCategory;
  });

  const matchingProducts = data.offerings.filter(off => {
    if (!off.isPublic) return false;
    const parentBiz = data.businesses.find(b => b.id === off.businessId);
    if (!parentBiz) return false;

    const matchesSearch = !query || 
                          off.name.toLowerCase().includes(query) || 
                          off.description.toLowerCase().includes(query) ||
                          parentBiz.name.toLowerCase().includes(query);
    const matchesCategory = !category || parentBiz.category === category;
    return matchesSearch && matchesCategory;
  });

  document.getElementById('count-businesses').textContent = matchingBusinesses.length;
  document.getElementById('count-products').textContent = matchingProducts.length;

  const gridBiz = document.getElementById('dir-content-businesses');
  if (matchingBusinesses.length === 0) {
    gridBiz.innerHTML = `<div class="col-span-full py-12 text-center bg-white rounded-lg border border-zinc-200/80 text-xs text-zinc-400 geist-mono">No businesses found</div>`;
  } else {
    gridBiz.innerHTML = matchingBusinesses.map(biz => {
      const publicCount = data.offerings.filter(o => o.businessId === biz.id && o.isPublic).length;
      const initial = biz.name.charAt(0).toUpperCase();
      return `
        <div onclick="switchView('profile', '${biz.id}')" class="group bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-400 transition-all cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.99]">
          <div class="h-16 bg-gradient-to-r from-zinc-100 to-zinc-200/60 p-3 relative">
            <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center absolute -bottom-3 left-3 border-2 border-white shadow-xs">
              ${initial}
            </div>
          </div>
          <div class="p-3.5 pt-5 space-y-1.5">
            <div class="flex items-center justify-between text-[10px] geist-mono">
              <span class="font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">${biz.category}</span>
              <span class="text-zinc-400 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${biz.barangay}</span>
            </div>
            <div>
              <h3 class="font-semibold text-xs text-zinc-900 group-hover:underline">${biz.name}</h3>
              <p class="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">${biz.description}</p>
            </div>
          </div>
          <div class="px-3.5 py-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 bg-zinc-50/50">
            <span class="geist-mono">${publicCount} items</span>
            <span class="font-medium text-zinc-900 flex items-center gap-1">View Profile <i data-lucide="arrow-right" class="w-3 h-3"></i></span>
          </div>
        </div>
      `;
    }).join('');
  }

  const gridProd = document.getElementById('dir-content-products');
  if (matchingProducts.length === 0) {
    gridProd.innerHTML = `<div class="col-span-full py-12 text-center bg-white rounded-lg border border-zinc-200/80 text-xs text-zinc-400 geist-mono">No products found</div>`;
  } else {
    gridProd.innerHTML = matchingProducts.map(off => {
      const parentBiz = data.businesses.find(b => b.id === off.businessId);
      return `
        <div onclick="switchView('profile', '${off.businessId}')" class="group bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-400 transition-all cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.99]">
          <div>
            <div class="h-36 w-full bg-zinc-100 overflow-hidden relative">
              <img src="${off.imageData}" alt="${off.name}" class="w-full h-full object-cover">
              <span class="absolute top-2 right-2 text-[10px] geist-mono font-medium px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                ${parentBiz ? parentBiz.name : ''}
              </span>
            </div>
            <div class="p-3 space-y-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-medium text-xs text-zinc-900 group-hover:underline">${off.name}</h3>
                <span class="font-semibold text-xs text-zinc-900 geist-mono">₱${Number(off.price).toFixed(2)}</span>
              </div>
              <p class="text-[11px] text-zinc-500 line-clamp-2">${off.description}</p>
            </div>
          </div>
          <div class="px-3 py-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-50/50 geist-mono">
            <span><i data-lucide="store" class="w-3 h-3 inline mr-1"></i> ${parentBiz ? parentBiz.barangay : ''}</span>
            <span class="font-medium text-zinc-900 flex items-center gap-1">Visit Store <i data-lucide="arrow-right" class="w-3 h-3"></i></span>
          </div>
        </div>
      `;
    }).join('');
  }

  lucide.createIcons();
}

function initPublicMap() {
  const data = getStorageData();
  if (!publicMap) {
    publicMap = L.map('map').setView([7.9050, 125.0940], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(publicMap);
  } else {
    publicMap.invalidateSize();
  }

  publicMap.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      publicMap.removeLayer(layer);
    }
  });

  data.businesses.forEach(biz => {
    const lat = biz.lat || 7.9050;
    const lng = biz.lng || 125.0940;
    const marker = L.marker([lat, lng]).addTo(publicMap);
    marker.bindPopup(`
      <div style="font-family:sans-serif; font-size:11px; padding:2px;">
        <strong>${biz.name}</strong><br>
        <span style="color:#666;">${biz.category} &bull; ${biz.barangay}</span><br>
        <a href="#" onclick="switchView('profile', '${biz.id}')" style="display:inline-block; margin-top:4px; font-weight:bold; color:#000;">View Profile &rarr;</a>
      </div>
    `);
  });
}

function initOwnerMap() {
  const data = getStorageData();
  const biz = data.businesses.find(b => b.id === data.session);
  if (!biz) return;

  const lat = biz.lat || 7.9050;
  const lng = biz.lng || 125.0940;

  document.getElementById('lat-display').textContent = lat.toFixed(4);
  document.getElementById('lng-display').textContent = lng.toFixed(4);

  if (!ownerMap) {
    ownerMap = L.map('owner-map').setView([lat, lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(ownerMap);

    ownerMarker = L.marker([lat, lng], { draggable: true }).addTo(ownerMap);
    
    ownerMarker.on('dragend', function (e) {
      const pos = ownerMarker.getLatLng();
      document.getElementById('lat-display').textContent = pos.lat.toFixed(4);
      document.getElementById('lng-display').textContent = pos.lng.toFixed(4);
    });

    ownerMap.on('click', function (e) {
      ownerMarker.setLatLng(e.latlng);
      document.getElementById('lat-display').textContent = e.latlng.lat.toFixed(4);
      document.getElementById('lng-display').textContent = e.latlng.lng.toFixed(4);
    });
  } else {
    ownerMap.invalidateSize();
    ownerMap.setView([lat, lng], 15);
    ownerMarker.setLatLng([lat, lng]);
  }
}

function handleSearch() {
  renderDirectory();
}

function renderPublicProfile(businessId) {
  const data = getStorageData();
  const biz = data.businesses.find(b => b.id === businessId) || data.businesses[0];
  const publicOfferings = data.offerings.filter(o => o.businessId === biz.id && o.isPublic);
  const initial = biz.name.charAt(0).toUpperCase();

  const container = document.getElementById('public-profile-content');
  container.innerHTML = `
    <div class="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
      <div class="h-24 bg-gradient-to-r from-zinc-100 via-zinc-200/50 to-zinc-100 p-4 relative">
        <div class="w-12 h-12 rounded-xl bg-zinc-900 text-white font-bold text-sm flex items-center justify-center absolute -bottom-5 left-5 border-2 border-white shadow-xs">
          ${initial}
        </div>
      </div>
      <div class="p-5 pt-8 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-[10px] geist-mono">
              <span class="font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">${biz.category}</span>
              <span class="text-zinc-400 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> Location ${biz.barangay}, Valencia City</span>
            </div>
            <h1 class="text-xl font-bold tracking-tight text-zinc-900">${biz.name}</h1>
            <p class="text-zinc-600 text-xs leading-relaxed max-w-xl">${biz.description}</p>
          </div>
          <div>
            <a href="tel:${biz.contactNumber}" class="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors geist-mono w-full sm:w-auto justify-center">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i> ${biz.contactNumber}
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-2.5">
      <div class="flex items-center justify-between text-xs geist-mono">
        <h2 class="font-semibold text-zinc-900">Offerings Catalog</h2>
        <span class="text-zinc-400">${publicOfferings.length} public items</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${publicOfferings.length === 0 ? `
          <div class="col-span-full py-10 text-center bg-white rounded-lg border border-zinc-200/80 text-zinc-400 text-xs geist-mono">
            No public items listed currently.
          </div>
        ` : publicOfferings.map(o => `
          <div class="bg-white rounded-lg border border-zinc-200/80 overflow-hidden flex flex-col justify-between">
            <div>
              <div class="h-36 w-full bg-zinc-100 overflow-hidden">
                <img src="${o.imageData}" alt="${o.name}" class="w-full h-full object-cover">
              </div>
              <div class="p-3 space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-medium text-xs text-zinc-900">${o.name}</h3>
                  <span class="font-semibold text-xs text-zinc-900 geist-mono">₱${Number(o.price).toFixed(2)}</span>
                </div>
                <p class="text-[11px] text-zinc-500 line-clamp-2">${o.description}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  lucide.createIcons();
}

function renderOwnerPortal() {
  const data = getStorageData();
  const biz = data.businesses.find(b => b.id === data.session);
  if (!biz) return;

  const initial = biz.name.charAt(0).toUpperCase();

  const bannerContainer = document.getElementById('owner-banner-container');
  bannerContainer.innerHTML = `
    <div class="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
      <div class="h-20 bg-gradient-to-r from-zinc-100 via-zinc-200/60 to-zinc-100 p-3 relative">
        <div class="w-10 h-10 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center absolute -bottom-4 left-4 border-2 border-white shadow-xs">
          ${initial}
        </div>
      </div>
      <div class="p-4 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 text-[10px] geist-mono">
            <span class="font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">${biz.category}</span>
            <span class="text-zinc-400 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> Location ${biz.barangay}</span>
          </div>
          <h1 class="text-base font-bold text-zinc-900 mt-0.5">${biz.name}</h1>
        </div>
        <button onclick="viewMyPublicProfile()" class="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-900 rounded-md text-xs font-medium transition-colors geist-mono">
          <i data-lucide="external-link" class="w-3.5 h-3.5 text-zinc-500"></i> Public View
        </button>
      </div>
    </div>
  `;

  document.getElementById('owner-biz-name').value = biz.name;
  document.getElementById('owner-biz-category').value = biz.category;
  document.getElementById('owner-biz-barangay').value = biz.barangay;
  document.getElementById('owner-biz-contact').value = biz.contactNumber;
  document.getElementById('owner-biz-desc').value = biz.description;

  const offerings = data.offerings.filter(o => o.businessId === biz.id);
  document.getElementById('owner-offering-count').textContent = `${offerings.length} Total Items`;

  const listContainer = document.getElementById('owner-offerings-list');

  if (offerings.length === 0) {
    listContainer.innerHTML = `<p class="text-xs text-zinc-400 py-6 text-center geist-mono bg-white rounded-lg border border-zinc-200/80">Create Items.</p>`;
    return;
  }

  listContainer.innerHTML = offerings.map(o => `
    <div class="p-3 bg-white rounded-lg border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <img src="${o.imageData}" class="w-10 h-10 rounded object-cover bg-zinc-100 shrink-0" alt="">
        <div class="truncate">
          <p class="font-medium text-zinc-900 truncate text-xs">${o.name}</p>
          <p class="text-zinc-400 text-[11px] geist-mono">₱${Number(o.price).toFixed(2)}</p>
        </div>
      </div>
      <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${o.isPublic ? 'checked' : ''} onchange="toggleOfferingVisibility('${o.id}')" class="sr-only peer">
          <div class="w-7 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-zinc-900"></div>
          <span class="ml-1.5 font-medium w-8 text-[11px] text-zinc-500 geist-mono">${o.isPublic ? 'Public' : 'Hidden'}</span>
        </label>
        <button onclick="deleteOffering('${o.id}')" class="text-zinc-400 hover:text-red-600 cursor-pointer p-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function handleSaveBusinessDetails(e) {
  e.preventDefault();
  const data = getStorageData();
  const biz = data.businesses.find(b => b.id === data.session);
  if (biz) {
    biz.name = document.getElementById('owner-biz-name').value;
    biz.category = document.getElementById('owner-biz-category').value;
    biz.barangay = document.getElementById('owner-biz-barangay').value;
    biz.contactNumber = document.getElementById('owner-biz-contact').value;
    biz.description = document.getElementById('owner-biz-desc').value;

    if (ownerMarker) {
      const pos = ownerMarker.getLatLng();
      biz.lat = pos.lat;
      biz.lng = pos.lng;
    }

    saveStorageData(data);
    renderOwnerPortal();
    showToast('Saved profile & exact map pin.');
  }
}

function handleAddOffering(e) {
  e.preventDefault();
  const data = getStorageData();
  const fileInput = document.getElementById('off-file');
  
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Please choose an image file.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(evt) {
    const base64Image = evt.target.result;
    const newOffering = {
      id: 'off-' + Date.now(),
      businessId: data.session,
      name: document.getElementById('off-name').value,
      price: parseFloat(document.getElementById('off-price').value),
      description: document.getElementById('off-desc').value,
      imageData: base64Image,
      isPublic: document.getElementById('off-public').checked
    };

    data.offerings.push(newOffering);
    saveStorageData(data);
    
    document.getElementById('off-name').value = '';
    document.getElementById('off-price').value = '';
    document.getElementById('off-desc').value = '';
    fileInput.value = '';

    closeAddOfferingModal();
    renderOwnerPortal();
    showToast(`Added "${newOffering.name}".`);
  };

  reader.readAsDataURL(file);
}

function toggleOfferingVisibility(id) {
  const data = getStorageData();
  const offering = data.offerings.find(o => o.id === id);
  if (offering) {
    offering.isPublic = !offering.isPublic;
    saveStorageData(data);
    renderOwnerPortal();
    showToast(`Item ${offering.isPublic ? 'Public' : 'Hidden'}.`);
  }
}

function deleteOffering(id) {
  const data = getStorageData();
  const item = data.offerings.find(o => o.id === id);
  if (confirm(`Delete "${item ? item.name : 'item'}"?`)) {
    data.offerings = data.offerings.filter(o => o.id !== id);
    saveStorageData(data);
    renderOwnerPortal();
    showToast('Deleted.');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.focus();
  }
});

function initApp() {
  getStorageData();
  renderAuthNav();
  renderDirectory();
  lucide.createIcons();
}

window.onload = initApp;