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

// ─── Geolocation ───────────────────────────────────────────────────────────────
// Returns a Google Maps URL from coordinates
async function getLocationMapLink() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        resolve(mapLink);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
}

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

// ─── Order Modal ──────────────────────────────────────────────────────────────
const closeOrderModal = () => {
    orderModal.classList.add('hidden');
    orderModal.style.display = 'none';
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

// ─── Checkout ─────────────────────────────────────────────────────────────────
checkoutBtn.onclick = async () => {
    if (cart.length === 0) {
        console.warn('Checkout attempted with empty cart');
        return;
    }

    const customerNameInput = document.getElementById('customer-name-input');
    if (!customerNameInput) {
        console.error('Customer name input not found');
        return;
    }
    const customerName = customerNameInput.value.trim();

    if (!customerName) {
        if (nameError) {
            nameError.textContent = 'Please enter your name so we know who the order is for!';
        }
        customerNameInput?.focus();
        customerNameInput?.classList.add('input-error');
        return;
    }

    if (nameError) nameError.textContent = '';
    customerNameInput?.classList.remove('input-error');

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    try {
        // 1. Capture Location Map Link
        const mapLink = await getLocationMapLink();

        const currentCart = [...cart];
        
        // Group identical items for quantity
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

        const total = currentCart.reduce((sum, item) => sum + item.selectedPrice, 0);

        // 2. Add map_link to the order data
        const orderData = {
            customer_name: customerName,
            items: Object.values(groupedItems),
            total_price: total,
            status: 'pending',
            map_link: mapLink
        };

        const { error } = await window.supabaseClient
            .from('orders')
            .insert([orderData])
            .select();

        if (error) throw error;

        showOrderSuccess(total, mapLink, currentCart);

    } catch (err) {
        console.error('Order failed:', err);
        if (nameError) {
            nameError.textContent = 'Failed to send order. Check your connection and try again.';
            nameError.style.color = '#e63946';
        }
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Place Order';
    }
};

/**
 * Shows the success modal and configures the Messenger confirmation button
 */
function showOrderSuccess(total, mapLink, cartItems) {
    const messengerBtn = document.getElementById('messengerConfirmBtn');
    const fbPageId = "61580219733955";

    // 1. Configure Messenger Button
    if (messengerBtn) {
        const locationText = mapLink ? `My Location: ${mapLink}` : "Location: Not shared";
        
        const messageText = `Hi Capri Brews! 👋\n\n` + 
                            `Order Total: ₱${total.toFixed(0)}\n` + 
                            `${locationText}\n\n` + 
                            `Please confirm my order!`;

        const messengerUrl = `https://m.me/${fbPageId}?text=${encodeURIComponent(messageText)}`;
        
        messengerBtn.onclick = () => window.open(messengerUrl, '_blank');
    }

    // 2. Update Success Modal UI
    orderSummaryList.innerHTML = cartItems.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.selectedSize})</span>
            <span>₱${item.selectedPrice.toFixed(0)}</span>
        </div>
    `).join('');

    summaryTotalLabel.textContent = `₱${total.toFixed(0)}`;
    
    // 3. Reset Cart
    cart = [];
    const customerNameInput = document.getElementById('customer-name-input');
    if (customerNameInput) customerNameInput.value = '';
    updateCartUI();
    closeCart();

    // 4. Show Modal
    orderModal.classList.remove('hidden');
    orderModal.style.display = 'flex';
}

// ─── Helper Functions ───────────────────────────────────────────────────────

async function getLocationMapLink() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve("Location not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve(`https://www.google.com/maps?q=${latitude},${longitude}`);
            },
            (error) => {
                console.warn("Location error:", error);
                resolve("Location not shared");
            },
            { timeout: 10000 }
        );
    });
}

// Clear error state when user types
document.getElementById('customer-name-input')?.addEventListener('input', () => {
    if (nameError) nameError.textContent = '';
    document.getElementById('customer-name-input').classList.remove('input-error');
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
