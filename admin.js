const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminGrid = document.getElementById('admin-grid');
const statCount = document.getElementById('stat-count');
const statCats = document.getElementById('stat-cats');

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
        loadAdminData();
    } else {
        loginScreen.classList.remove('hidden');
        adminScreen.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        loginError.textContent = 'Access Denied: Invalid Credentials';
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
        image: document.getElementById('new-image').value,
        dietary: dietary,
        available: true,
        order: Date.now()
    };

    if (priceTypeSelect.value === 'single') {
        newItem.price = parseFloat(document.getElementById('new-price').value);
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
    }

    try {
        await db.collection('items').add(newItem);
        addModal.classList.add('hidden');
        addItemForm.reset();
        showToast('Item created successfully');
    } catch (error) {
        showToast('Error creating item');
    }
});

function loadAdminData() {
    db.collection('items').orderBy('order', 'desc').onSnapshot(snapshot => {
        currentItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateStats(currentItems);
        renderAdminGrid(currentItems);
    });
}

// Data Seeding Utility (Run once)
window.seedMenuData = async () => {
    const menuData = [
        {
            name: "Classic Americano",
            category: "COFFEE SELECTION",
            description: "Smooth and bold espresso with hot water.",
            prices: { "8oz": 79, "12oz": 89, "16oz": 99 },
            available: true,
            order: 1
        },
        {
            name: "Caffè Latte",
            category: "COFFEE SELECTION",
            description: "Espresso with steamed milk and a thin layer of foam.",
            prices: { "8oz": 89, "12oz": 99, "16oz": 109 },
            available: true,
            order: 2
        },
        {
            name: "Espresso Chips Frappe",
            category: "FRAPPE",
            description: "Coffee-based frappe with chocolate chips.",
            prices: { "16oz": 129, "22oz": 139 },
            available: true,
            order: 3
        },
        {
            name: "Choco Crunch Frappe",
            category: "FRAPPE",
            description: "Rich chocolate blended with ice and topped with crunch.",
            prices: { "16oz": 159, "22oz": 169 },
            available: true,
            order: 4
        },
        {
            name: "Mango Graham Milkshake",
            category: "MILKSHAKES",
            description: "Creamy mango shake with graham cracker bits.",
            prices: { "16oz": 119, "22oz": 129 },
            available: true,
            order: 5
        },
        {
            name: "Ube Cheesecake Milkshake",
            category: "MILKSHAKES",
            description: "Classic Filipino ube flavor with a cheesecake twist.",
            prices: { "16oz": 119, "22oz": 129 },
            available: true,
            order: 6
        },
        {
            name: "Mango Cheesecake Premium",
            category: "PREMIUM MILKSHAKES",
            description: "Indulgent mango shake with real cheesecake chunks.",
            prices: { "16oz": 159, "22oz": 169 },
            available: true,
            order: 7
        },
        {
            name: "Matcha Cloudy Premium",
            category: "PREMIUM MILKSHAKES",
            description: "Premium ceremonial matcha with a creamy cloud topping.",
            prices: { "16oz": 159, "22oz": 169 },
            available: true,
            order: 8
        },
        {
            name: "Choco Volcano",
            category: "SIGNATURE TWISTS",
            description: "Explosion of chocolate flavors in one cup.",
            price: 129,
            available: true,
            order: 9
        },
        {
            name: "Milo Oreo",
            category: "SIGNATURE TWISTS",
            description: "The perfect blend of Milo and Oreo cookies.",
            price: 139,
            available: true,
            order: 10
        },
        {
            name: "Green Apple Soda",
            category: "SODA BLENDS",
            description: "Refreshing green apple flavored soda with ice.",
            prices: { "16oz": 39, "22oz": 49 },
            available: true,
            order: 11
        },
        {
            name: "Kiwi Soda",
            category: "SODA BLENDS",
            description: "Zesty kiwi flavored soda, perfect for a hot day.",
            prices: { "16oz": 39, "22oz": 49 },
            available: true,
            order: 12
        },
        {
            name: "Cucumber Infusion",
            category: "SIGNATURE INFUSIONS",
            description: "Fresh cucumber infused water with a hint of lime.",
            price: 129,
            available: true,
            order: 13
        },
        {
            name: "Yakult Honey Infusion",
            category: "SIGNATURE INFUSIONS",
            description: "Probiotic Yakult mixed with sweet honey.",
            price: 129,
            available: true,
            order: 14
        },
        {
            name: "French Fries",
            category: "SAVORY BITES",
            description: "Golden crispy fries served with your choice of dip.",
            prices: { "Solo": 59, "Sharing": 89 },
            available: true,
            order: 15
        },
        {
            name: "Loaded Nachos",
            category: "SAVORY BITES",
            description: "Nachos topped with cheese, meat, and jalapeños.",
            prices: { "Solo": 79, "Sharing": 129 },
            available: true,
            order: 16
        },
        {
            name: "Ham & Cheese Club",
            category: "CLUB SANDWICHES",
            description: "Triple-decker sandwich with ham, cheese, and fresh veggies.",
            price: 129,
            available: true,
            order: 17
        },
        {
            name: "Bacon Club Sandwich",
            category: "CLUB SANDWICHES",
            description: "Crispy bacon with lettuce and tomato in a classic club.",
            price: 129,
            available: true,
            order: 18
        }
    ];

    if (confirm(`This will add ${menuData.length} items to your menu. Proceed?`)) {
        try {
            const batch = db.batch();
            menuData.forEach(item => {
                const docRef = db.collection('items').doc();
                batch.set(docRef, item);
            });
            await batch.commit();
            alert('Menu seeded successfully!');
        } catch (error) {
            console.error("Error seeding data: ", error);
            alert('Failed to seed menu.');
        }
    }
};

function updateStats(items) {
    statCount.textContent = items.length;
    const categories = new Set(items.map(i => i.category));
    statCats.textContent = categories.size;
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
        await db.collection('items').doc(id).update({ available: isAvailable });
        showToast('Availability updated');
    } catch (error) {
        showToast('Update failed');
    }
}

async function deleteItem(id) {
    if (confirm('Permanently remove this item?')) {
        try {
            await db.collection('items').doc(id).delete();
            showToast('Item deleted');
        } catch (error) {
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
