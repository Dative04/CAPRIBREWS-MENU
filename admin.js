const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const restoreDbBtn = document.getElementById('restore-db-btn');
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

restoreDbBtn.addEventListener('click', async () => {
    if (!confirm('This will add all 50+ items from your menu images. Continue?')) return;
    
    const menuData = [
        { name: "MANGO GRAHAM", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "MANGO DELIGHTS", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "MANGO OREO", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "UBE CHEESECAKE", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "CHOCOLATE COOKIES", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "CHOCO VOLCANO", category: "MILKSHAKES", prices: { "16OZ": 119, "22OZ": 129 } },
        { name: "MANGO CHEESECAKE", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "ESPRESSO CHIPS", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CAPPUCCINO", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CAFÉ MOCHA", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CAFÉ CARAMEL", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CAFÉ MATCHA", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "SALTED CARAMEL", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "MATCHA STRAWBERRY", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "MATCHA CLOUDY", category: "PREMIUM MILKSHAKES", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CAPRI BLACK", category: "COFFEE SELECTION", prices: { "8OZ": 79, "12OZ": 89, "16OZ": 99 } },
        { name: "CAFÉ LATTE", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "CAPPUCCINO", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "CARAMEL MACCHIATO", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "SALTED CARAMEL", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "WHITE CHOCOLATE", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "DARK MOCHA", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "VANILLA LATTE", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "UBE COFFEE HAZE", category: "COFFEE SELECTION", prices: { "8OZ": 89, "12OZ": 99, "16OZ": 109 } },
        { name: "ESPRESSO CHIPS", category: "FRAPPE", prices: { "16OZ": 129, "22OZ": 139 } },
        { name: "CHOCO CRUNCH", category: "FRAPPE", prices: { "16OZ": 139, "22OZ": 149 } },
        { name: "DOUBLE FUDGE", category: "FRAPPE", prices: { "16OZ": 139, "22OZ": 149 } },
        { name: "STRAWBERRY", category: "FRAPPE", prices: { "16OZ": 139, "22OZ": 149 } },
        { name: "MATCHA", category: "FRAPPE", prices: { "16OZ": 149, "22OZ": 159 } },
        { name: "MATCHA STRAWBERRY", category: "FRAPPE", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CHOCO STRAWBERRY", category: "FRAPPE", prices: { "16OZ": 159, "22OZ": 169 } },
        { name: "CHOCO VOLCANO", category: "SIGNATURE TWISTS", price: 129 },
        { name: "MILO OREO LATTE", category: "SIGNATURE TWISTS", price: 129 },
        { name: "MATCHA MILK FOAM", category: "SIGNATURE TWISTS", price: 139 },
        { name: "GREEN APPLE", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "KIWI", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "MANGO", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "STRAWBERRY", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "GRAPES", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "LEMON", category: "SODA BLENDS", prices: { "16OZ": 39, "22OZ": 49 } },
        { name: "CUCUMBER LEMONADE", category: "SIGNATURE FRUIT INFUSIONS", price: 129 },
        { name: "YAKULT HONEY LEMONADE", category: "SIGNATURE FRUIT INFUSIONS", price: 129 },
        { name: "FRIES", category: "SAVORY BITES", prices: { "SOLO": 59, "SHARING": 89 } },
        { name: "NACHOS", category: "SAVORY BITES", prices: { "SOLO": 79, "SHARING": 129 } },
        { name: "HAM", category: "CLUB SANDWICHES", price: 129 },
        { name: "BACON", category: "CLUB SANDWICHES", price: 129 },
        { name: "TUNA", category: "CLUB SANDWICHES", price: 129 },
        { name: "Classic", category: "CAPRI BURGER", price: 69 },
        { name: "Country", category: "CAPRI BURGER", price: 99 },
        { name: "Quarter Pounder", category: "CAPRI BURGER", price: 139 }
    ];

    restoreDbBtn.disabled = true;
    restoreDbBtn.textContent = 'Uploading...';

    for (const item of menuData) {
        try {
            item.available = true;
            item.order = Date.now();
            await db.collection('items').add(item);
        } catch (e) {
            console.error(e);
        }
    }
    
    restoreDbBtn.textContent = '✅ Restore Complete';
    showToast('All menu items restored!');
});

// Modal Logic
showAddModalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
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

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dietary = Array.from(document.querySelectorAll('.diet-check:checked')).map(c => c.value);
    
    const newItem = {
        name: document.getElementById('new-name').value,
        category: document.getElementById('new-category').value,
        description: document.getElementById('new-description').value,
        image: document.getElementById('new-image').value,
        dietary: dietary,
        available: true,
        order: Date.now()
    };

    if (priceTypeSelect.value === 'single') {
        newItem.price = parseFloat(document.getElementById('new-price').value);
    } else {
        newItem.prices = {
            "16OZ": parseFloat(document.getElementById('new-price-16').value),
            "22OZ": parseFloat(document.getElementById('new-price-22').value)
        };
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
