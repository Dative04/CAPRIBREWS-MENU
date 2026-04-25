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
let ordersListener = null;
const ordersContainer = document.getElementById('orders-container');
const ordersTableBody = document.getElementById('ordersTableBody');
const newOrderBadge = document.getElementById('new-order-badge');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

// Sidebar Logic
const sidebar = document.getElementById('sidebar');
const viewTitle = document.getElementById('view-title');

window.toggleSidebar = () => {
    sidebar.classList.toggle('expanded');
};

window.showSection = (sectionId) => {
    // Hide all sections
    document.getElementById('inventory-section').style.display = 'none';
    document.getElementById('orders-section').style.display = 'none';
    document.getElementById('settings-section').style.display = 'none';
    
    // Show active section
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) activeSection.style.display = 'block';

    // Update nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        // Check if the link contains the sectionId in its onclick or text
        if (item.getAttribute('onclick')?.includes(sectionId)) {
            item.classList.add('active');
        }
    });

    // Auto-close sidebar on mobile after selection if expanded
    if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
    }
};

// Category Filtering for Inventory
const categoryFilter = document.getElementById('itemCategory');
categoryFilter?.addEventListener('change', (e) => {
    const category = e.target.value;
    filterInventory(category);
});

function filterInventory(category) {
    if (category === 'All') {
        renderAdminGrid(currentItems);
    } else {
        const filtered = currentItems.filter(item => item.category === category);
        renderAdminGrid(filtered);
    }
}

// 2. Admin View Integration: Manual Refresh logic
if (refreshOrdersBtn) {
    refreshOrdersBtn.onclick = () => {
        console.log("Manual refresh triggered...");
        loadOrdersData();
        showToast('Orders feed refreshed');
    };
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

// Supabase Auth Listener
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        loginScreen.classList.add('hidden');
        adminScreen.classList.remove('hidden');
        sidebar.classList.remove('hidden');
        loadAdminData();
        loadOrdersData();
    } else {
        loginScreen.classList.remove('hidden');
        adminScreen.classList.add('hidden');
        sidebar.classList.add('hidden');
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
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
    } catch (error) {
        loginError.textContent = 'Access Denied: ' + error.message;
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => window.supabaseClient.auth.signOut());

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
        category: document.getElementById('new-category').value || "General",
        description: document.getElementById('new-description').value || "",
        image_url: document.getElementById('new-image').value || "",
        available: true,
        sort_order: 0 // Reset to 0 as per recommendation or use Date.now() for unique sorting
    };

    if (priceTypeSelect.value === 'single') {
        newItem.price = parseFloat(document.getElementById('new-price').value) || 0;
        newItem.prices = null;
    } else {
        const prices = {};
        const rows = priceRowsContainer.querySelectorAll('.price-row');
        rows.forEach(row => {
            const size = row.querySelector('.size-input').value;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            if (size) {
                prices[size] = price;
            }
        });
        newItem.prices = prices;
        newItem.price = null;
    }

    console.log("Pushing to Supabase:", newItem);

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
        // This will print the actual text (e.g., "column sort_order does not exist") 
        console.error("Full Error Object:", error);
        
        if (error.message) {
            console.error("Error Message:", error.message);
            console.error("Error Details:", error.details);
            console.error("Error Hint:", error.hint);
            showToast(`Error: ${error.message}`);
        } else {
            showToast('Error creating item');
        }
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
            updateStats(currentItems); // Still uses currentItems for menu stats, but will use allOrders for order stats
            renderOrdersGrid(allOrders);
        });

    // 2. Listen for new orders live
    ordersListener = window.supabaseClient
        .channel('public:orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            console.log('New order received!', payload.new);
            // Check if order already exists in our local state to prevent duplicates
            if (!allOrders.find(o => o.id === payload.new.id)) {
                allOrders = [payload.new, ...allOrders];
                
                // Show notification if it's a new pending order
                if (payload.new.status === 'pending') {
                    newOrderBadge.classList.remove('hidden');
                    showToast('New order received!');
                }
                
                updateStats(currentItems);
                renderOrdersGrid(allOrders);
            }
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
    if (ordersTableBody) {
        ordersTableBody.innerHTML = '';
        
        if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No orders yet today.</td></tr>';
        } else {
            orders.forEach(order => {
                // Correcting the "Undefined" by using exact Supabase names
                const customer = order.customer_name || "Guest";
                
                // Formatting the JSON items list
                const itemsList = Array.isArray(order.items) 
                    ? order.items.map(i => `${i.name} (x${i.quantity || 1})`).join('<br>')
                    : String(order.items);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${customer}</strong></td>
                    <td>${itemsList}</td>
                    <td>₱${Number(order.total_price || 0).toFixed(0)}</td>
                    <td><button class="delete-btn" onclick="deleteOrder(${order.id})">Delete</button></td>
                `;
                ordersTableBody.appendChild(row);
            });
        }
    }
}

// Helper to format the items JSONB from Supabase
function formatOrderItems(items) {
    if (!items) return '<p>No items</p>';
    
    // If it's already an array (standard behavior)
    if (Array.isArray(items)) {
        return items.map(item => `
            <div class="order-item-row">
                <div class="item-detail">
                    <span class="item-qty">1×</span>
                    <span class="item-name">${item.name || 'Unknown Item'}</span>
                    <span class="item-size-tag">${item.selectedSize || 'Standard'}</span>
                </div>
                <span class="item-price">₱${Number(item.selectedPrice || 0).toFixed(0)}</span>
            </div>
        `).join('');
    }
    
    // Fallback for string or other formats
    return `<p>${String(items)}</p>`;
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
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
        const { error } = await window.supabaseClient
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        showToast('Order deleted successfully!');
        // No need to call loadOrdersData() because the real-time listener handles it
    } catch (error) {
        console.error("Delete failed:", error.message);
        showToast('Error: ' + error.message);
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

    const statCount = document.getElementById('stat-count');
    if (statCount) statCount.textContent = totalCount;
    
    const statCats = document.getElementById('stat-cats');
    if (statCats) statCats.textContent = categories;
    
    const statActive = document.getElementById('stat-active');
    if (statActive) statActive.textContent = activeCount;
    
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