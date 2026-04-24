const initialMenuData = [
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