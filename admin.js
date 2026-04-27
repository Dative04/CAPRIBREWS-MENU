document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM Elements ───────────────────────────────────────────────────────────
    const loginScreen         = document.getElementById('login-screen');
    const adminLayout         = document.getElementById('admin-layout');
    const loginForm           = document.getElementById('login-form');
    const loginError          = document.getElementById('login-error');
    const bypassLoginBtn      = document.getElementById('bypass-login');
    const logoutBtn           = document.getElementById('logout-btn');
    const showAddModalBtn     = document.getElementById('show-add-modal');
    const addModal            = document.getElementById('add-modal');
    const addItemForm         = document.getElementById('add-item-form');
    const closeModalBtn       = document.getElementById('close-modal');
    const priceTypeSelect     = document.getElementById('price-type-select');
    const singlePriceSection  = document.getElementById('single-price-input');
    const multiPriceSection   = document.getElementById('multi-price-input');
    const priceRowsContainer  = document.getElementById('price-rows');
    const addPriceRowBtn      = document.getElementById('add-price-row');
    const adminGrid           = document.getElementById('admin-grid');
    const refreshOrdersBtn    = document.getElementById('refresh-orders-btn');
    const adminSearch         = document.getElementById('admin-search');
    
    // Custom Confirm Modal
    const confirmModal        = document.getElementById('confirm-modal');
    const confirmIcon         = document.getElementById('confirm-icon');
    const confirmTitle        = document.getElementById('confirm-title');
    const confirmMessage      = document.getElementById('confirm-message');
    const confirmCancelBtn    = document.getElementById('confirm-cancel-btn');
    const confirmOkBtn        = document.getElementById('confirm-ok-btn');

    // ─── State ──────────────────────────────────────────────────────────────────
    let currentCategory = 'All';
    let currentItems = [];
    let allOrders = [];

    // ─── Section Management ───────────────────────────────────────────────────────
    window.showSection = (sectionId) => {
        // Update active nav link
        document.querySelectorAll('.nav-item').forEach(nav => {
            const onclick = nav.getAttribute('onclick');
            if (onclick && onclick.includes(`'${sectionId}'`)) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Show/Hide sections
        const sections = ['inventory', 'orders', 'completed', 'analytics', 'settings'];
        sections.forEach(id => {
            const el = document.getElementById(`${id}-section`);
            if (el) {
                el.classList.toggle('hidden', id !== sectionId);
            }
        });

        // Update title
        const titleEl = document.getElementById('view-title');
        if (titleEl) {
            titleEl.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        }

        // Special loads
        if (sectionId === 'completed') loadCompletedOrders();
        if (sectionId === 'analytics') updateAnalytics();

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar')?.classList.remove('expanded');
        }
    };

    window.toggleSidebar = () => {
        document.getElementById('sidebar')?.classList.toggle('expanded');
    };

    // Category Emojis Mapping
    const CATEGORY_EMOJIS = {
        "all": "🍽️",
        "coffee selection": "☕",
        "signature blends": "✨",
        "soda blends": "🥤",
        "frappe": "🧊",
        "milkshakes": "🥤",
        "premium milkshakes": "✨",
        "savory bites": "🍟",
        "club sandwiches": "🥪",
        "desserts": "🍰"
    };

    // ─── Category Filtering ───────────────────────────────────────────────────────
    const adminCategoryTabs = document.getElementById('admin-category-tabs');

    function buildAdminCategoryTabs() {
        if (!adminCategoryTabs) return;

        const categories = ['All', ...new Set(currentItems.map(item => item.category).filter(Boolean))];
        
        adminCategoryTabs.innerHTML = categories.map(cat => {
            const emoji = CATEGORY_EMOJIS[cat.toLowerCase()] || '•';
            const isActive = currentCategory === cat;
            return `
                <button class="cat-tab ${isActive ? 'active' : ''}" onclick="filterAdminByCategory('${cat}')">
                    ${emoji} ${cat}
                </button>
            `;
        }).join('');
    }

    window.filterAdminByCategory = (category) => {
        currentCategory = category;
        filterAdminGrid();
    };

    function filterAdminGrid() {
        const searchTerm = adminSearch?.value.toLowerCase() || '';
        
        // Ensure tabs are built/updated
        buildAdminCategoryTabs();

        const filtered = currentItems.filter(item => {
            const matchesCategory = currentCategory === 'All' || 
                                item.category === currentCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                                item.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        renderAdminGrid(filtered);
    }

    adminSearch?.addEventListener('input', filterAdminGrid);

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
            adminLayout.classList.remove('hidden'); 
            loadAdminData();
            loadOrdersData();
            showSection('inventory'); // Show default section
        } else {
            loginScreen.classList.remove('hidden');
            adminLayout.classList.add('hidden');
        }
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn      = e.target.querySelector('button[type="submit"]');

        btn.textContent = 'Signing in…';
        btn.disabled = true;
        loginError.textContent = '';

        try {
            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid email or password. Please check your credentials.');
                } else if (error.message.includes('Email not confirmed')) {
                    throw new Error('Please confirm your email before logging in.');
                }
                throw error;
            }
        } catch (err) {
            loginError.textContent = err.message || 'Login failed. Please try again.';
            btn.textContent = 'Login';
            btn.disabled = false;
        }
    });

    bypassLoginBtn?.addEventListener('click', () => {
        // Hide login screen and show layout for local demo/development
        loginScreen.classList.add('hidden');
        adminLayout.classList.remove('hidden'); 
        loadAdminData();
        loadOrdersData();
        showSection('inventory');
        showToast('Running in Demo/Bypass mode (Auth skipped)', 'warning');
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
        
        // Reset the form
        addItemForm.reset();
        document.getElementById('modal-title').textContent = 'New Menu Item';
        document.getElementById('submit-btn').textContent = 'Create Item';
        document.getElementById('edit-item-id').value = '';
        
        // Set default temperature to 'both'
        const tempRadios = document.getElementsByName('temp');
        tempRadios.forEach(r => { if (r.value === 'both') r.checked = true; });

        // Explicitly set default pricing mode BEFORE creating rows
        priceTypeSelect.value = 'single';
        singlePriceSection.classList.remove('hidden');
        multiPriceSection.classList.add('hidden');
        
        resetPriceRows();
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
        return row;
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

        const temp = document.querySelector('input[name="temp"]:checked')?.value || 'both';
        const editId = document.getElementById('edit-item-id').value;

        const itemData = {
            name:        document.getElementById('new-name').value.trim(),
            category:    category,
            description: document.getElementById('new-description').value.trim() || '',
            image_url:   document.getElementById('new-image').value.trim() || '',
            dietary:     dietary.length ? dietary : null,
            temp:        temp
        };

        if (priceTypeSelect.value === 'single') {
            itemData.price  = parseFloat(document.getElementById('new-price').value) || 0;
            itemData.prices = null;
        } else {
            const prices = {};
            priceRowsContainer.querySelectorAll('.price-row').forEach(row => {
                const size  = row.querySelector('.size-input').value.trim();
                const price = parseFloat(row.querySelector('.price-input').value) || 0;
                if (size) prices[size] = price;
            });
            itemData.prices = prices;
            itemData.price  = null;
        }

        const submitBtn = document.getElementById('submit-btn');
        const isEditing = !!editId;
        submitBtn.textContent = isEditing ? 'Saving...' : 'Creating...';
        submitBtn.disabled = true;

        try {
            let error;
            if (isEditing) {
                const result = await window.supabaseClient.from('menu').update(itemData).eq('id', editId);
                error = result.error;
            } else {
                // New item needs available and sort_order
                itemData.available = true;
                itemData.sort_order = Date.now();
                const result = await window.supabaseClient.from('menu').insert([itemData]);
                error = result.error;

                // Fallback for sort_order overflow
                if (error && error.code === '22003') {
                    itemData.sort_order = Math.floor(Date.now() / 10000);
                    const retry = await window.supabaseClient.from('menu').insert([itemData]);
                    error = retry.error;
                }
            }

            if (error) throw error;
            addModal.classList.add('hidden');
            addItemForm.reset();
            showToast(isEditing ? 'Item updated successfully ✓' : 'Item created successfully ✓', 'success');
            loadAdminData();
        } catch (err) {
            console.error('Save item error:', err);
            showToast(`Error: ${err.message}`, 'error');
        } finally {
            submitBtn.textContent = isEditing ? 'Save Changes' : 'Create Item';
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
                filterAdminGrid(); // Initial render with current filters
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

        // Refresh Category Dropdown in Add Modal
        refreshModalCategoryDropdown(categoriesSet);
    }

    function refreshModalCategoryDropdown(categoriesSet) {
        const modalSelect  = document.getElementById('new-category');
        if (!modalSelect) return;

        // Update Modal Dropdown (Keep defaults + dynamic + "Add New")
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

            const tempTag = item.temp && item.temp !== 'both' 
                ? `<span class="temp-tag ${item.temp}">${item.temp.toUpperCase()}</span>` 
                : '';

            card.innerHTML = `
                <div class="card-info">
                    <div class="card-title-row">
                        <h3>${item.name} ${tempTag}</h3>
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
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editItem('${item.id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
                    </div>
                </div>
            `;
            adminGrid.appendChild(card);
        });
    }

    window.editItem = (id) => {
        const item = currentItems.find(i => i.id === id);
        if (!item) return;

        addModal.classList.remove('hidden');
        document.getElementById('modal-title').textContent = 'Edit Menu Item';
        document.getElementById('submit-btn').textContent = 'Save Changes';
        document.getElementById('edit-item-id').value = item.id;

        document.getElementById('new-name').value = item.name;
        document.getElementById('new-category').value = item.category;
        document.getElementById('new-description').value = item.description || '';
        document.getElementById('new-image').value = item.image_url || '';

        // Handle temperature
        const tempRadios = document.getElementsByName('temp');
        tempRadios.forEach(r => { if (r.value === (item.temp || 'both')) r.checked = true; });

        // Handle dietary checks
        document.querySelectorAll('.diet-check').forEach(check => {
            check.checked = item.dietary?.includes(check.value);
        });

        // Handle pricing
        if (item.prices && Object.keys(item.prices).length > 0) {
            priceTypeSelect.value = 'multi';
            singlePriceSection.classList.add('hidden');
            multiPriceSection.classList.remove('hidden');
            
            priceRowsContainer.innerHTML = '';
            Object.entries(item.prices).forEach(([size, price]) => {
                createPriceRow(size, price);
            });
        } else {
            priceTypeSelect.value = 'single';
            singlePriceSection.classList.remove('hidden');
            multiPriceSection.classList.add('hidden');
            document.getElementById('new-price').value = item.price || 0;
            resetPriceRows();
        }
        
        syncPricingRequired();
    };

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

    // ─── Orders ───────────────────────────────────────────────────────────────────
    async function loadOrdersData() {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            allOrders = data || [];
            updateStats(currentItems);
            renderOrdersTable(allOrders);
        } catch (err) {
            console.error('Load orders error:', err);
        }
    }

    function renderOrdersTable(orders) {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No pending orders.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            const itemsList = order.items.map(i => `${i.name} (${i.selectedSize})`).join(', ');
            
            tr.innerHTML = `
                <td>
                    <div class="customer-info">
                        <strong>${order.customer_name}</strong>
                        ${order.order_type === 'delivery' ? `<br><small>🛵 ${order.delivery_address || 'No address'}</small>` : '<br><small>🏠 Dine-in</small>'}
                    </div>
                </td>
                <td>${itemsList}</td>
                <td>₱${Number(order.total_price).toFixed(0)}</td>
                <td><span class="status-badge pending">Pending</span></td>
                <td>
                    <button class="btn-success btn-sm" onclick="completeOrder('${order.id}')">Complete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    window.completeOrder = async (id) => {
        try {
            const { error } = await window.supabaseClient
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', id);
            if (error) throw error;
            showToast('Order completed!', 'success');
            loadOrdersData();
        } catch (err) {
            showToast('Failed to complete order', 'error');
        }
    };

    // ─── Completed Orders ────────────────────────────────────────────────────────
    window.loadCompletedOrders = async () => {
        const dateFilter = document.getElementById('completed-date-filter').value;
        const tableBody = document.getElementById('completedTableBody');
        if (!tableBody) return;

        try {
            let query = window.supabaseClient
                .from('orders')
                .select('*')
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (dateFilter) {
                query = query.gte('created_at', `${dateFilter}T00:00:00`)
                            .lte('created_at', `${dateFilter}T23:59:59`);
            }

            const { data, error } = await query;
            if (error) throw error;

            tableBody.innerHTML = '';
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No completed orders found.</td></tr>';
                return;
            }

            data.forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                const itemsList = order.items.map(i => i.name).join(', ');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${date}</td>
                    <td>${order.customer_name}</td>
                    <td>${itemsList}</td>
                    <td>₱${Number(order.total_price).toFixed(0)}</td>
                    <td><span class="status-badge success">Completed</span></td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Load completed error:', err);
        }
    };

    // ─── Analytics ────────────────────────────────────────────────────────────────
    window.updateAnalytics = async () => {
        const summaryEl = document.getElementById('sales-summary-content');
        const productsEl = document.getElementById('top-products-content');
        if (!summaryEl || !productsEl) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('*')
                .eq('status', 'completed');

            if (error) throw error;

            const totalSales = data.reduce((sum, o) => sum + Number(o.total_price), 0);
            const totalOrders = data.length;
            const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

            summaryEl.innerHTML = `
                <div class="summary-item">
                    <span class="summary-label">Total Revenue</span>
                    <span class="summary-value">₱${totalSales.toFixed(0)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Orders</span>
                    <span class="summary-value">${totalOrders}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Average Order</span>
                    <span class="summary-value">₱${avgOrder.toFixed(0)}</span>
                </div>
            `;

            // Top Products logic
            const productCounts = {};
            data.forEach(order => {
                order.items.forEach(item => {
                    productCounts[item.name] = (productCounts[item.name] || 0) + 1;
                });
            });

            const sortedProducts = Object.entries(productCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            productsEl.innerHTML = sortedProducts.map(([name, qty], index) => `
                <div class="top-product-item">
                    <div class="product-rank">${index + 1}</div>
                    <div class="product-name">${name}</div>
                    <div class="product-qty">${qty} sold</div>
                </div>
            `).join('');

        } catch (err) {
            console.error('Analytics error:', err);
        }
    };

    // ─── Custom Confirm Dialog ────────────────────────────────────────────────────
    let confirmResolve;
    window.showConfirm = ({ title, message, icon = '⚠️', confirmLabel = 'Confirm', danger = false }) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmIcon.textContent = icon;
        confirmOkBtn.textContent = confirmLabel;
        
        confirmOkBtn.className = danger ? 'btn-danger' : 'btn-primary';
        confirmModal.classList.remove('hidden');

        return new Promise(resolve => {
            confirmResolve = resolve;
        });
    };

    confirmOkBtn?.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        if (confirmResolve) confirmResolve(true);
    });

    confirmCancelBtn?.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        if (confirmResolve) confirmResolve(false);
    });

    // ─── Settings ─────────────────────────────────────────────────────────────────
    window.seedMenuData = async () => {
        const confirmed = await showConfirm({
            title: 'Sync Default Menu?',
            message: 'This will add the default Capribrews menu items to your database. Existing items will remain.',
            icon: '🌱',
            confirmLabel: 'Sync Now'
        });
        if (!confirmed) return;

        try {
            const { error } = await window.supabaseClient.from('menu').insert(window.DEFAULT_MENU_DATA);
            if (error) throw error;
            showToast('Menu synchronized successfully! ✓', 'success');
            loadAdminData();
        } catch (err) {
            showToast('Sync failed: ' + err.message, 'error');
        }
    };

    // ─── Toast Notifications ──────────────────────────────────────────────────────
    window.showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 100);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

});
