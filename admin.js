const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminGrid = document.getElementById('admin-grid');
const statCount = document.getElementById('stat-count');
const statCats = document.getElementById('stat-cats');

// Orders State
let allOrders = [];
let ordersListener = null; // 3. State Management: Store the listener
const ordersContainer = document.getElementById('orders-container');
const newOrderBadge = document.getElementById('new-order-badge');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

// 2. Admin View Integration: Manual Refresh logic
if (refreshOrdersBtn) {
    refreshOrdersBtn.onclick = () => {
        console.log("Manual refresh triggered...");
        loadOrdersData();
        showToast('Orders feed refreshed');
    };
}

// Sidebar Drawer Logic
const adminSidebar = document.getElementById('admin-sidebar');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

if (openSidebarBtn) {
    openSidebarBtn.onclick = () => adminSidebar.classList.add('open');
}
if (closeSidebarBtn) {
    closeSidebarBtn.onclick = () => adminSidebar.classList.remove('open');
}

// Modal Elements
const addModal = document.getElementById('add-modal');
const showAddModalBtn = document.getElementById('show-add-modal');
const closeModalBtn = document.getElementById('close-modal');
const addItemForm = document.getElementById('add-item-form');
const priceTypeSelect = document.getElementById('price-type-select');
const singlePriceSection = document.getElementById('single-price-input');
const multiPriceSection = document.getElementById('multi-price-input');
const priceRowsContainer = document.getElementById('price-rows');
const addPriceRowBtn = document.getElementById('add-price-row');

let currentItems = [];

// Auth Listener
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loginScreen.classList.add('hidden');
        adminScreen.classList.remove('hidden');
        adminSidebar.classList.remove('hidden'); // Ensure sidebar shows
        loadAdminData();
        loadOrdersData();
    } else {
        loginScreen.classList.remove('hidden');
        adminScreen.classList.add('hidden');
        adminSidebar.classList.add('hidden'); // Hide sidebar on login
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button');
    submitBtn.textContent = 'Authenticating...';
    submitBtn.disabled = true;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        loginError.textContent = 'Access Denied: Invalid Credentials';
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => firebase.auth().signOut());

// Modal Logic
showAddModalBtn.addEventListener('click', () => {
    addModal.classList.remove('hidden');
    resetPriceRows();
});
closeModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));

priceTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'single') {
        singlePriceSection.classList.remove('hidden');
        multiPriceSection.classList.add('hidden');
    } else {
        singlePriceSection.classList.add('hidden');
        multiPriceSection.classList.remove('hidden');
    }
});

function createPriceRow(size = '', price = '') {
    const row = document.createElement('div');
    row.className = 'form-row price-row';
    row.style.marginBottom = '10px';
    row.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Size (e.g. 16oz)" class="size-input" value="${size}" required>
        </div>
        <div class="form-group" style="position: relative;">
            <input type="number" placeholder="Price (₱)" class="price-input" value="${price}" step="0.01" required>
            <button type="button" class="remove-row" style="position: absolute; right: -30px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4d; font-size: 1.2em;">×</button>
        </div>
    `;
    
    row.querySelector('.remove-row').onclick = () => row.remove();
    priceRowsContainer.appendChild(row);
}

function resetPriceRows() {
    priceRowsContainer.innerHTML = '';
    createPriceRow(); // Add one default row
}

addPriceRowBtn.onclick = () => createPriceRow();

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dietary = Array.from(document.querySelectorAll('.diet-check:checked')).map(c => c.value);
    
    const newItem = {
        name: document.getElementById('new-name').value,
        category: document.getElementById('new-category').value.toUpperCase(),
        description: document.getElementById('new-description').value,
        image_url: document.getElementById('new-image').value,
        // dietary: dietary, // We'll add this if we update the schema later, or store in JSONB
        available: true,
        sort_order: Date.now()
    };

    if (priceTypeSelect.value === 'single') {
        newItem.price = parseFloat(document.getElementById('new-price').value);
        newItem.prices = null;
    } else {
        const prices = {};
        const rows = priceRowsContainer.querySelectorAll('.price-row');
        rows.forEach(row => {
            const size = row.querySelector('.size-input').value;
            const price = parseFloat(row.querySelector('.price-input').value);
            if (size && !isNaN(price)) {
                prices[size] = price;
            }
        });
        newItem.prices = prices;
        newItem.price = null;
    }

    try {
        const { error } = await window.supabaseClient
            .from('menu')
            .insert([newItem]);

        if (error) throw error;

        addModal.classList.add('hidden');
        addItemForm.reset();
        showToast('Item created successfully');
        loadAdminData();
    } catch (error) {
        console.error("Error creating item:", error);
        showToast('Error creating item');
    }
});

function loadAdminData() {
    console.log("Fetching menu items from Supabase...");
    window.supabaseClient
        .from('menu')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
            if (error) {
                console.error("Error fetching menu:", error);
                showToast('Failed to load menu data');
                return;
            }
            currentItems = data;
            updateStats(currentItems);
            renderAdminGrid(currentItems);
        });
}

function loadOrdersData() {
    // 3. State Management: Clean up existing listener before re-attaching
    if (ordersListener) {
        console.log("Detaching previous listener...");
        window.supabaseClient.removeChannel(ordersListener);
    }

    console.log("4. Admin Page: Fetching and listening to orders via Supabase...");
    
    // 1. Initial fetch of existing orders
    window.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
            if (error) {
                console.error("Initial orders fetch failed:", error);
                ordersContainer.innerHTML = `<p class="error">Failed to connect to orders feed: ${error.message}</p>`;
                return;
            }
            allOrders = data;
            updateStats(currentItems);
            renderOrdersGrid(allOrders);
        });

    // 2. Listen for new orders live
    ordersListener = window.supabaseClient
        .channel('public:orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            console.log('New order received!', payload.new);
            allOrders = [payload.new, ...allOrders];
            newOrderBadge.classList.remove('hidden');
            showToast('New order received!');
            updateStats(currentItems);
            renderOrdersGrid(allOrders);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
            console.log('Order updated!', payload.new);
            allOrders = allOrders.map(o => o.id === payload.new.id ? payload.new : o);
            renderOrdersGrid(allOrders);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, payload => {
            console.log('Order deleted!', payload.old);
            allOrders = allOrders.filter(o => o.id !== payload.old.id);
            renderOrdersGrid(allOrders);
        })
        .subscribe();
}

function renderOrdersGrid(orders) {
    ordersContainer.innerHTML = '';
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p class="loading">No orders yet today.</p>';
        return;
    }
    
    orders.forEach(order => {
        // Supabase uses ISO strings for created_at
        const timestamp = order.created_at ? new Date(order.created_at) : new Date();
        const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        const card = document.createElement('div');
        card.className = `order-card ${order.status}`;
        
        const itemsHtml = order.items.map(item => `
            <div class="order-item-row">
                <div class="item-detail">
                    <span class="item-qty">1×</span>
                    <span class="item-name">${item.name}</span>
                    <span class="item-size-tag">${item.selectedSize}</span>
                </div>
                <span class="item-price">₱${item.selectedPrice.toFixed(0)}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="order-header">
                <div class="order-id-group">
                    <span class="order-label">ORDER</span>
                    <span class="order-id">#${String(order.id).slice(-4).toUpperCase()}</span>
                </div>
                <div class="order-time-group">
                    <span class="order-time">${timeStr}</span>
                    <span class="order-date">${dateStr}</span>
                </div>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-total">
                <span>Total Amount</span>
                <span class="total-value">₱${Number(order.total_price).toFixed(0)}</span>
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="complete-order-btn" onclick="updateOrderStatus('${order.id}', 'completed')">Mark as Done</button>
                ` : `
                    <span class="status-badge completed">Completed</span>
                `}
                <button class="delete-order-btn" onclick="deleteOrder('${order.id}')" title="Delete Record">×</button>
            </div>
        `;
        ordersContainer.appendChild(card);
    });
}

window.updateOrderStatus = async (id, status) => {
    try {
        const { error } = await window.supabaseClient
            .from('orders')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;
        showToast('Order updated');
    } catch (error) {
        console.error("Error updating order status:", error);
        showToast('Failed to update order');
    }
};

window.deleteOrder = async (id) => {
    if (confirm('Delete this order record?')) {
        try {
            const { error } = await window.supabaseClient
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Order removed');
        } catch (error) {
            console.error("Error deleting order:", error);
            showToast('Failed to remove order');
        }
    }
};

// Data Seeding Utility for Supabase
window.seedMenuData = async () => {
    const menuData = typeof initialMenuData !== 'undefined' ? initialMenuData : [];

    if (menuData.length === 0) {
        alert('No initial menu data found in menu-data.js');
        return;
    }

    if (confirm(`This will add ${menuData.length} items to your Supabase menu. Proceed?`)) {
        try {
            const formattedData = menuData.map((item, index) => ({
                name: item.name,
                category: item.category,
                description: item.description,
                image_url: item.image || null,
                price: item.price || null,
                prices: item.prices || null,
                available: item.available !== false,
                sort_order: item.order || index
            }));

            const { data, error } = await window.supabaseClient
                .from('menu')
                .insert(formattedData);

            if (error) throw error;
            
            alert('Menu seeded successfully!');
            loadAdminData();
        } catch (error) {
            console.error("Error seeding data: ", error);
            alert('Failed to seed menu: ' + error.message);
        }
    }
};

// View Switching Logic
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

window.switchView = (viewId) => {
    viewSections.forEach(section => {
        section.classList.add('hidden');
        if (section.id === `${viewId}-view`) {
            section.classList.remove('hidden');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewId) {
            item.classList.add('active');
        }
    });

    if (viewId === 'price-manager') {
        renderPriceManager(currentItems);
    }

    if (viewId === 'orders') {
        newOrderBadge.classList.add('hidden');
    }

    if (window.innerWidth <= 768) {
        adminSidebar.classList.remove('open');
    }
};

function renderPriceManager(items) {
    const list = document.getElementById('price-manager-list');
    list.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        
        let pricingHtml = '';
        if (item.prices) {
            pricingHtml = `
                <div class="price-edit-row">
                    ${Object.entries(item.prices).map(([size, price]) => `
                        <div class="price-edit-item">
                            <span>${size}:</span>
                            <input type="number" value="${price}" class="price-input-small" data-size="${size}">
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            pricingHtml = `
                <div class="price-edit-row">
                    <div class="price-edit-item">
                        <span>₱:</span>
                        <input type="number" value="${item.price}" class="price-input-small" data-single="true">
                    </div>
                </div>
            `;
        }

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="tag">${item.category}</span></td>
            <td>${pricingHtml}</td>
            <td>
                <button class="save-price-btn" onclick="updateItemPrice('${item.id}', this)">Save</button>
            </td>
        `;
        list.appendChild(tr);
    });
}

window.updateItemPrice = async (id, btn) => {
    if (!confirm('Save changes to this item\'s price?')) return;
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('.price-input-small');
    const updates = {};

    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (input.dataset.single) {
            updates.price = val;
            updates.prices = null;
        } else {
            if (!updates.prices) updates.prices = {};
            updates.prices[input.dataset.size] = val;
            updates.price = null;
        }
    });

    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const { error } = await window.supabaseClient
            .from('menu')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        showToast('Price updated successfully');
        loadAdminData();
    } catch (error) {
        console.error("Error updating price:", error);
        showToast('Failed to update price');
    } finally {
        btn.textContent = 'Save';
        btn.disabled = false;
    }
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) switchView(view);
    });
});

// Admin Search Logic
const adminSearchInput = document.getElementById('admin-search');
adminSearchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = currentItems.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.category.toLowerCase().includes(term)
    );
    renderAdminGrid(filtered);
});

function updateStats(items) {
    const totalCount = items.length;
    const categories = new Set(items.map(i => i.category)).size;
    const activeCount = items.filter(i => i.available !== false).length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

    document.getElementById('stat-count').textContent = totalCount;
    document.getElementById('stat-cats').textContent = categories;
    document.getElementById('stat-active').textContent = activeCount;
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.textContent = pendingOrders;
}

function renderAdminGrid(items) {
    adminGrid.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        
        const priceDisplay = item.prices 
            ? Object.entries(item.prices).map(([s, p]) => `${s}: ₱${p}`).join(', ')
            : `₱${item.price}`;

        card.innerHTML = `
            <div class="card-info">
                <h3>${item.name}</h3>
                <p class="card-meta">${item.category} • ${priceDisplay}</p>
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

async function toggleAvailability(id, isAvailable) {
    try {
        const { error } = await window.supabaseClient
            .from('menu')
            .update({ available: isAvailable })
            .eq('id', id);

        if (error) throw error;
        showToast('Availability updated');
    } catch (error) {
        console.error("Error toggling availability:", error);
        showToast('Update failed');
    }
}

async function deleteItem(id) {
    if (confirm('Permanently remove this item?')) {
        try {
            const { error } = await window.supabaseClient
                .from('menu')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Item deleted');
            loadAdminData();
        } catch (error) {
            console.error("Error deleting item:", error);
            showToast('Delete failed');
        }
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}