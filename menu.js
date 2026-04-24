const menuContainer = document.getElementById('menu-container');

console.log("Menu script started. Checking Firebase...");

function renderMenu(items) {
    console.log("Rendering menu with", items.length, "items.");
    
    if (items.length === 0) {
        menuContainer.innerHTML = `
            <div class="loading">
                <p>No menu items found in the database.</p>
                <p style="font-size: 0.8em; color: #888;">Make sure your Firestore collection is named "items" (lowercase) and contains documents.</p>
            </div>`;
        return;
    }

    menuContainer.innerHTML = '';

    const groupedItems = {};
    items.forEach(item => {
        const cat = item.category || "Uncategorized";
        if (!groupedItems[cat]) {
            groupedItems[cat] = [];
        }
        groupedItems[cat].push(item);
    });

    Object.keys(groupedItems).sort().forEach(category => {
        const section = document.createElement('section');
        section.className = 'menu-category';

        const title = document.createElement('h3');
        title.textContent = category;
        section.appendChild(title);

        groupedItems[category].forEach(item => {
            const div = document.createElement('div');
            div.className = `menu-item ${item.available === false ? 'unavailable' : ''}`;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = item.name || "Unnamed Item";
            div.appendChild(nameSpan);

            if (item.available === false) {
                const badge = document.createElement('span');
                badge.className = 'sold-out-badge';
                badge.textContent = 'SOLD OUT';
                div.appendChild(badge);
            }

            const priceContainer = document.createElement('div');
            priceContainer.className = 'item-price';
            priceContainer.style.display = 'flex';
            priceContainer.style.gap = '10px';
            priceContainer.style.flexWrap = 'wrap';

            if (item.prices && Object.keys(item.prices).length > 0) {
                Object.entries(item.prices).forEach(([size, price]) => {
                    const priceSpan = document.createElement('span');
                    const numPrice = typeof price === 'number' ? price : parseFloat(price);
                    priceSpan.textContent = `${size} ₱${isNaN(numPrice) ? price : numPrice.toFixed(2)}`;
                    priceContainer.appendChild(priceSpan);
                });
            } else if (item.price !== undefined) {
                const priceSpan = document.createElement('span');
                const numPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                priceSpan.textContent = `₱${isNaN(numPrice) ? item.price : numPrice.toFixed(2)}`;
                priceContainer.appendChild(priceSpan);
            }

            div.appendChild(priceContainer);
            section.appendChild(div);
        });

        menuContainer.appendChild(section);
    });
}

if (typeof db === 'undefined') {
    console.error("Database (db) is not defined! Check firebase-config.js");
    menuContainer.innerHTML = `
        <div class="loading">
            <p style="color: red;">Error: Firebase not initialized.</p>
            <p style="font-size: 0.8em;">Check your firebase-config.js file and ensure it's uploaded correctly.</p>
        </div>`;
} else {
    console.log("Connecting to Firestore 'items' collection...");
    db.collection('items').onSnapshot(snapshot => {
        console.log("Database snapshot received! Size:", snapshot.size);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMenu(items);
    }, error => {
        console.error('Firestore Error:', error);
        menuContainer.innerHTML = `
            <div class="loading">
                <p style="color: red;">Error loading menu: ${error.message}</p>
                <p style="font-size: 0.8em;">Check your Firestore Security Rules and Authorized Domains.</p>
            </div>`;
    });
}