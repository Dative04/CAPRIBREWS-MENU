// ─── DOM References ───────────────────────────────────────────────────────────
const loginScreen   = document.getElementById('login-screen');
const adminLayout   = document.getElementById('admin-layout'); // ✅ FIX: was 'admin-screen', now matches HTML
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const logoutBtn     = document.getElementById('logout-btn');
const adminGrid     = document.getElementById('admin-grid');
const sidebar       = document.getElementById('sidebar');
const viewTitle     = document.getElementById('view-title');

// Orders
let allOrders = [];
let ordersListener = null;
const ordersTableBody   = document.getElementById('ordersTableBody');
const refreshOrdersBtn  = document.getElementById('refresh-orders-btn');

// Modal
const addModal          = document.getElementById('add-modal');
const showAddModalBtn   = document.getElementById('show-add-modal');
const closeModalBtn     = document.getElementById('close-modal');
const addItemForm       = document.getElementById('add-item-form');
const priceTypeSelect   = document.getElementById('price-type-select');
const singlePriceSection = document.getElementById('single-price-input');
const multiPriceSection  = document.getElementById('multi-price-input');
const priceRowsContainer = document.getElementById('price-rows');
const addPriceRowBtn    = document.getElementById('add-price-row');

let currentItems = [];

// ─── Toast (stacking, not overlapping) ────────────────────────────────────────
function showToast(msg, type = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast${type ? ' ' + type : ''}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Custom Confirm Modal (replaces native confirm()) ─────────────────────────
function showConfirm({ title = 'Are you sure?', message = 'This action cannot be undone.', icon = '⚠️', confirmLabel = 'Confirm', danger = true } = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-icon').textContent = icon;

        const okBtn = document.getElementById('confirm-ok-btn');
        okBtn.textContent = confirmLabel;
        okBtn.className = danger ? 'btn-danger' : 'btn-primary';

        modal.classList.remove('hidden');

        const cleanup = (result) => {
            modal.classList.add('hidden');
            okBtn.replaceWith(okBtn.cloneNode(true)); // remove listeners
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            resolve(result);
        };

        // Re-query after replaceWith
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        document.getElementById('confirm-ok-btn').addEventListener('click', () => cleanup(true), { once: true });
        document.getElementById('confirm-cancel-btn').addEventListener('click', () => cleanup(false), { once: true });
    });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
window.toggleSidebar = () => sidebar.classList.toggle('expanded');

window.showSection = (sectionId) => {
    const sections = ['inventory', 'orders', 'settings'];
    sections.forEach(id => {
        const el = document.getElementById(`${id}-section`);
        if (el) el.style.display = id === sectionId ? 'block' : 'none';
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('onclick')?.includes(sectionId));
    });

    const titles = { inventory: 'Inventory', orders: 'Orders', settings: 'Settings' };
    if (viewTitle) viewTitle.textContent = titles[sectionId] || '';

    // Hide stats row on non-inventory sections
    const statsRow = document.getElementById('stats-row');
    if (statsRow) statsRow.style.display = sectionId === 'inventory' ? '' : 'none';

    if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
    }
};

// ─── Category Filtering ───────────────────────────────────────────────────────
const categoryFilter = document.getElementById('itemCategory');
categoryFilter?.addEventListener('change', (e) => filterInventory(e.target.value));

function filterInventory(category) {
    const filtered = category === 'All'
        ? currentItems
        : currentItems.filter(item => item.category === category);
    renderAdminGrid(filtered);
}

// ─── Refresh Orders Button ────────────────────────────────────────────────────
if (refreshOrdersBtn) {
    refreshOrdersBtn.onclick = () => {
        loadOrdersData();
        showToast('Orders refreshed', 'success');
    };
}

// ─── Auth Listener ────────────────────────────────────────────────────────────
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        loginScreen.classList.add('hidden');
        adminLayout.classList.remove('hidden'); // ✅ FIX: shows admin-layout, not admin-screen
        loadAdminData();
        loadOrdersData();
    } else {
        loginScreen.classList.remove('hidden');
        adminLayout.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn      = e.target.querySelector('button[type="submit"]');

    btn.textContent = 'Signing in…';
    btn.disabled = true;
    loginError.textContent = '';

    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (err) {
        loginError.textContent = err.message || 'Login failed. Please try again.';
        btn.textContent = 'Login';
        btn.disabled = false;
    }
});

logoutBtn?.addEventListener('click', () => window.supabaseClient.auth.signOut());

// ─── Add Item Modal ───────────────────────────────────────────────────────────
window.toggleCustomCategory = (val) => {
    const customInput = document.getElementById('custom-category');
    if (val === 'custom') {
        customInput.classList.remove('hidden');
        customInput.required = true;
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
        customInput.required = false;
    }
};

showAddModalBtn?.addEventListener('click', () => {
    addModal.classList.remove('hidden');
    
    // 1. Reset the form first
    addItemForm.reset();
    
    // 2. Explicitly set default pricing mode BEFORE creating rows
    priceTypeSelect.value = 'single';
    singlePriceSection.classList.remove('hidden');
    multiPriceSection.classList.add('hidden');
    
    // 3. Reset price rows (now they will correctly see 'single' mode)
    resetPriceRows();
    
    // 4. Sync required attributes
    syncPricingRequired();

    document.getElementById('custom-category').classList.add('hidden');
});

closeModalBtn?.addEventListener('click', () => addModal.classList.add('hidden'));

// Close modal on backdrop click
addModal?.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.classList.add('hidden');
});

// Helper to sync 'required' attributes based on current pricing mode
function syncPricingRequired() {
    const isSingle = priceTypeSelect.value === 'single';
    
    // Single price input
    const singleInput = document.getElementById('new-price');
    if (singleInput) {
        if (isSingle) singleInput.setAttribute('required', '');
        else singleInput.removeAttribute('required');
    }

    // Multi-price rows - remove required if hidden to avoid "not focusable" error
    const multiInputs = multiPriceSection.querySelectorAll('input');
    multiInputs.forEach(input => {
        if (!isSingle) input.setAttribute('required', '');
        else input.removeAttribute('required');
    });
}

priceTypeSelect?.addEventListener('change', () => {
    const isSingle = priceTypeSelect.value === 'single';
    singlePriceSection.classList.toggle('hidden', !isSingle);
    multiPriceSection.classList.toggle('hidden', isSingle);
    syncPricingRequired();
});

function createPriceRow(size = '', price = '') {
    const row = document.createElement('div');
    row.className = 'form-row price-row';
    row.style.cssText = 'margin-bottom: 10px; position: relative;';
    
    row.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Size (e.g. 16oz)" class="size-input" value="${size}">
        </div>
        <div class="form-group">
            <input type="number" placeholder="Price (₱)" class="price-input" value="${price}" step="0.01">
            <button type="button" class="remove-row" title="Remove">×</button>
        </div>
    `;
    row.querySelector('.remove-row').onclick = () => {
        row.remove();
        syncPricingRequired(); // Sync after removal too
    };
    priceRowsContainer.appendChild(row);
    syncPricingRequired(); // Sync after adding
}

function resetPriceRows() {
    priceRowsContainer.innerHTML = '';
    createPriceRow();
}

addPriceRowBtn?.addEventListener('click', () => createPriceRow());

addItemForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ─── Manual Validation for Pricing ───────────────────────────────────────
    if (priceTypeSelect.value === 'single') {
        const val = document.getElementById('new-price').value;
        if (!val || parseFloat(val) < 0) {
            showToast('Please enter a valid price', 'error');
            document.getElementById('new-price').focus();
            return;
        }
    } else {
        const rows = priceRowsContainer.querySelectorAll('.price-row');
        if (rows.length === 0) {
            showToast('Please add at least one size/price', 'error');
            return;
        }
        let valid = true;
        rows.forEach(row => {
            const s = row.querySelector('.size-input').value.trim();
            const p = row.querySelector('.price-input').value;
            if (!s || !p) valid = false;
        });
        if (!valid) {
            showToast('Please fill in all size and price fields', 'error');
            return;
        }
    }

    const dietary = Array.from(document.querySelectorAll('.diet-check:checked')).map(c => c.value);
    
    let category = document.getElementById('new-category').value;
    if (category === 'custom') {
        category = document.getElementById('custom-category').value.trim() || 'General';
    }

    const newItem = {
        name:        document.getElementById('new-name').value.trim(),
        category:    category,
        description: document.getElementById('new-description').value.trim() || '',
        image_url:   document.getElementById('new-image').value.trim() || '',
        available:   true,
        dietary:     dietary.length ? dietary : null,
        // Using a safer sort order if BIGINT isn't ready, but Date.now() is preferred for uniqueness
        sort_order:  Date.now() 
    };

    if (priceTypeSelect.value === 'single') {
        newItem.price  = parseFloat(document.getElementById('new-price').value) || 0;
        newItem.prices = null;
    } else {
        const prices = {};
        priceRowsContainer.querySelectorAll('.price-row').forEach(row => {
            const size  = row.querySelector('.size-input').value.trim();
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            if (size) prices[size] = price;
        });
        newItem.prices = prices;
        newItem.price  = null;
    }

    const submitBtn = addItemForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Creating…';
    submitBtn.disabled = true;

    try {
        let { error } = await window.supabaseClient.from('menu').insert([newItem]);
        
        // Fallback for "value out of range for type integer" if user hasn't run the SQL migration
        if (error && error.code === '22003') {
            console.warn('Sort order overflow, retrying with smaller value...');
            newItem.sort_order = Math.floor(Date.now() / 10000); // Reduce size
            const retry = await window.supabaseClient.from('menu').insert([newItem]);
            error = retry.error;
        }

        if (error) throw error;
        addModal.classList.add('hidden');
        addItemForm.reset();
        showToast('Item created successfully ✓', 'success');
        loadAdminData();
    } catch (err) {
        console.error('Create item error:', err);
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        submitBtn.textContent = 'Create Item';
        submitBtn.disabled = false;
    }
});

// ─── Load Admin Data ──────────────────────────────────────────────────────────
function loadAdminData() {
    window.supabaseClient
        .from('menu')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
            if (error) {
                showToast('Failed to load menu data', 'error');
                return;
            }
            currentItems = data || [];
            updateStats(currentItems);
            renderAdminGrid(currentItems);
        });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats(items) {
    const totalCount   = items.length;
    const categoriesSet = new Set(items.map(i => i.category));
    const categoriesCount = categoriesSet.size;
    const activeCount  = items.filter(i => i.available !== false).length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-count',  totalCount);
    set('stat-cats',   categoriesCount);
    set('stat-active', activeCount);
    set('stat-orders', pendingOrders);

    // Refresh Category Filter Dropdown
    refreshCategoryDropdowns(categoriesSet);
}

function refreshCategoryDropdowns(categoriesSet) {
    const filterSelect = document.getElementById('itemCategory');
    const modalSelect  = document.getElementById('new-category');
    
    if (!filterSelect || !modalSelect) return;

    // 1. Update Filter Dropdown
    const currentFilterVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="All">All Categories</option>';
    Array.from(categoriesSet).sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
    });
    filterSelect.value = currentFilterVal; // Preserve selection

    // 2. Update Modal Dropdown (Keep defaults + dynamic + "Add New")
    const defaults = ["Coffee Selection", "Signature Blends", "Soda Blends", "Frappe"];
    const allCats = new Set([...defaults, ...categoriesSet]);
    
    const currentModalVal = modalSelect.value;
    modalSelect.innerHTML = '<option value="" disabled>Select Category</option>';
    Array.from(allCats).sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        modalSelect.appendChild(opt);
    });
    const addBtn = document.createElement('option');
    addBtn.value = 'custom';
    addBtn.textContent = '+ Add New Category';
    modalSelect.appendChild(addBtn);
    modalSelect.value = currentModalVal;
}

// ─── Render Inventory Grid ────────────────────────────────────────────────────
function renderAdminGrid(items) {
    adminGrid.innerHTML = '';

    if (items.length === 0) {
        adminGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>No items found. Try a different search or category.</p>
            </div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';

        const priceDisplay = item.prices
            ? Object.entries(item.prices).map(([s, p]) => `${s}: ₱${Number(p).toFixed(0)}`).join(' · ')
            : `₱${Number(item.price || 0).toFixed(0)}`;

        card.innerHTML = `
            <div class="card-info">
                <div class="card-title-row">
                    <h3>${item.name}</h3>
                    <div class="dietary-tags">
                        ${item.dietary?.includes('vegan') ? '<span class="tag-v" title="Vegan">🌱</span>' : ''}
                        ${item.dietary?.includes('gf') ? '<span class="tag-gf" title="Gluten Free">🌾</span>' : ''}
                    </div>
                </div>
                <p class="card-meta">${item.category} · ${priceDisplay}</p>
            </div>
            <div class="card-actions">
                <div class="toggle-group">
                    <span>Available</span>
                    <label class="switch">
                        <input type="checkbox" ${item.available !== false ? 'checked' : ''}
                               onchange="toggleAvailability('${item.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        `;
        adminGrid.appendChild(card);
    });
}

window.toggleAvailability = async (id, isAvailable) => {
    try {
        const { error } = await window.supabaseClient
            .from('menu').update({ available: isAvailable }).eq('id', id);
        if (error) throw error;
        showToast(isAvailable ? 'Item marked available' : 'Item hidden from menu', 'success');
    } catch (err) {
        showToast('Update failed', 'error');
    }
};

window.deleteItem = async (id) => {
    const confirmed = await showConfirm({
        title: 'Delete Menu Item?',
        message: 'This will permanently remove the item from your menu.',
        icon: '🗑️',
        confirmLabel: 'Delete',
        danger: true
    });
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient.from('menu').delete().eq('id', id);
        if (error) throw error;
        showToast('Item deleted', 'success');
        loadAdminData();
    } catch (err) {
        showToast('Delete failed', 'error');
    }
};

// ─── Admin Search & Filter ────────────────────────────────────────────────────
const adminSearchInput = document.getElementById('admin-search');
const itemCategoryFilter = document.getElementById('itemCategory');

function filterAdminGrid() {
    const term = adminSearchInput?.value.toLowerCase() || '';
    const cat  = itemCategoryFilter?.value || 'All';
    
    const filtered = currentItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
        const matchesCat    = cat === 'All' || item.category === cat;
        return matchesSearch && matchesCat;
    });
    renderAdminGrid(filtered);
}

adminSearchInput?.addEventListener('input', filterAdminGrid);
itemCategoryFilter?.addEventListener('change', filterAdminGrid);

// ─── Orders ───────────────────────────────────────────────────────────────────
function loadOrdersData() {
    if (ordersListener) {
        window.supabaseClient.removeChannel(ordersListener);
    }

    window.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
            if (error) {
                console.error('Orders fetch error:', error);
                if (ordersTableBody) {
                    ordersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--error); padding: 24px;">Failed to load orders: ${error.message}</td></tr>`;
                }
                return;
            }
            allOrders = data || [];
            updateStats(currentItems);
            renderOrdersTable(allOrders);
        });

    ordersListener = window.supabaseClient
        .channel('public:orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            if (!allOrders.find(o => o.id === payload.new.id)) {
                allOrders = [payload.new, ...allOrders];
                if (payload.new.status === 'pending') showToast('☕ New order received!', 'success');
                updateStats(currentItems);
                renderOrdersTable(allOrders);
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
            allOrders = allOrders.map(o => o.id === payload.new.id ? payload.new : o);
            renderOrdersTable(allOrders);
            updateStats(currentItems);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, payload => {
            allOrders = allOrders.filter(o => o.id !== payload.old.id);
            renderOrdersTable(allOrders);
            updateStats(currentItems);
        })
        .subscribe();
}

// ✅ FIX: Orders table now correctly maps columns: Customer | Items | Total | Status | Action
function renderOrdersTable(orders) {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 48px 20px; color: var(--text-dim);">
                    <div style="font-size: 2rem; margin-bottom: 8px;">☕</div>
                    <div>No orders yet. They'll appear here in real-time.</div>
                </td>
            </tr>`;
        return;
    }

    orders.forEach(order => {
        const customer  = order.customer_name || 'Guest';
        const itemsList = Array.isArray(order.items)
            ? order.items.map(i => {
                if (!i) return 'Unknown Item';
                const name = i.name || 'Unnamed Item';
                const qty = i.quantity ? ` (x${i.quantity})` : '';
                const size = i.selectedSize && i.selectedSize !== 'Standard' 
                    ? ` <span style="color:var(--text-dim); font-size:0.8em;">${i.selectedSize}</span>` 
                    : '';
                return `${name}${size}${qty}`;
            }).join('<br>')
            : (String(order.items || '—'));
        const total    = `₱${Number(order.total_price || 0).toFixed(0)}`;
        const status   = order.status || 'pending';
        const isPending = status === 'pending';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer}</strong></td>
            <td class="order-items-cell">${itemsList}</td>
            <td><strong>${total}</strong></td>
            <td><span class="status-badge ${status}">${status}</span></td>
            <td>
                <div class="order-action-cell">
                    ${isPending ? `<button class="complete-btn" onclick="updateOrderStatus('${order.id}', 'completed')">✓ Complete</button>` : ''}
                    <button class="delete-btn" onclick="deleteOrder('${order.id}')">Delete</button>
                </div>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

window.updateOrderStatus = async (id, status) => {
    try {
        const { error } = await window.supabaseClient
            .from('orders').update({ status }).eq('id', id);
        if (error) throw error;
        showToast('Order marked as completed ✓', 'success');
    } catch (err) {
        showToast('Failed to update order', 'error');
    }
};

window.deleteOrder = async (id) => {
    const confirmed = await showConfirm({
        title: 'Delete Order?',
        message: 'This will permanently remove the order from the system.',
        icon: '🗑️',
        confirmLabel: 'Delete',
        danger: true
    });
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient.from('orders').delete().eq('id', id);
        if (error) throw error;
        showToast('Order deleted', 'success');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
window.seedMenuData = async () => {
    const menuData = typeof initialMenuData !== 'undefined' ? initialMenuData : [];

    if (menuData.length === 0) {
        showToast('No menu-data.js found to seed from', 'error');
        return;
    }

    const confirmed = await showConfirm({
        title: 'Sync Default Menu?',
        message: `This will add ${menuData.length} items to your database. Only do this on a fresh setup.`,
        icon: '🌱',
        confirmLabel: 'Sync Now',
        danger: false
    });
    if (!confirmed) return;

    try {
        const formattedData = menuData.map((item, index) => ({
            name:       item.name,
            category:   item.category,
            description: item.description,
            image_url:  item.image || null,
            price:      item.price || null,
            prices:     item.prices || null,
            available:  item.available !== false,
            dietary:    item.dietary || null,
            sort_order: item.order !== undefined ? item.order : index
        }));

        const { error } = await window.supabaseClient.from('menu').insert(formattedData);
        if (error) throw error;

        showToast(`${menuData.length} items synced successfully ✓`, 'success');
        loadAdminData();
    } catch (err) {
        showToast('Sync failed: ' + err.message, 'error');
    }
};
