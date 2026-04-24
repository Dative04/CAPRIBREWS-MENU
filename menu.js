const menuContainer = document.getElementById('menu-container');

function renderMenu(items) {
    menuContainer.innerHTML = '';

    const groupedItems = {};
    items.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });

    Object.keys(groupedItems).forEach(category => {
        const section = document.createElement('section');
        section.className = 'menu-category';

        const title = document.createElement('h3');
        title.textContent = category;
        section.appendChild(title);

        groupedItems[category].forEach(item => {
            const div = document.createElement('div');
            div.className = `menu-item ${!item.available ? 'unavailable' : ''}`;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = item.name;
            div.appendChild(nameSpan);

            if (!item.available) {
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
                    priceSpan.textContent = `${size} ₱${price.toFixed(2)}`;
                    priceContainer.appendChild(priceSpan);
                });
            } else if (item.price) {
                const priceSpan = document.createElement('span');
                priceSpan.textContent = `₱${item.price.toFixed(2)}`;
                priceContainer.appendChild(priceSpan);
            }

            div.appendChild(priceContainer);
            section.appendChild(div);
        });

        menuContainer.appendChild(section);
    });
}

db.collection('items').onSnapshot(snapshot => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMenu(items);
}, error => {
    console.error('Error loading menu:', error);
    menuContainer.innerHTML = '<p class="loading">Error loading menu. Please refresh.</p>';
});