const menuGrid = document.getElementById('menu-grid');
const categoryTabs = document.getElementById('category-tabs');
const searchInput = document.getElementById('menu-search');
const mainHeader = document.getElementById('main-header');

// Cart State
let cart = [];
const cartFab = document.getElementById('cart-fab');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalLabel = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const closeCartBtn = document.getElementById('close-cart');
const orderModal = document.getElementById('order-modal');
const closeOrderModalBtn = document.getElementById('close-order-modal');
const orderSummaryList = document.getElementById('order-summary-list');
const summaryTotalLabel = document.getElementById('summary-total');

const cartCountNav = document.getElementById('cart-count-nav');

// Toggle Side Menu
window.toggleMenu = () => {
    const drawer = document.getElementById('side-drawer');
    drawer.classList.toggle('open');
};

// Toggle Cart Drawer
window.toggleCart = () => {
    cartDrawer.classList.toggle('hidden');
};

// Global Category Filter for Drawer
window.filterByCategory = (cat) => {
    currentCategory = cat;
    renderTabs(allItems);
    filterAndRenderItems();
    
    // Smooth scroll to menu grid
    const menuSection = document.getElementById('menu-grid');
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Cart Interactions
cartFab.onclick = () => cartDrawer.classList.toggle('hidden');
closeCartBtn.onclick = () => cartDrawer.classList.add('hidden');

// FIXED: Use a more robust close logic for the order modal
const closeOrderModal = () => {
    console.log("Closing order modal...");
    orderModal.classList.add('hidden');
    orderModal.style.display = 'none'; // Force hide inline
    // Force a scroll to top to refresh the view
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

closeOrderModalBtn.addEventListener('click', closeOrderModal);
// Also close if clicking the backdrop
orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) closeOrderModal();
});

function addToCart(item, size, price, event) {
    cart.push({ ...item, selectedSize: size, selectedPrice: price });
    updateCartUI();
    showCartFAB();
    
    // Success feedback on the button
    const btn = event?.target;
    if (btn && btn.classList.contains('add-to-cart-btn')) {
        const originalText = btn.textContent;
        btn.textContent = 'Added! ✓';
        btn.style.backgroundColor = 'var(--accent-light)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 1500);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    if (cart.length === 0) cartDrawer.classList.add('hidden');
}

function updateCartUI() {
    const totalCount = cart.length;
    if (cartCount) cartCount.textContent = totalCount;
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
                <button class="remove-item" onclick="removeFromCart(${index})">×</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });
    
    cartTotalLabel.textContent = `₱${total.toFixed(0)}`;
    
    if (cart.length > 0) {
        cartFab.classList.remove('hidden');
    } else {
        cartFab.classList.add('hidden');
    }
}

function showCartFAB() {
    cartFab.classList.remove('hidden');
    cartFab.style.transform = 'scale(1.2)';
    setTimeout(() => cartFab.style.transform = 'scale(1)', 200);
}

checkoutBtn.onclick = async () => {
    if (cart.length === 0) return;
    
    const customerNameInput = document.getElementById('customer-name-input');
    const customerName = customerNameInput ? customerNameInput.value.trim() : "";

    if (!customerName) {
        alert("Please enter your name so we know who the order is for!");
        customerNameInput?.focus();
        return;
    }
    
    const currentCart = [...cart]; // Copy for summary
    const total = currentCart.reduce((sum, item) => sum + item.selectedPrice, 0);
    
    // Construct Order object for Supabase
    const orderData = {
        customer_name: customerName,
        items: currentCart.map(item => ({
            id: item.id,
            name: item.name,
            selectedSize: item.selectedSize,
            selectedPrice: item.selectedPrice
        })),
        total_price: total,
        status: 'pending'
    };
    
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';
    
    try {
        // Use Supabase to place the order
        const { data, error } = await window.supabaseClient
            .from('orders')
            .insert([orderData])
            .select();

        if (error) throw error;

        console.log("Order successfully saved to Supabase:", data);
        
        // Show Summary in Modal
        orderSummaryList.innerHTML = currentCart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.selectedSize})</span>
                <span>₱${item.selectedPrice.toFixed(0)}</span>
            </div>
        `).join('');
        summaryTotalLabel.textContent = `₱${total.toFixed(0)}`;
        
        // Reset Cart
        cart = [];
        if (customerNameInput) customerNameInput.value = '';
        updateCartUI();
        cartDrawer.classList.add('hidden');
        orderModal.classList.remove('hidden');
        orderModal.style.display = 'flex';

    } catch (error) {
        console.error("CRITICAL: Order persistence failed:", error);
        alert('Failed to send order to database. Please check your internet connection and try again.');
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Place Order';
    }
};

let allItems = [];
let currentCategory = 'All';
let searchTerm = '';

// Scroll-Hide Logic (Headroom style)
let lastScrollY = window.scrollY;
const scrollThreshold = 10;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const headerHeight = mainHeader.offsetHeight;

    // Add 'scrolled' class for border/shadow
    if (currentScrollY > 20) {
        mainHeader.classList.add('scrolled');
    } else {
        mainHeader.classList.remove('scrolled');
    }

    if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) return;

    if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
        // Scrolling Down - Hide Header
        mainHeader.classList.add('header-hidden');
    } else if (currentScrollY < lastScrollY) {
        // Scrolling Up - Show Header
        mainHeader.classList.remove('header-hidden');
    }
    lastScrollY = currentScrollY;
});

function renderTabs(items) {
    const categories = ['All', ...new Set(items.map(item => item.category))];
    categoryTabs.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${currentCategory === cat ? 'active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => {
            currentCategory = cat;
            renderTabs(items);
            filterAndRenderItems();
        };
        categoryTabs.appendChild(btn);
    });
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce((e) => {
    searchTerm = e.target.value.toLowerCase();
    filterAndRenderItems();
}, 250);

searchInput.addEventListener('input', debouncedSearch);

function filterAndRenderItems() {
    let filtered = allItems;
    
    if (currentCategory !== 'All') {
        filtered = filtered.filter(item => 
            item.category && item.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderItems(filtered);
}

function renderItems(items) {
    menuGrid.innerHTML = '';

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="loading-state"><p>No items found.</p></div>';
        return;
    }

    // Grouping Logic
    if (currentCategory === 'All') {
        const groups = items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        Object.entries(groups).forEach(([category, catItems]) => {
            const section = document.createElement('div');
            section.className = 'category-section';
            section.innerHTML = `<h2 class="category-title">${category}</h2>`;
            const grid = document.createElement('div');
            grid.className = 'item-grid';
            catItems.forEach((item, index) => {
                grid.appendChild(createItemCard(item, index));
            });
            section.appendChild(grid);
            menuGrid.appendChild(section);
        });
    } else {
        const grid = document.createElement('div');
        grid.className = 'item-grid';
        items.forEach((item, index) => {
            grid.appendChild(createItemCard(item, index));
        });
        menuGrid.appendChild(grid);
    }
}

function createItemCard(item, index) {
    const card = document.createElement('div');
    card.className = `menu-card ${item.available === false ? 'sold-out' : ''}`;
    card.style.animationDelay = `${index * 0.05}s`;
    
    const isSoldOut = item.available === false;
    
    // Image Fallback Logic
    const placeholderImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400';
    const itemImage = item.image || item.image_url || placeholderImage;
    
    let priceHtml = '';
    let addBtnHtml = '';

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
            </div>
        `;
        addBtnHtml = `<button class="add-to-cart-btn" onclick="handleAddToCart('${item.id}', event)">Add to Order</button>`;
    } else {
        const price = Number(item.price || 0);
        priceHtml = `
            <div class="price-single">
                <span class="price-value">₱${price.toFixed(0)}</span>
            </div>
        `;
        addBtnHtml = `<button class="add-to-cart-btn" onclick="addToCart({id: '${item.id}', name: '${item.name}'}, 'Standard', ${price}, event)">Add to Order</button>`;
    }

    card.innerHTML = `
        <div class="card-img-wrapper">
            <img src="${itemImage}" 
                 alt="${item.name}" 
                 class="card-img" 
                 onerror="this.src='${placeholderImage}'; this.onerror=null;"
                 onload="this.classList.add('loaded')">
            ${isSoldOut ? '<div class="sold-out-overlay"><span class="sold-out-tag">SOLD OUT</span></div>' : ''}
        </div>
        <div class="card-content">
            <div class="card-header">
                <h3 class="card-title">${item.name}</h3>
                <div class="dietary-icons">
                    ${item.dietary?.includes('vegan') ? '<span class="dietary-dot v-dot" title="Vegan"></span>' : ''}
                    ${item.dietary?.includes('gf') ? '<span class="dietary-dot gf-dot" title="Gluten Free"></span>' : ''}
                </div>
            </div>
            <p class="card-desc">${item.description || 'Crafted with premium ingredients for the perfect sip.'}</p>
            ${priceHtml}
            ${!isSoldOut ? addBtnHtml : ''}
        </div>
    `;
    return card;
}

// Global handler for complex add to cart
window.handleAddToCart = (itemId, event) => {
    const selectedRadio = document.querySelector(`input[name="size-${itemId}"]:checked`);
    if (selectedRadio) {
        const item = allItems.find(i => i.id === itemId);
        const size = selectedRadio.value;
        const price = parseFloat(selectedRadio.dataset.price);
        addToCart(item, size, price, event);
    }
};
window.removeFromCart = removeFromCart; // Expose to global scope

// Initialize with local data immediately to prevent "Brewing..." hang
if (typeof initialMenuData !== 'undefined') {
    allItems = initialMenuData;
    renderTabs(allItems);
    filterAndRenderItems();
}

// Real-time listener with Local Fallback for Supabase
async function displayMenu() {
    if (typeof window.supabaseClient === 'undefined') {
        console.warn("Supabase not initialized. Using local data.");
        return;
    }

    console.log("Fetching menu items from Supabase...");
    const { data, error } = await window.supabaseClient
        .from('menu')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.warn("Supabase Fetch Error, staying with local data:", error);
        return;
    }

    if (data && data.length > 0) {
        // Map Supabase fields back to internal format
        allItems = data.map(item => ({
            ...item,
            image: item.image_url // internal logic uses .image
        }));
        renderTabs(allItems);
        filterAndRenderItems();
    }
}

// Initialize Supabase Logic
if (typeof window.supabaseClient !== 'undefined') {
    // 1. Initial fetch
    displayMenu();

    // 2. Real-time updates - Instant sync when Admin changes something
    window.supabaseClient
        .channel('menu-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, payload => {
            console.log('Menu updated by Admin! Syncing...');
            displayMenu(); 
        })
        .subscribe();
} else {
    // Fallback to local data if Supabase is unavailable
    if (typeof initialMenuData !== 'undefined') {
        allItems = initialMenuData;
        renderTabs(allItems);
        filterAndRenderItems();
    }
}