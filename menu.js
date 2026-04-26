const menuGrid          = document.getElementById('menu-grid');
const searchInput       = document.getElementById('menu-search');
const mainHeader        = document.getElementById('main-header');

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

// ─── Side Drawer Toggle ───────────────────────────────────────────────────────
window.toggleMenu = () => {
    const drawer   = document.getElementById('side-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const isOpen   = drawer.classList.toggle('open');
    backdrop?.classList.toggle('visible', isOpen);
};

// ─── Messenger Link ────────────────────────────────────────────────────────────
function buildMessengerLink(totalPrice, mapLink) {
  const message = `☕ New Order Confirmation\n\nTotal: ₱${totalPrice.toFixed(0)}\n${mapLink ? `Location: ${mapLink}` : 'Location: Not shared'}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://m.me/61580219733955?text=${encodedMessage}`;
}

// ─── Cart Toggle ──────────────────────────────────────────────────────────────
window.toggleCart = () => {
    const isHidden = cartDrawer.classList.toggle('hidden');
    cartBackdrop?.classList.toggle('hidden', isHidden);
};

const openCart = () => {
    cartDrawer.classList.remove('hidden');
    cartBackdrop?.classList.remove('hidden');
};

const closeCart = () => {
    cartDrawer.classList.add('hidden');
    cartBackdrop?.classList.add('hidden');
};

cartFab.onclick       = openCart;
closeCartBtn.onclick  = closeCart;

window.filterByCategory = (category) => {
    currentCategory = category;
    filterAndRenderItems();
};

// ─── Order Modal State & Elements ───────────────────────────────────────────
const confirmLocationBtn = document.getElementById('confirmLocationBtn');
const messengerConfirmBtn = document.getElementById('messengerConfirmBtn');
const copyReceiptBtn = document.getElementById('copyReceiptBtn');
const modalHeaderSuccess = document.getElementById('modal-header-success');
const modalHeaderPreview = document.getElementById('modal-header-preview');
const deliveryInfoPreview = document.getElementById('delivery-info-preview');
const modalInstruction = document.getElementById('modal-instruction');

let currentOrderData = null; // Stores data between steps

// ─── Order Modal ──────────────────────────────────────────────────────────────
const closeOrderModal = () => {
    orderModal.classList.add('hidden');
    orderModal.style.display = 'none';
    currentOrderData = null; // Reset
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

closeOrderModalBtn.addEventListener('click', closeOrderModal);
orderModal.addEventListener('click', (e) => { if (e.target === orderModal) closeOrderModal(); });

// ─── Cart Logic ───────────────────────────────────────────────────────────────
function addToCart(item, size, price, event) {
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
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    if (cart.length === 0) closeCart();
}

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
    cartFab.classList.toggle('hidden', cart.length === 0);
}

function showCartFAB() {
    cartFab.classList.remove('hidden');
    cartFab.style.transform = 'scale(1.2)';
    setTimeout(() => cartFab.style.transform = '', 200);
}

/**
 * Generates a formatted receipt string for Messenger or Clipboard
 */
function generateReceiptText(customerName, groupedItems, total, orderType, deliveryAddress, mapLink) {
    const isDelivery = orderType === 'delivery';
    let text = `Capibrews Receipt\n`;
    text += `Order Type: ${isDelivery ? '🛵 Delivery' : '🏠 Dine-in'}\n`;
    text += `Customer: ${customerName}\n`;
    text += `------------------\n`;
    
    Object.values(groupedItems).forEach(item => {
        text += `${item.quantity}x ${item.name} (${item.selectedSize}) - ₱${item.selectedPrice.toFixed(0)}\n`;
    });
    
    text += `------------------\n`;
    text += `Total: ₱${total.toFixed(0)}\n`;
    
    if (isDelivery) {
        text += `Landmark: ${deliveryAddress}\n`;
        if (mapLink) text += `Location: ${mapLink}\n`;
        else text += `Location: Not shared via GPS\n`;
    }
    
    text += `\nPlease confirm my order!`;
    return text;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Gets the user's current location and returns a Google Maps link.
 * Falls back to 'Location not shared' if permission is denied.
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
                // Reliable pin drop format: https://www.google.com/maps?q=${lat},${long}.
                resolve(`https://www.google.com/maps?q=${latitude},${longitude}.`);
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
 * Main checkout handler - processes both Dine-in and Delivery
 * For Delivery, it triggers Step 1: Receipt Preview
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
        cartItems: currentCart
    };

    if (isDelivery) {
        // Step 1: Show Receipt Preview for Delivery
        showOrderPreview(currentOrderData);
    } else {
        // Direct processing for Dine-in
        processDineInOrder(currentOrderData);
    }
}

/**
 * Step 1: Shows the Receipt Preview modal for Delivery orders
 */
function showOrderPreview(orderData) {
    // 1. Set Modal to Preview Mode
    modalHeaderSuccess.classList.add('hidden');
    modalHeaderPreview.classList.remove('hidden');
    deliveryInfoPreview.classList.remove('hidden');
    confirmLocationBtn.classList.remove('hidden');
    messengerConfirmBtn.classList.add('hidden');
    modalInstruction.textContent = "Please confirm your details. Clicking the button below will ask for your location to ensure accurate delivery.";
    
    // 2. Populate Preview Data
    document.getElementById('preview-customer-name').textContent = orderData.customer_name;
    document.getElementById('preview-address').textContent = orderData.delivery_address;
    
    orderSummaryList.innerHTML = orderData.cartItems.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.selectedSize})</span>
            <span>₱${item.selectedPrice.toFixed(0)}</span>
        </div>
    `).join('');
    summaryTotalLabel.textContent = `₱${orderData.total_price.toFixed(0)}`;

    // 3. Configure Buttons
    confirmLocationBtn.onclick = () => handleDeliveryStep2();
    
    // 4. Show Modal
    orderModal.classList.remove('hidden');
    orderModal.style.display = 'flex';
}

/**
 * Step 2: Location Trigger - Only called after user confirms preview
 */
async function handleDeliveryStep2() {
    if (!currentOrderData) return;

    // Loading State
    confirmLocationBtn.disabled = true;
    confirmLocationBtn.innerHTML = `<span>⌛ Pinpointing GPS...</span>`;

    try {
        // Trigger Geolocation API
        const mapLink = await getUserLocation();
        currentOrderData.coordinates = mapLink;

        // Move to Step 3: Database & Messenger
        await processDeliveryStep3(currentOrderData);

    } catch (err) {
        console.error("Step 2 Error:", err);
        alert("Could not get location. You can still proceed with manual address.");
        currentOrderData.coordinates = "Location not shared";
        await processDeliveryStep3(currentOrderData);
    } finally {
        confirmLocationBtn.disabled = false;
        confirmLocationBtn.innerHTML = `📍 Confirm & Send Location`;
    }
}

/**
 * Step 3: Database & Messenger - Final step for Delivery
 */
async function processDeliveryStep3(orderData) {
    try {
        confirmLocationBtn.innerHTML = `<span>💾 Saving Order...</span>`;

        // 1. Save to Supabase
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

        // 2. Generate Receipt Text
        const receiptText = generateReceiptText(
            orderData.customer_name, 
            orderData.items, 
            orderData.total_price, 
            orderData.order_type, 
            orderData.delivery_address, 
            orderData.coordinates
        );

        // 3. Update Modal to Success Mode
        showOrderSuccess(orderData.total_price, orderData.coordinates, orderData.cartItems, true, receiptText);

        // 4. Automatic Messenger Redirect
        const fbPageId = "61580219733955";
        const messengerUrl = `https://m.me/${fbPageId}?text=${encodeURIComponent(receiptText)}`;
        window.open(messengerUrl, '_blank');

    } catch (err) {
        console.error("Step 3 Error:", err);
        if (nameError) nameError.textContent = `Error: ${err.message}`;
    }
}

/**
 * Processes Dine-in orders directly
 */
async function processDineInOrder(orderData) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    try {
        const { error } = await window.supabaseClient
            .from('orders')
            .insert([{
                customer_name: orderData.customer_name,
                items: orderData.items,
                total_price: orderData.total_price,
                status: 'pending',
                order_type: orderData.order_type,
                delivery_address: 'N/A',
                coordinates: 'N/A'
            }]);

        if (error) throw error;

        const receiptText = generateReceiptText(orderData.customer_name, orderData.items, orderData.total_price, orderData.order_type, 'N/A', 'N/A');
        showOrderSuccess(orderData.total_price, 'N/A', orderData.cartItems, false, receiptText);

    } catch (err) {
        console.error("Dine-in Error:", err);
        if (nameError) nameError.textContent = `Error: ${err.message}`;
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Place Order';
    }
}

/**
 * Shows the success modal and configures the Messenger confirmation button
 */
function showOrderSuccess(total, mapLink, cartItems, isDelivery = false, receiptText = '') {
    // 1. Set Modal to Success Mode
    modalHeaderPreview.classList.add('hidden');
    modalHeaderSuccess.classList.remove('hidden');
    confirmLocationBtn.classList.add('hidden');
    deliveryInfoPreview.classList.toggle('hidden', !isDelivery);
    modalInstruction.textContent = isDelivery 
        ? "Your order has been recorded! We've opened Messenger so you can send your receipt to our team."
        : "Please proceed to the counter and show this screen to pay and collect your order.";

    // 2. Configure Messenger Button
    if (messengerConfirmBtn) {
        const fbPageId = "61580219733955";
        const messengerUrl = `https://m.me/${fbPageId}?text=${encodeURIComponent(receiptText)}`;
        messengerConfirmBtn.onclick = () => window.open(messengerUrl, '_blank');
        messengerConfirmBtn.classList.toggle('hidden', !isDelivery);
    }

    // 3. Configure Copy Button
    if (copyReceiptBtn) {
        copyReceiptBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(receiptText);
                const originalText = copyReceiptBtn.textContent;
                copyReceiptBtn.innerHTML = '📋 Copied!';
                setTimeout(() => copyReceiptBtn.innerHTML = '📋 Copy Receipt to Clipboard', 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        };
    }

    // 4. Update Order Summary
    orderSummaryList.innerHTML = cartItems.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.selectedSize})</span>
            <span>₱${item.selectedPrice.toFixed(0)}</span>
        </div>
    `).join('');
    summaryTotalLabel.textContent = `₱${total.toFixed(0)}`;
    
    // 5. Reset Cart & UI
    cart = [];
    const customerNameInput = document.getElementById('customer-name-input');
    const deliveryAddressInput = document.getElementById('delivery-address-input');
    if (customerNameInput) customerNameInput.value = '';
    if (deliveryAddressInput) deliveryAddressInput.value = '';
    updateCartUI();
    closeCart();

    // 6. Final Show Modal
    orderModal.classList.remove('hidden');
    orderModal.style.display = 'flex';
}

// Clear error state when user types
document.getElementById('customer-name-input')?.addEventListener('input', () => {
    if (nameError) nameError.textContent = '';
    document.getElementById('customer-name-input').classList.remove('input-error');
});

// ─── Order Type Selection ─────────────────────────────────────────────────────
const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
const deliveryAddressContainer = document.getElementById('delivery-address-container');

orderTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isDelivery = e.target.value === 'delivery';
        
        // 1. Toggle address field
        deliveryAddressContainer?.classList.toggle('hidden', !isDelivery);
        
        // 2. Update checkout button text and icon
        if (checkoutBtn) {
            const messengerSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 8px; vertical-align: middle;">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.464 5.503 3.746 7.158V22l3.43-1.881c.882.244 1.815.378 2.824.378 5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.286 12.355l-2.571-2.742-5.02 2.742 5.514-5.855 2.572 2.742 5.018-2.742-5.513 5.855z"/>
                </svg>`;
            
            checkoutBtn.innerHTML = isDelivery ? `${messengerSvg} Send via Messenger` : 'Place Order';
            checkoutBtn.classList.toggle('btn-messenger', isDelivery);
        }
        
        // 3. Optional: Request location early if delivery
        if (isDelivery) {
            // Trigger a quiet location request to warm up the GPS
            navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { timeout: 1000 });
        }
    });
});

// ─── Menu State ───────────────────────────────────────────────────────────────
let allItems = [];
let currentCategory = 'All';
let searchTerm = '';

// ─── Scroll Header Hide ───────────────────────────────────────────────────────
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 20) {
        mainHeader.classList.add('scrolled');
    } else {
        mainHeader.classList.remove('scrolled');
    }
    if (Math.abs(currentScrollY - lastScrollY) < 10) return;
    if (currentScrollY > lastScrollY && currentScrollY > mainHeader.offsetHeight) {
        mainHeader.classList.add('header-hidden');
    } else if (currentScrollY < lastScrollY) {
        mainHeader.classList.remove('header-hidden');
    }
    lastScrollY = currentScrollY;
});

// ─── Search ───────────────────────────────────────────────────────────────────
function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

searchInput.addEventListener('input', debounce((e) => {
    searchTerm = e.target.value.toLowerCase();
    filterAndRenderItems();
}, 250));

function filterAndRenderItems() {
    let filtered = allItems;
    if (currentCategory !== 'All') {
        filtered = filtered.filter(item =>
            item.category?.toLowerCase() === currentCategory.toLowerCase()
        );
    }
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description?.toLowerCase().includes(searchTerm))
        );
    }
    renderItems(filtered);
}

// ─── Render Items ─────────────────────────────────────────────────────────────
function renderItems(items) {
    menuGrid.innerHTML = '';

    if (items.length === 0) {
        menuGrid.classList.remove('accordion-mode');
        menuGrid.classList.remove('item-grid');
        menuGrid.innerHTML = `
            <div class="loading-state">
                <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;">☕</div>
                <p>No items found. Try a different search or category.</p>
            </div>`;
        return;
    }

    if (currentCategory === 'All') {
        menuGrid.classList.remove('item-grid');
        menuGrid.classList.add('accordion-mode');
        const groups = items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        Object.entries(groups).forEach(([category, catItems], index) => {
            const details = document.createElement('details');
            details.className = 'category-accordion';
            // Open the first category by default
            if (index === 0 && !searchTerm) details.open = true;

            details.innerHTML = `
                <summary class="category-summary">
                    <h2 class="category-title">${category}</h2>
                    <span class="category-count">${catItems.length} items</span>
                    <span class="accordion-icon">▾</span>
                </summary>
            `;
            
            const grid = document.createElement('div');
            grid.className = 'item-grid';
            catItems.forEach((item, i) => grid.appendChild(createItemCard(item, i)));
            
            details.appendChild(grid);
            menuGrid.appendChild(details);
        });
    } else {
        menuGrid.classList.remove('accordion-mode');
        // Ensure menuGrid itself acts as the grid for item cards
        menuGrid.classList.add('item-grid');
        items.forEach((item, i) => menuGrid.appendChild(createItemCard(item, i)));
    }
}

function createItemCard(item, index) {
    const card = document.createElement('div');
    card.className = `menu-card${item.available === false ? ' sold-out' : ''}`;
    card.style.animationDelay = `${index * 0.05}s`;

    const isSoldOut = item.available === false;
    const placeholder = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400';
    const itemImage = item.image || item.image_url || placeholder;

    let priceHtml = '';
    let addBtnHtml = '';
    const qtySelectorHtml = `
        <div class="qty-selector">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
            <input type="number" id="qty-${item.id}" class="qty-input" value="1" min="1" readonly>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
        </div>
    `;

    if (item.prices && Object.keys(item.prices).length > 0) {
        const sizes = Object.entries(item.prices);
        priceHtml = `
            <div class="price-grid">
                ${sizes.map(([size, price], i) => `
                    <div class="price-item">
                        <label class="size-selector">
                            <input type="radio" name="size-${item.id}" value="${size}" data-price="${price}" ${i === 0 ? 'checked' : ''}>
                            <span class="size-pill">
                                <span class="size-label">${size}</span>
                                <span class="price-value">₱${Number(price).toFixed(0)}</span>
                            </span>
                        </label>
                    </div>
                `).join('')}
            </div>`;
        addBtnHtml = `<button class="add-to-cart-btn" onclick="handleAddToCart('${item.id}', event)">Add to Order</button>`;
    } else {
        const price = Number(item.price || 0);
        priceHtml = `
            <div class="price-single">
                <span class="price-value">₱${price.toFixed(0)}</span>
            </div>`;
        // Pass item ID to handleAddToCart for consistency, or we can pass a simplified object
        addBtnHtml = `<button class="add-to-cart-btn" onclick="handleAddToCart('${item.id}', event)">Add to Order</button>`;
    }

    const tempTag = item.temp && item.temp !== 'both' 
        ? `<span class="temp-tag-mini ${item.temp}">${item.temp.toUpperCase()}</span>` 
        : '';

    card.innerHTML = `
        <div class="card-img-wrapper">
            <img src="${itemImage}" alt="${item.name}" class="card-img"
                 onerror="this.src='${placeholder}'; this.onerror=null;"
                 onload="this.classList.add('loaded')">
            ${isSoldOut ? '<div class="sold-out-overlay"><span class="sold-out-tag">SOLD OUT</span></div>' : ''}
        </div>
        <div class="card-content">
            <div class="card-header">
                <h3 class="card-title">${item.name} ${tempTag}</h3>
                <div class="dietary-icons">
                    ${item.dietary?.includes('vegan') ? '<span class="dietary-dot v-dot" title="Vegan">🌱</span>' : ''}
                    ${item.dietary?.includes('gluten-free') ? '<span class="dietary-dot gf-dot" title="Gluten Free">🌾</span>' : ''}
                </div>
            </div>
            <p class="card-desc">${item.description || 'Crafted with premium ingredients for the perfect sip.'}</p>
            ${priceHtml}
            ${!isSoldOut ? qtySelectorHtml + addBtnHtml : ''}
        </div>
    `;
    return card;
}

window.changeQty = (itemId, delta) => {
    const input = document.getElementById(`qty-${itemId}`);
    if (input) {
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        input.value = val;
    }
};

window.handleAddToCart = (itemId, event) => {
    const item = allItems.find(i => String(i.id) === String(itemId));
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }

    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    let size = 'Standard';
    let price = item.price || 0;

    const selected = document.querySelector(`input[name="size-${itemId}"]:checked`);
    if (selected) {
        size = selected.value;
        price = parseFloat(selected.dataset.price);
    }
    
    // Add to cart 'quantity' times
    for (let i = 0; i < quantity; i++) {
        addToCart(item, size, price, event);
    }
    
    // Reset quantity to 1 after adding
    if (qtyInput) qtyInput.value = 1;
};

window.removeFromCart = removeFromCart;

// ─── Initialize ───────────────────────────────────────────────────────────────
if (typeof initialMenuData !== 'undefined') {
    // Ensure local data has IDs for cart logic
    allItems = initialMenuData.map((item, idx) => ({
        id: 'local-' + idx,
        ...item
    }));
    filterAndRenderItems();
}

async function displayMenu() {
    if (typeof window.supabaseClient === 'undefined') return;

    const { data, error } = await window.supabaseClient
        .from('menu')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) { console.warn('Supabase menu fetch error, using local data:', error); return; }

    if (data?.length > 0) {
        // Items from DB already have IDs
        allItems = data.map(item => ({ ...item, image: item.image_url }));
        filterAndRenderItems();
    }
}

if (typeof window.supabaseClient !== 'undefined') {
    displayMenu();
    window.supabaseClient
        .channel('menu-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => displayMenu())
        .subscribe();
}
