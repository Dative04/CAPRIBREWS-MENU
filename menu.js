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
const captureLocationBtn   = document.getElementById('captureLocationBtn');
const saveOrderBtn          = document.getElementById('saveOrderBtn');
const copyReceiptBtn       = document.getElementById('copyReceiptBtn');
const modalError           = document.getElementById('modal-error');
const modalHeaderSuccess   = document.getElementById('modal-header-success');
const modalHeaderPreview   = document.getElementById('modal-header-preview');
const deliveryInfoPreview  = document.getElementById('delivery-info-preview');
const modalInstruction     = document.getElementById('modal-instruction');
const previewCoordinates   = document.getElementById('preview-coordinates');
const previewCoordsRow     = document.getElementById('preview-coords-row');

let currentOrderData       = null; // Stores data between steps

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

/**
 * Generates a formatted receipt string
 */
function generateReceiptText(customerName, groupedItems, total, orderType, deliveryAddress, coordinates) {
    const isDelivery = orderType === 'delivery';
    let text = `☕ CAPIBREWS RECEIPT\n`;
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
    text += `Thank you for choosing Capibrews!`;
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
    
    modalHeaderSuccess.classList.add('hidden');
    modalHeaderPreview.classList.remove('hidden');
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
    modalHeaderSuccess.classList.remove('hidden');
    captureLocationBtn.classList.add('hidden');
    saveOrderBtn.classList.add('hidden');
    
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
