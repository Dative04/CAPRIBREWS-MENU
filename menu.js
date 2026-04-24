const menuContainer = document.getElementById('menu-container');

// Immediate logging to help us find the issue
console.log("Menu script initialized.");

function renderMenu(items) {
    console.log("Rendering started. Items count:", items.length);
    
    if (!items || items.length === 0) {
        console.warn("No items found in the 'items' collection.");
        menuContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>Menu is Empty</h3>
                <p>We couldn't find any items in your database.</p>
                <div style="background: #f0f0f0; padding: 15px; margin-top: 20px; border-radius: 5px; font-size: 0.9em; text-align: left;">
                    <strong>Next steps for you:</strong>
                    <ol>
                        <li>Go to Firebase Console > Firestore Database.</li>
                        <li>Check if you have a collection named <strong>items</strong> (all lowercase).</li>
                        <li>Inside that collection, make sure you have added documents (items).</li>
                    </ol>
                </div>
            </div>`;
        return;
    }

    menuContainer.innerHTML = '';

    const groupedItems = {};
    items.forEach(item => {
        const cat = item.category || "General";
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
            nameSpan.textContent = item.name || "Untitled Item";
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

            // Support for both map (prices) and single value (price)
            if (item.prices && typeof item.prices === 'object') {
                Object.entries(item.prices).forEach(([size, price]) => {
                    const priceSpan = document.createElement('span');
                    const displayPrice = typeof price === 'number' ? price.toFixed(2) : price;
                    priceSpan.textContent = `${size} ₱${displayPrice}`;
                    priceContainer.appendChild(priceSpan);
                });
            } else if (item.price !== undefined) {
                const priceSpan = document.createElement('span');
                const displayPrice = typeof item.price === 'number' ? item.price.toFixed(2) : item.price;
                priceSpan.textContent = `₱${displayPrice}`;
                priceContainer.appendChild(priceSpan);
            }

            div.appendChild(priceContainer);
            section.appendChild(div);
        });

        menuContainer.appendChild(section);
    });
    console.log("Rendering complete.");
}

// Check if Firebase was loaded correctly from firebase-config.js
if (typeof db === 'undefined') {
    console.error("Critical: 'db' is not defined. Check firebase-config.js");
    menuContainer.innerHTML = `
        <div style="color: red; padding: 20px; text-align: center; border: 2px solid red;">
            <h3>Firebase Error</h3>
            <p>The website cannot connect to the database.</p>
            <p style="font-size: 0.8em;">Please check that <strong>firebase-config.js</strong> is uploaded to GitHub and has no errors.</p>
        </div>`;
} else {
    console.log("Fetching data from Firestore...");
    db.collection('items').onSnapshot(snapshot => {
        console.log("Snapshot received! Documents count:", snapshot.size);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMenu(items);
    }, error => {
        console.error("Firestore Error:", error);
        menuContainer.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h3>Database Connection Error</h3>
                <p>${error.message}</p>
                <p style="font-size: 0.8em; margin-top: 10px;">Common causes: <br> 
                1. Domain not authorized in Firebase Auth Settings. <br>
                2. Firestore Security Rules blocking access.</p>
            </div>`;
    });
}