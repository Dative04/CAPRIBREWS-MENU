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