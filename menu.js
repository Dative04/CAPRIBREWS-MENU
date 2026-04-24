const menuGrid = document.getElementById('menu-grid');
const categoryTabs = document.getElementById('category-tabs');

let allItems = [];
let currentCategory = 'All';

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

function filterAndRenderItems() {
    const filtered = currentCategory === 'All' 
        ? allItems 
        : allItems.filter(item => item.category === currentCategory);
    
    renderItems(filtered);
}

function renderItems(items) {
    menuGrid.innerHTML = '';

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="loading-state"><p>No items found in this category.</p></div>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        
        const isSoldOut = item.available === false;
        const prices = item.prices || (item.price ? { "Standard": item.price } : {});
        const firstPrice = Object.values(prices)[0];

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'}" 
                     alt="${item.name}" 
                     class="card-img" 
                     onload="this.classList.add('loaded')">
                ${isSoldOut ? '<div class="sold-out-overlay"><span class="sold-out-tag">SOLD OUT</span></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.description || 'Crafted with premium ingredients for the perfect sip.'}</p>
                <div class="card-footer">
                    <span class="card-price">₱${typeof firstPrice === 'number' ? firstPrice.toFixed(2) : firstPrice}</span>
                    <div class="dietary-icons">
                        ${item.dietary?.includes('vegan') ? '<span class="dietary-dot v-dot" title="Vegan"></span>' : ''}
                        ${item.dietary?.includes('gf') ? '<span class="dietary-dot gf-dot" title="Gluten Free"></span>' : ''}
                    </div>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Real-time listener
if (typeof db !== 'undefined') {
    db.collection('items').onSnapshot(snapshot => {
        allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTabs(allItems);
        filterAndRenderItems();
    }, error => {
        console.error("Firestore Error:", error);
        menuGrid.innerHTML = `<div class="loading-state"><p style="color: #ff4d4d">Error: ${error.message}</p></div>`;
    });
} else {
    menuGrid.innerHTML = '<div class="loading-state"><p style="color: #ff4d4d">Firebase not initialized. Check config.</p></div>';
}