document.addEventListener('DOMContentLoaded', () => {
    const menuGrid          = document.getElementById('menu-grid');
    const searchInput       = document.getElementById('menu-search');
    const mainHeader        = document.getElementById('main-header');

    // Menu state
    let menuData = [];
    let currentCategory = 'All';

    // Cart state
    let cart = [];
    const cartFab           = document.getElementById('cart-fab');
    const cartCount         = document.getElementById('cart-count');
    const cartDrawer        = document.getElementById('cart-drawer');
    const cartBackdrop      = document.getElementById('cart-backdrop');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalLabel    = document.getElementById('cart-total');
    const checkoutBtn       = document.getElementById('checkout-btn');
    const closeCartBtn      = document.getElementById('close-cart');
    const orderModal        = document.getElementById('order-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal');
    const orderSummaryList  = document.getElementById('order-summary-list');
    const summaryTotalLabel = document.getElementById('summary-total');
    const cartCountNav      = document.getElementById('cart-count-nav');
    const nameError         = document.getElementById('name-error');
    const stickyBar         = document.getElementById('sticky-bar');
    const stickyCountBar    = document.getElementById('sticky-count-bar');
    const stickyTotalBar    = document.getElementById('sticky-total-bar');

    // ─── Side Drawer Toggle ───────────────────────────────────────────────────────
    window.toggleMenu = () => {
        const drawer   = document.getElementById('side-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        const isOpen   = drawer.classList.toggle('open');
        backdrop?.classList.toggle('visible', isOpen);
    };

    // ─── Cart Toggle ──────────────────────────────────────────────────────────────
    window.toggleCart = () => {
        const isHidden = cartDrawer.classList.toggle('hidden');
        cartBackdrop?.classList.toggle('hidden', isHidden);
    };

    window.openCart = () => {
        cartDrawer.classList.remove('hidden');
        cartBackdrop?.classList.remove('hidden');
    };

    window.closeCart = () => {
        cartDrawer.classList.add('hidden');
        cartBackdrop?.classList.add('hidden');
    };

    if (cartFab) cartFab.onclick = openCart;
    if (closeCartBtn) closeCartBtn.onclick  = closeCart;

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

    // ─── Menu Rendering Logic ─────────────────────────────────────────────────────

    async function fetchMenuData() {
        try {
            const { data, error } = await window.supabaseClient
                .from('menu')
                .select('*')
                .eq('available', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            menuData = data || [];
            
            buildCategoryTabs(); // Dynamically build tabs based on data
            filterAndRenderItems();
        } catch (err) {
            console.error('Error fetching menu:', err);
            menuGrid.innerHTML = `<p class="error-msg">Failed to load menu. Please refresh.</p>`;
        }
    }

    function buildCategoryTabs() {
        const container = document.getElementById('category-tabs');
        if (!container) return;

        const categories = ['All', ...new Set(menuData.map(item => item.category).filter(Boolean))];
        
        container.innerHTML = categories.map(cat => {
            const emoji = CATEGORY_EMOJIS[cat.toLowerCase()] || '•';
            const isActive = currentCategory === cat;
            return `
                <button class="cat-tab ${isActive ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                    ${emoji} ${cat}
                </button>
            `;
        }).join('');
    }

    window.filterByCategory = (category) => {
        currentCategory = category;
        filterAndRenderItems();
        
        // Update section label if it exists
        const label = document.getElementById('section-label');
        if (label) label.textContent = category === 'All' ? 'All Items' : category;
    };

    function filterAndRenderItems() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        
        // Ensure tabs are built/updated
        buildCategoryTabs();

        const filtered = menuData.filter(item => {
            const matchesCategory = currentCategory === 'All' || 
                                  item.category.toLowerCase() === currentCategory.toLowerCase();
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                                item.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        renderMenuItems(filtered);
    }

    function renderMenuItems(items) {
        if (!menuGrid) return;
        menuGrid.innerHTML = '';

        if (items.length === 0) {
            menuGrid.innerHTML = `
                <div class="no-results">
                    <p>No items found in the menu.</p>
                    <p style="font-size: 0.9rem; color: var(--text-dim); margin-top: 8px;">
                        If you are the admin, please seed the menu data from the admin panel.
                    </p>
                </div>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            
            // Handle multi-pricing vs single price
            let pricingHTML = '';
            if (item.prices && Object.keys(item.prices).length > 0) {
                pricingHTML = Object.entries(item.prices).map(([size, price]) => `
                    <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${size}', ${price}, event)">
                        ${size} - ₱${price}
                    </button>
                `).join('');
            } else {
                pricingHTML = `
                    <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')}, 'Standard', ${item.price}, event)">
                        Add to Cart - ₱${item.price}
                    </button>
                `;
            }

            card.innerHTML = `
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-card-img">` : ''}
                <div class="menu-card-content">
                    <div class="menu-card-header">
                        <h3>${item.name}</h3>
                        <span class="category-tag">${item.category}</span>
                    </div>
                    <p class="menu-card-desc">${item.description}</p>
                    <div class="menu-card-actions">
                        ${pricingHTML}
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    }

    // ─── Order Modal State & Elements ───────────────────────────────────────────
    const captureLocationBtn   = document.getElementById('captureLocationBtn');
    const saveOrderBtn          = document.getElementById('saveOrderBtn');
    const copyReceiptBtn       = document.getElementById('copyReceiptBtn');
    const modalError           = document.getElementById('modal-error');
    const modalHeaderSuccess   = document.getElementById('modal-header-success');
    const modalHeaderPreview   = document.getElementById('modal-header-preview');
    const modalHeaderHistory   = document.getElementById('modal-header-history');
    const deliveryInfoPreview  = document.getElementById('delivery-info-preview');
    const modalInstruction     = document.getElementById('modal-instruction');
    const previewCoordinates   = document.getElementById('preview-coordinates');
    const previewCoordsRow     = document.getElementById('preview-coords-row');
    const modalTitle           = document.getElementById('modal-title');
    const modalTotalRow        = document.getElementById('modal-total-row');
    
    let currentOrderData       = null; // Stores data between steps

    // Exposed to window for sidebar access
    window.showRecentOrders = async () => {
        // Hide other modal sections
        modalHeaderSuccess.classList.add('hidden');
        modalHeaderPreview.classList.add('hidden');
        deliveryInfoPreview.classList.add('hidden');
        captureLocationBtn.classList.add('hidden');
        saveOrderBtn.classList.add('hidden');
        copyReceiptBtn.classList.add('hidden');
        if (modalTotalRow) modalTotalRow.classList.add('hidden');
        
        // Show history header
        modalHeaderHistory.classList.remove('hidden');
        modalInstruction.textContent = "Fetching your recent orders...";
        orderSummaryList.innerHTML = '<div class="loading-spinner"></div>';
        summaryTotalLabel.textContent = "₱0.00";
        
        // Show modal
        orderModal.classList.remove('hidden');
        orderModal.style.display = 'flex';

        try {
            // Fetch all orders from Supabase (ordered by time)
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (!data || data.length === 0) {
                orderSummaryList.innerHTML = '<p class="no-history">No recent orders found.</p>';
                modalInstruction.textContent = "Your order history is empty.";
                return;
            }

            modalInstruction.textContent = "Here are the most recent orders from Capribrews.";
            
            // Render orders list
            orderSummaryList.innerHTML = data.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-PH', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const statusClass = `status-${order.status || 'pending'}`;
                
                return `
                    <div class="history-item">
                        <div class="history-item-main">
                            <div class="history-item-info">
                                <span class="history-date">${date}</span>
                                <span class="history-name">${order.customer_name}</span>
                            </div>
                            <span class="history-status ${statusClass}">${order.status || 'pending'}</span>
                        </div>
                        <div class="history-item-details">
                            <div class="history-items-list">
                                ${order.items.map(item => {
                                    const sizeInfo = item.selectedSize && item.selectedSize !== 'Standard' ? ` (${item.selectedSize})` : '';
                                    return `<span>${item.quantity}x ${item.name}${sizeInfo}</span>`;
                                }).join(', ')}
                            </div>
                            <span class="history-price">₱${Number(order.total_price).toFixed(0)}</span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error fetching history:', err);
            orderSummaryList.innerHTML = '<p class="error-msg">Failed to load order history.</p>';
            modalInstruction.textContent = "Something went wrong. Please try again later.";
        }
    };

// ─── Order Modal ──────────────────────────────────────────────────────────────
const closeOrderModal = () => {
    orderModal.classList.add('hidden');
    orderModal.style.display = 'none';
    currentOrderData = null; // Reset
    // Reset modal state for next open
    modalHeaderHistory.classList.add('hidden');
    modalHeaderSuccess.classList.add('hidden');
    modalHeaderPreview.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

closeOrderModalBtn.addEventListener('click', closeOrderModal);
orderModal.addEventListener('click', (e) => { if (e.target === orderModal) closeOrderModal(); });

// ─── Cart Logic ───────────────────────────────────────────────────────────────
window.addToCart = (item, size, price, event) => {
    if (!item) {
        console.error('Cannot add undefined item to cart');
        return;
    }
    cart.push({ ...item, selectedSize: size, selectedPrice: price });
    updateCartUI();

    const btn = event?.target;
    if (btn?.classList.contains('add-to-cart-btn')) {
        const orig = btn.textContent;
        btn.textContent = 'Added ✓';
        btn.style.background = '#2a5641';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1500);
    }
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
    if (cart.length === 0) closeCart();
};

function updateCartUI() {
    const totalCount = cart.length;
    if (cartCount)    cartCount.textContent    = totalCount;
    if (cartCountNav) cartCountNav.textContent = totalCount;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.selectedPrice;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.selectedSize}</p>
            </div>
            <div class="cart-item-right">
                <span class="cart-item-price">₱${item.selectedPrice.toFixed(0)}</span>
                <button class="remove-item" onclick="removeFromCart(${index})" aria-label="Remove item">×</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalLabel.textContent = `₱${total.toFixed(0)}`;
    
    // Update sticky bar
    if (stickyBar) {
        stickyBar.classList.toggle('visible', cart.length > 0);
        if (stickyCountBar) stickyCountBar.textContent = totalCount;
        if (stickyTotalBar) stickyTotalBar.textContent = `₱${total.toFixed(0)}`;
    }
}

/**
 * Generates a formatted receipt string
 */
function generateReceiptText(customerName, groupedItems, total, orderType, deliveryAddress, coordinates) {
    const isDelivery = orderType === 'delivery';
    let text = `☕ CAPRIBREWS RECEIPT\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 Customer: ${customerName}\n`;
    text += `🛵 Type: ${isDelivery ? 'Delivery' : 'Dine-in'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    Object.values(groupedItems).forEach(item => {
        text += `• ${item.quantity}x ${item.name} (${item.selectedSize}) - ₱${item.selectedPrice.toFixed(0)}\n`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 TOTAL: ₱${total.toFixed(0)}\n`;
    
    if (isDelivery) {
        text += `📍 Landmark: ${deliveryAddress}\n`;
        if (coordinates && coordinates !== "Location not shared" && coordinates !== "Location not supported" && coordinates !== "N/A") {
            const cleanCoords = coordinates.replace(/\s/g, '');
            text += `🗺️ Maps: https://www.google.com/maps?q=${cleanCoords}.\n`;
        } else {
            text += `🗺️ Maps: Location not shared\n`;
        }
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Thank you for choosing Capribrews!`;
    return text;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Gets the user's current location
 */
async function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve("Location not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve(`${latitude}, ${longitude}`);
            },
            (error) => {
                console.warn("Location error:", error.message);
                resolve("Location not shared");
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    });
}

/**
 * Main checkout handler
 */
async function handleCheckout(e) {
    if (e) e.preventDefault();

    if (cart.length === 0) return;

    const customerNameInput = document.getElementById('customer-name-input');
    const customerName = customerNameInput?.value.trim();
    const orderType = document.querySelector('input[name="order-type"]:checked')?.value;
    const isDelivery = orderType === 'delivery';

    if (!customerName) {
        if (nameError) nameError.textContent = 'Please enter your name for the order!';
        customerNameInput?.focus();
        customerNameInput?.classList.add('input-error');
        return;
    }

    const deliveryAddressInput = document.getElementById('delivery-address-input');
    const deliveryAddress = deliveryAddressInput?.value.trim();
    
    if (isDelivery && !deliveryAddress) {
        if (nameError) nameError.textContent = 'Please provide a landmark for delivery!';
        deliveryAddressInput?.focus();
        return;
    }

    if (nameError) nameError.textContent = '';
    customerNameInput?.classList.remove('input-error');

    const currentCart = [...cart];
    const total = currentCart.reduce((sum, item) => sum + item.selectedPrice, 0);

    const groupedItems = currentCart.reduce((acc, item) => {
        const key = `${item.name}-${item.selectedSize}`;
        if (!acc[key]) {
            acc[key] = {
                name: item.name,
                selectedSize: item.selectedSize,
                selectedPrice: item.selectedPrice,
                quantity: 1
            };
        } else {
            acc[key].quantity += 1;
        }
        return acc;
    }, {});

    // Store order data for next steps
    currentOrderData = {
        customer_name: customerName,
        items: Object.values(groupedItems),
        total_price: total,
        order_type: orderType,
        delivery_address: isDelivery ? deliveryAddress : 'N/A',
        cartItems: currentCart,
        coordinates: 'N/A' 
    };

    // Show Preview Modal
    showOrderPreview(currentOrderData);
}

/**
 * Step 1: Display Receipt Preview
 */
function showOrderPreview(orderData) {
    const isDelivery = orderData.order_type === 'delivery';
    
    // Reset modal sections
    modalHeaderSuccess.classList.add('hidden');
    modalHeaderHistory?.classList.add('hidden');
    modalHeaderPreview.classList.remove('hidden');
    if (modalTotalRow) modalTotalRow.classList.remove('hidden');
    copyReceiptBtn?.classList.add('hidden');
    deliveryInfoPreview.classList.toggle('hidden', !isDelivery);
    
    // Configure buttons
    captureLocationBtn.classList.toggle('hidden', !isDelivery);
    saveOrderBtn.classList.remove('hidden'); 
    
    modalInstruction.textContent = isDelivery 
        ? "Review your delivery details. You can also capture your GPS location for better accuracy."
        : "Review your order details before confirming.";
    
    document.getElementById('preview-customer-name').textContent = orderData.customer_name;
    document.getElementById('preview-address').textContent = isDelivery ? orderData.delivery_address : "Dine-in Order";
    
    if (previewCoordsRow) previewCoordsRow.classList.toggle('hidden', !isDelivery);
    if (previewCoordinates) previewCoordinates.textContent = orderData.coordinates;
    
    orderSummaryList.innerHTML = orderData.cartItems.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.selectedSize})</span>
            <span>₱${item.selectedPrice.toFixed(0)}</span>
        </div>
    `).join('');
    
    summaryTotalLabel.textContent = `₱${orderData.total_price.toFixed(0)}`;

    // Configure actions
    if (isDelivery) {
        captureLocationBtn.disabled = false;
        captureLocationBtn.innerHTML = `📍 Capture My Location`;
        captureLocationBtn.onclick = async () => {
            captureLocationBtn.disabled = true;
            captureLocationBtn.innerHTML = `⌛ Pinpointing...`;
            const coords = await getUserLocation();
            currentOrderData.coordinates = coords;
            if (previewCoordinates) previewCoordinates.textContent = coords;
            captureLocationBtn.innerHTML = `📍 Location Captured`;
        };
    }

    saveOrderBtn.disabled = false;
    saveOrderBtn.innerHTML = `💾 Confirm Order`;
    saveOrderBtn.onclick = () => processFinalSave(orderData);
    
    if (modalError) modalError.textContent = '';
    
    orderModal.classList.remove('hidden');
    orderModal.style.display = 'flex';
}

/**
 * Step 2: Database Save & Receipt
 */
async function processFinalSave(orderData) {
    saveOrderBtn.disabled = true;
    saveOrderBtn.innerHTML = `<span>💾 Saving...</span>`;

    try {
        const { error } = await window.supabaseClient
            .from('orders')
            .insert([{
                customer_name: orderData.customer_name,
                items: orderData.items,
                total_price: orderData.total_price,
                status: 'pending',
                order_type: orderData.order_type,
                delivery_address: orderData.delivery_address,
                coordinates: orderData.coordinates
            }]);

        if (error) throw error;

        // Auto-copy receipt
        const receiptText = generateReceiptText(
            orderData.customer_name, 
            orderData.items, 
            orderData.total_price, 
            orderData.order_type, 
            orderData.delivery_address, 
            orderData.coordinates
        );
        await navigator.clipboard.writeText(receiptText);

        showOrderSuccess(orderData.total_price, orderData.cartItems, receiptText);

    } catch (err) {
        console.error("Save Error:", err);
        if (modalError) modalError.textContent = `Error: ${err.message}. Please try again.`;
    } finally {
        saveOrderBtn.disabled = false;
        saveOrderBtn.innerHTML = `💾 Confirm Order`;
    }
}

/**
 * Step 3: Success Screen
 */
function showOrderSuccess(total, cartItems, receiptText) {
    modalHeaderPreview.classList.add('hidden');
    // Show Success Header
    modalHeaderSuccess.classList.remove('hidden');
    modalTitle.textContent = "Order Sent!";
    captureLocationBtn.classList.add('hidden');
    saveOrderBtn.classList.add('hidden');
    if (modalTotalRow) modalTotalRow.classList.remove('hidden');
    
    // Configure buttons for success state
    copyReceiptBtn.classList.remove('hidden');
    
    modalInstruction.textContent = "Order Placed Successfully! Your receipt has been copied to the clipboard. Please show it at the counter.";

    copyReceiptBtn.onclick = async () => {
        await navigator.clipboard.writeText(receiptText);
        const orig = copyReceiptBtn.textContent;
        copyReceiptBtn.textContent = "Copied! ✓";
        setTimeout(() => copyReceiptBtn.textContent = orig, 2000);
    };

    // Reset Cart
    cart = [];
    document.getElementById('customer-name-input').value = '';
    const deliveryAddressInput = document.getElementById('delivery-address-input');
    if (deliveryAddressInput) deliveryAddressInput.value = '';
    updateCartUI();
    closeCart();

    orderSummaryList.innerHTML = cartItems.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.selectedSize})</span>
            <span>₱${item.selectedPrice.toFixed(0)}</span>
        </div>
    `).join('');
    summaryTotalLabel.textContent = `₱${total.toFixed(0)}`;
}

// Event Listeners
document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);
document.getElementById('customer-name-input')?.addEventListener('input', () => {
    if (nameError) nameError.textContent = '';
    document.getElementById('customer-name-input').classList.remove('input-error');
});
searchInput?.addEventListener('input', filterAndRenderItems);

    // Initial Load
    fetchMenuData();
});
