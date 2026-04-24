const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminContainer = document.getElementById('admin-container');

// Modal Elements
const addModal = document.getElementById('add-modal');
const showAddModalBtn = document.getElementById('show-add-modal');
const closeModalBtn = document.getElementById('close-modal');
const addItemForm = document.getElementById('add-item-form');
const singlePriceInput = document.getElementById('single-price-input');
const multiPriceInput = document.getElementById('multi-price-input');
const priceTypeRadios = document.getElementsByName('price-type');

let currentItems = {};

// Modal Logic
showAddModalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));

priceTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'single') {
            singlePriceInput.classList.remove('hidden');
            multiPriceInput.classList.add('hidden');
        } else {
            singlePriceInput.classList.add('hidden');
            multiPriceInput.classList.remove('hidden');
        }
    });
});

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-name').value;
    const category = document.getElementById('new-category').value;
    const priceType = document.querySelector('input[name="price-type"]:checked').value;

    const newItem = {
        name,
        category,
        available: true
    };

    if (priceType === 'single') {
        newItem.price = parseFloat(document.getElementById('new-price').value);
    } else {
        newItem.prices = {
            "16OZ": parseFloat(document.getElementById('new-price-16').value),
            "22OZ": parseFloat(document.getElementById('new-price-22').value)
        };
    }

    try {
        await db.collection('items').add(newItem);
        showToast('New item added!');
        addModal.classList.add('hidden');
        addItemForm.reset();
    } catch (error) {
        console.error("Error adding item:", error);
        showToast('Error adding item.');
    }
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loginScreen.classList.add('hidden');
        adminScreen.classList.remove('hidden');
        loadMenuItems();
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
        loginError.textContent = '';
    } catch (error) {
        loginError.textContent = 'Invalid email or password';
    }
});

logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut();
});

function loadMenuItems() {
    adminContainer.innerHTML = '<p class="loading">Loading menu items...</p>';

    db.collection('items').onSnapshot(snapshot => {
        currentItems = {};
        snapshot.docs.forEach(doc => {
            currentItems[doc.id] = { id: doc.id, ...doc.data() };
        });
        renderAdminPanel();
    }, error => {
        console.error('Error loading items:', error);
        adminContainer.innerHTML = '<p class="loading">Error loading menu. Please refresh.</p>';
    });
}

function renderAdminPanel() {
    adminContainer.innerHTML = '';

    const groupedItems = {};
    Object.values(currentItems).forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });

    Object.keys(groupedItems).sort().forEach(category => {
        const categoryDiv = document.createElement('div');

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<span>${category}</span><span>${groupedItems[category].length} items</span>`;
        categoryDiv.appendChild(header);

        groupedItems[category].forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.id = `item-${item.id}`;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'item-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'item-name';
            nameDiv.textContent = item.name;
            infoDiv.appendChild(nameDiv);

            const pricesDiv = document.createElement('div');
            pricesDiv.className = 'item-prices';

            if (item.prices && Object.keys(item.prices).length > 0) {
                Object.entries(item.prices).forEach(([size, price]) => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'price-input';
                    input.id = `price-${item.id}-${size}`;
                    input.value = price;
                    input.min = '0';
                    input.step = '0.01';
                    input.dataset.itemId = item.id;
                    input.dataset.size = size;

                    const label = document.createElement('label');
                    label.textContent = `${size}: ₱`;
                    label.appendChild(input);
                    pricesDiv.appendChild(label);

                    input.addEventListener('change', () => {
                        currentItems[item.id].prices[size] = parseFloat(input.value);
                    });
                });
            } else if (item.price !== undefined) {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'price-input';
                input.id = `price-${item.id}`;
                input.value = item.price;
                input.min = '0';
                input.step = '0.01';
                input.dataset.itemId = item.id;

                const label = document.createElement('label');
                label.textContent = `Price: ₱`;
                label.appendChild(input);
                pricesDiv.appendChild(label);

                input.addEventListener('change', () => {
                    currentItems[item.id].price = parseFloat(input.value);
                });
            }

            infoDiv.appendChild(pricesDiv);
            card.appendChild(infoDiv);

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'item-controls';

            const toggleDiv = document.createElement('div');
            toggleDiv.className = 'availability-toggle';

            const label = document.createElement('label');
            label.textContent = 'Available';
            toggleDiv.appendChild(label);

            const switchDiv = document.createElement('label');
            switchDiv.className = 'switch';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `toggle-${item.id}`;
            checkbox.checked = item.available !== false;
            checkbox.dataset.itemId = item.id;

            const slider = document.createElement('span');
            slider.className = 'slider';

            switchDiv.appendChild(checkbox);
            switchDiv.appendChild(slider);
            toggleDiv.appendChild(switchDiv);
            controlsDiv.appendChild(toggleDiv);

            checkbox.addEventListener('change', () => {
                currentItems[item.id].available = checkbox.checked;
            });

            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-btn';
            saveBtn.textContent = 'Save';
            saveBtn.dataset.itemId = item.id;
            saveBtn.addEventListener('click', () => saveItem(item.id));
            controlsDiv.appendChild(saveBtn);

            card.appendChild(controlsDiv);
            categoryDiv.appendChild(card);
        });

        adminContainer.appendChild(categoryDiv);
    });
}

async function saveItem(itemId) {
    const item = currentItems[itemId];
    const saveBtn = document.querySelector(`[data-item-id="${itemId}"].save-btn`);

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const { id, ...data } = item;
        await db.collection('items').doc(itemId).set(data, { merge: true });

        showToast('Item saved successfully!');
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Error saving item. Please try again.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}