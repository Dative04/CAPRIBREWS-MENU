const menuGrid = document.getElementById('menu-grid');
const categoryTabs = document.getElementById('category-tabs');
const searchInput = document.getElementById('menu-search');
const mainHeader = document.getElementById('main-header');

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

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    filterAndRenderItems();
});

function filterAndRenderItems() {
    let filtered = allItems;
    
    if (currentCategory !== 'All') {
        filtered = filtered.filter(item => item.category === currentCategory);
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

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `menu-card ${item.available === false ? 'sold-out' : ''}`;
        card.style.animationDelay = `${index * 0.05}s`; // Staggered entry
        
        const isSoldOut = item.available === false;
        
        // Handle both single price and multiple sizes
        let priceHtml = '';
        if (item.prices && Object.keys(item.prices).length > 0) {
            priceHtml = `
                <div class="price-grid">
                    ${Object.entries(item.prices).map(([size, price]) => `
                        <div class="price-item">
                            <span class="size-label">${size}</span>
                            <span class="price-value">₱${typeof price === 'number' ? price.toFixed(0) : price}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            priceHtml = `
                <div class="price-single">
                    <span class="price-value">₱${typeof item.price === 'number' ? item.price.toFixed(0) : item.price}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'}" 
                     alt="${item.name}" 
                     class="card-img" 
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
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Initialize with local data immediately to prevent "Brewing..." hang
if (typeof initialMenuData !== 'undefined') {
    allItems = initialMenuData;
    renderTabs(allItems);
    filterAndRenderItems();
}

// Real-time listener with Local Fallback
if (typeof db !== 'undefined') {
    db.collection('items').orderBy('order', 'asc').onSnapshot(snapshot => {
        if (!snapshot.empty) {
            allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTabs(allItems);
            filterAndRenderItems();
        } else {
            console.log("Firestore is empty. Keeping local data.");
        }
    }, error => {
        console.warn("Firestore Error, staying with local data:", error);
    });
} else {
    console.warn("Firebase not initialized. Using local data.");
}
