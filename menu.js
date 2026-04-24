<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Capibrews | Specialty Coffee</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
</head>
<body>
    <div class="app-container">
        <header class="main-header" id="main-header">
            <div class="header-content-wrapper">
                <div class="header-content">
                    <img src="https://i.imgur.com/F022t03.png" alt="Capibrews Logo" class="brand-logo">
                    <p class="tagline">Feeling Adventurous? Ask our barista for their 'Daily Whim'.</p>
                    <div class="search-container">
                        <input type="text" id="menu-search" placeholder="Search our menu...">
                    </div>
                </div>
            </div>
            
            <nav class="category-tabs-container">
                <div class="category-tabs" id="category-tabs">
                    <!-- Tabs will be injected here -->
                    <div class="tab-skeleton"></div>
                </div>
            </nav>
        </header>

        <main class="menu-view">
            <div class="item-grid" id="menu-grid">
                <!-- Menu cards will be injected here -->
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Brewing your menu...</p>
                </div>
            </div>
        </main>

        <footer class="minimal-footer">
            <img src="https://i.imgur.com/F022t03.png" alt="Capibrews Signature" class="footer-sig">
            <p>&copy; 2024 Capibrews Specialty Coffee</p>
        </footer>
    </div>

    <script src="firebase-config.js"></script>
    <script src="menu-data.js"></script>
    <script src="menu.js"></script>
</body>
</html>
