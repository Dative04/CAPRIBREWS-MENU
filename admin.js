// ─── DOM References ────────────────────────────────────────────────────────────
const loginScreen    = document.getElementById('login-screen');
const adminLayout    = document.getElementById('admin-layout');
const loginForm      = document.getElementById('login-form');
const loginError     = document.getElementById('login-error');
const logoutBtn      = document.getElementById('logout-btn');
const adminGrid      = document.getElementById('admin-grid');
const sidebar        = document.getElementById('sidebar');
const viewTitle      = document.getElementById('view-title');

// Orders
let allOrders = [];
let ordersListener = null;
const ordersTableBody  = document.getElementById('ordersTableBody');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

// Modal
const addModal           = document.getElementById('add-modal');
const showAddModalBtn    = document.getElementById('show-add-modal');
const closeModalBtn      = document.getElementById('close-modal');
const addItemForm        = document.getElementById('add-item-form');
const priceTypeSelect    = document.getElementById('price-type-select');
const singlePriceSection = document.getElementById('single-price-input');
const multiPriceSection  = document.getElementById('multi-price-input');
const priceRowsContainer = document.getElementById('price-rows');
const addPriceRowBtn     = document.getElementById('add-price-row');
const newCategorySelect  = document.getElementById('new-category');
const newCategoryCustom  = document.getElementById('new-category-custom');

let currentItems = [];

// ─── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column-reverse;gap:8px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') toast.style.background = '#e63946';
    if (type === 'success') toast.style.background = '#166534';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
window.toggleSidebar = () => sidebar.classList.toggle('expanded');

window.showSection = (sectionId) => {
    ['inventory', 'orders', 'settings'].forEach(id => {
        const el = document.getElementById(`${id}-section`);
        if (el) el.style.display = id === sectionId ? 'block' : 'none';
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('onclick')?.includes(sectionId));
    });
    const titles = { inventory: 'Inventory', orders: 'Orders', settings: 'Settings' };
    if (viewTitle) viewTitle.textContent = titles[sectionId] || '';
    const statsRow = document.getElementById('stats-row');
    if (statsRow) statsRow.style.display = sectionId === 'inventory' ? '' : 'none';
    if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
    }
};

// ─── Category Filter ───────────────────────────────────────────────────────────
document.getElementById('itemCategory')?.addEventListener('change', (e) => {
    const cat = e.target.value;
    const filtered = cat === 'All' ? currentItems : currentItems.filter(i => i.category === cat);
    renderAdminGrid(filtered);
});

// ─── Refresh Orders ────────────────────────────────────────────────────────────
refreshOrdersBtn?.addEventListener('click', () => {
    loadOrdersData();
    showToast('Orders refreshed', 'success');
});

// ─── Auth ──────────────────────────────────────────────────────────────────────
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        loginScreen.classList.add('hidden');
        adminLayout.classList.remove('hidden');
        loadAdminData();
        loadOrdersData();
    } else {
        loginScreen.classList.remove('hidden');
        adminLayout.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    loginError.textContent = '';
    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        });
        if (error) throw error;
    } catch (err) {
        loginError.textContent = err.message || 'Login failed.';
        btn.textContent = 'Login';
        btn.disabled = false;
    }
});

logoutBtn?.addEventListener('click', () => window.supabaseClient.auth.signOut());

// ─── Category combo: show text input when "+ New Category…" is selected ────────
newCategorySelect?.addEventListener('change', (e) => {
    if (e.target.value === '__custom__') {
        newCategoryCustom.style.display = 'block';
        newCategoryCustom.focus();
    } else {
        newCategoryCustom.style.display = 'none';
        newCategoryCustom.value = '';
    }
});

// ─── Helper: get the actual chosen category string ────────────────────────────
function getCategory() {
    if (!newCategorySelect) return '';
    if (newCategorySelect.value === '__custom__') {
        return newCategoryCustom?.value.trim() || '';
    }
    return newCategorySelect.value || '';
}

// ─── Modal open/close ──────────────────────────────────────────────────────────
showAddModalBtn?.addEventListener('click', () => {
    addModal.classList.remove('hidden');
    addItemForm.reset();
    newCategorySelect.selectedIndex = 0;
    newCategoryCustom.style.display = 'none';
    newCategoryCustom.value = '';
    singlePriceSection.classList.remove('hidden');
    multiPriceSection.classList.add('hidden');
    resetPriceRows();
});

closeModalBtn?.addEventListener('click', () => addModal.classList.add('hidden'));
addModal?.addEventListener('click', (e) => { if (e.target === addModal) addModal.classList.add('hidden'); });

// ─── Pricing type toggle ───────────────────────────────────────────────────────
priceTypeSelect?.addEventListener('change', (e) => {
    const isSingle = e.target.value === 'single';
    singlePriceSection.classList.toggle('hidden', !isSingle);
    multiPriceSection.classList.toggle('hidden', isSingle);
});

// ─── Price rows ────────────────────────────────────────────────────────────────
function createPriceRow(size = '', price = '') {
    const row = document.createElement('div');
    row.className = 'form-row price-row';
    row.style.marginBottom = '10px';
    row.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Size (e.g. 16oz)" class="size-input" value="${size}">
        </div>
        <div class="form-group" style="position:relative;">
            <input type="number" placeholder="Price (₱)" class="price-input" value="${price}" step="0.01">
            <button type="button" class="remove-row" style="position:absolute;right:-30px;top:50%;transform:translateY(-50%);background:none;border:none;color:#e63946;font-size:1.2em;cursor:pointer;">×</button>
        </div>
    `;
    row.querySelector('.remove-row').onclick = () => row.remove();
    priceRowsContainer.appendChild(row);
}

function resetPriceRows() {
    priceRowsContainer.innerHTML = '';
    createPriceRow();
}

addPriceRowBtn?.addEventListener('click', () => createPriceRow());

// ─── Submit new item ───────────────────────────────────────────────────────────
addItemForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('new-name').value.trim();
    const category = getCategory();

    if (!name) { showToast('Item name is required', 'error'); return; }
    if (!category) { showToast('Please select or enter a category', 'error'); return; }

    const dietary = Array.from(document.querySelectorAll('.diet-check:checked')).map(c => c.value);

    const newItem = {
        name,
        category,
        description: document.getElementById('new-description').value.trim() || '',
        image_url:   document.getElementById('new-image').value.trim() || '',
        available:   true,
        dietary:     dietary.length ? dietary : null,
        sort_order:  Date.now(),
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
        newItem.prices = Object.keys(prices).length ? prices : null;
        newItem.price  = null;
    }

    const submitBtn = addItemForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Creating…';
    submitBtn.disabled = true;

    try {
        const { error } = await window.supabaseClient.from('menu').insert([newItem]);
        if (error) throw error;

        addModal.classList.add('hidden');
        addItemForm.reset();
        newCategorySelect.selectedIndex = 0;
        newCategoryCustom.style.display = 'none';
        newCategoryCustom.value = '';
        showToast('Item created successfully ✓', 'success');
        loadAdminData();
    } catch (err) {
        console.error('Create item error:', err);
        showToast('Error: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        submitBtn.textContent = 'Create Item';
        submitBtn.disabled = false;
    }
});

// ─── Load inventory ────────────────────────────────────────────────────────────
function loadAdminData() {
    window.supabaseClient
        .from('menu')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
            if (error) { showToast('Failed to load menu data', 'error'); return; }
            currentItems = data || [];
            updateStats(currentItems);
            renderAdminGrid(currentItems);
        });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(items) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-count',  items.length);
    set('stat-cats',   new Set(items.map(i => i.category)).size);
    set('stat-active', items.filter(i => i.available !== false).length);
    set('stat-orders', allOrders.filter(o => o.status === 'pending').length);
}

// ─── Render inventory grid ─────────────────────────────────────────────────────
function renderAdminGrid(items) {
    adminGrid.innerHTML = '';

    if (items.length === 0) {
        adminGrid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);">📭 No items found.</div>';
        return;
    }

    // Rebuild the category filter dropdown dynamically
    const allCats = [...new Set(currentItems.map(i => i.category).filter(Boolean))].sort();
    const catFilter = document.getElementById('itemCategory');
    if (catFilter) {
        const current = catFilter.value;
        catFilter.innerHTML = '<option value="All">All Categories</option>';
        allCats.forEach(cat => {
            const o = document.createElement('option');
            o.value = cat; o.textContent = cat;
            if (cat === current) o.selected = true;
            catFilter.appendChild(o);
        });
    }

    // Also add any DB categories not yet in the Add Item modal select
    if (newCategorySelect) {
        const existing = new Set(Array.from(newCategorySelect.options).map(o => o.value).filter(v => v && v !== '__custom__'));
        allCats.forEach(cat => {
            if (!existing.has(cat)) {
                const o = document.createElement('option');
                o.value = cat; o.textContent = cat;
                newCategorySelect.insertBefore(o, newCategorySelect.lastElementChild);
            }
        });
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const priceDisplay = item.prices
            ? Object.entries(item.prices).map(([s, p]) => `${s}: ₱${Number(p).toFixed(0)}`).join(' · ')
            : `₱${Number(item.price || 0).toFixed(0)}`;
        card.innerHTML = `
            <div class="card-info">
                <h3>${item.name}</h3>
                <p class="card-meta">${item.category || '—'} · ${priceDisplay}</p>
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

// ─── Availability toggle ───────────────────────────────────────────────────────
window.toggleAvailability = async (id, isAvailable) => {
    try {
        const { error } = await window.supabaseClient.from('menu').update({ available: isAvailable }).eq('id', id);
        if (error) throw error;
        showToast(isAvailable ? 'Item marked available' : 'Item hidden from menu', 'success');
    } catch (err) { showToast('Update failed', 'error'); }
};

// ─── Delete item ───────────────────────────────────────────────────────────────
window.deleteItem = async (id) => {
    if (!confirm('Permanently remove this item?')) return;
    try {
        const { error } = await window.supabaseClient.from('menu').delete().eq('id', id);
        if (error) throw error;
        showToast('Item deleted', 'success');
        loadAdminData();
    } catch (err) { showToast('Delete failed', 'error'); }
};

// ─── Admin search ──────────────────────────────────────────────────────────────
document.getElementById('admin-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = currentItems.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
    );
    renderAdminGrid(filtered);
});

// ─── Orders ────────────────────────────────────────────────────────────────────
function loadOrdersData() {
    if (ordersListener) window.supabaseClient.removeChannel(ordersListener);

    window.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
            if (error) {
                if (ordersTableBody) ordersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--error);padding:24px;">Failed to load orders: ${error.message}</td></tr>`;
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

function renderOrdersTable(orders) {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:48px;color:var(--text-dim);">☕ No orders yet. They'll appear here in real-time.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const customer = order.customer_name || 'Guest';
        const itemsList = Array.isArray(order.items)
            ? order.items.map(i => {
                const size = i.selectedSize && i.selectedSize !== 'Standard' ? ` (${i.selectedSize})` : '';
                return `${i.name || '(unnamed)'}${size}`;
              }).join('<br>')
            : String(order.items || '—');
        const total    = `₱${Number(order.total_price || 0).toFixed(0)}`;
        const status   = order.status || 'pending';
        const isPending = status === 'pending';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer}</strong></td>
            <td>${itemsList}</td>
            <td><strong>${total}</strong></td>
            <td><span class="status-badge ${status}" style="padding:3px 10px;border-radius:20px;font-size:0.78em;font-weight:700;background:${status==='pending'?'#fef3c7':status==='completed'?'rgba(29,61,46,0.1)':'#f3f4f6'};color:${status==='pending'?'#92400e':status==='completed'?'var(--accent)':'#6b7280'};">${status}</span></td>
            <td style="display:flex;gap:8px;align-items:center;">
                ${isPending ? `<button class="btn-primary" style="padding:5px 12px;font-size:0.8em;" onclick="updateOrderStatus('${order.id}','completed')">✓ Done</button>` : ''}
                <button class="delete-btn" onclick="deleteOrder('${order.id}')">Delete</button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

window.updateOrderStatus = async (id, status) => {
    try {
        const { error } = await window.supabaseClient.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
        showToast('Order marked completed ✓', 'success');
    } catch (err) { showToast('Failed to update order', 'error'); }
};

window.deleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return;
    try {
        const { error } = await window.supabaseClient.from('orders').delete().eq('id', id);
        if (error) throw error;
        showToast('Order deleted', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
};

// ─── Seed default menu data ────────────────────────────────────────────────────
window.seedMenuData = async () => {
    const menuData = typeof initialMenuData !== 'undefined' ? initialMenuData : [];
    if (menuData.length === 0) { showToast('No menu-data.js found', 'error'); return; }
    if (!confirm(`Add ${menuData.length} items to your database? Only do this on a fresh setup.`)) return;

    try {
        const { error } = await window.supabaseClient.from('menu').insert(
            menuData.map((item, i) => ({
                name:        item.name,
                category:    item.category,
                description: item.description,
                image_url:   item.image || null,
                price:       item.price || null,
                prices:      item.prices || null,
                available:   item.available !== false,
                sort_order:  item.order || i,
            }))
        );
        if (error) throw error;
        showToast(`${menuData.length} items synced ✓`, 'success');
        loadAdminData();
    } catch (err) { showToast('Sync failed: ' + err.message, 'error'); }
};
