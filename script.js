// Variabel Global
let currentUser = null;
let currentPage = 'landingPage';
let currentProduct = null;
let editingUserId = null;
let editingProductId = null;
let uploadedImageUrl = null;
let currentProductImage = null;

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Dimuat - Memulai inisialisasi');
    
    // Initialize global services tracker
    window.appReady = false;
    window.servicesReady = {
        firebase: false,
        cloudinary: false
    };
    
    // Buat semua fungsi dapat diakses global untuk onclick handlers
    window.showPage = showPage;
    window.switchTab = switchTab;
    window.showDashboardSection = showDashboardSection;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.logout = logout;
    window.showForgotPassword = showForgotPassword;
    window.handleForgotPassword = handleForgotPassword;
    window.shareProduct = shareProduct;
    window.copyProductLink = copyProductLink;
    window.shareProductNative = shareProductNative;
    window.loadMoreProducts = loadMoreProducts;
    window.showUpgradeModal = showUpgradeModal;
    window.confirmUpgrade = confirmUpgrade;
    window.showWithdrawForm = showWithdrawForm;
    window.handleWithdraw = handleWithdraw;
    window.showAdminAccess = showAdminAccess;
    window.handleAdminAccess = handleAdminAccess;
    window.closeAdminDashboard = closeAdminDashboard;
    window.showAdminTab = showAdminTab;
    window.editUser = editUser;
    window.deleteUser = deleteUser;
    window.handleEditUser = handleEditUser;
    window.showAddProductForm = showAddProductForm;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.handleProductForm = handleProductForm;
    window.loadSettings = loadSettings;
    window.saveBankInfo = saveBankInfo;
    window.saveAdminContact = saveAdminContact;
    window.exportUsers = exportUsers;
    window.filterProducts = filterProducts;
    window.closeModal = closeModal;
    window.previewImage = previewImage;
    window.removeCurrentImage = removeCurrentImage;
    
    // Make initializeApp globally accessible
    window.initializeApp = initializeApp;
    
    console.log('Semua fungsi terdaftar secara global');
    
    // Initialize Firebase
    if (window.firebaseService) {
        window.firebaseService.initialize();
    }
    
    // Initialize Cloudinary
    if (window.cloudinaryService) {
        window.cloudinaryService.initialize();
    }
    
    // Wait for services to be ready
    waitForServicesAndInit();
});

function waitForServicesAndInit() {
    const maxWaitTime = 10000; // 10 seconds max
    const checkInterval = 100; // Check every 100ms
    let elapsed = 0;
    
    const checkServices = () => {
        elapsed += checkInterval;
        
        // Check if services are ready or timeout reached
        if (window.appReady || elapsed >= maxWaitTime) {
            console.log('Starting app initialization...');
            initializeApp();
            return;
        }
        
        // Continue waiting
        setTimeout(checkServices, checkInterval);
    };
    
    // Start checking
    setTimeout(checkServices, 1000); // Wait 1 second before starting checks
}

async function initializeApp() {
    console.log('=== INISIALISASI APLIKASI DIMULAI ===');
    
    try {
        // Tunggu Firebase initialization
        let firebaseReady = false;
        if (window.firebaseService) {
            firebaseReady = window.firebaseService.isInitialized();
            console.log('Firebase status:', firebaseReady);
        } else {
            console.log('Firebase service not available');
        }
        
        // Tunggu Cloudinary initialization
        let cloudinaryReady = false;
        if (window.cloudinaryService) {
            cloudinaryReady = window.cloudinaryService.isInitialized();
            console.log('Cloudinary status:', cloudinaryReady);
        } else {
            console.log('Cloudinary service not available');
        }
        
        // Setup real-time sync if Firebase is ready
        if (firebaseReady) {
            setupRealtimeSync();
        }
        
        // Sembunyikan loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                console.log('Loading screen disembunyikan');
            }
        }, 1500);

        // Cek sesi yang ada
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                showPage('dashboardPage');
                updateDashboard();
            } catch (error) {
                console.error('Error parsing user data:', error);
                showPage('landingPage');
            }
        } else {
            showPage('landingPage');
        }

        // Inisialisasi data
        await initializeData();
        
        // Generate testimonials
        generateTestimonials();
        
        // Generate notifications
        generateNotifications();
        
        // Setup auto-refresh untuk update real-time
        setInterval(checkForUpdates, 10000);
        
        console.log('=== INISIALISASI APLIKASI SELESAI ===');
        
    } catch (error) {
        console.error('Error during app initialization:', error);
        
        // Emergency fallback
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        showPage('landingPage');
    }
}

// Setup Real-time Sync
function setupRealtimeSync() {
    if (!window.firebaseService) {
        console.log('Firebase service not available for real-time sync');
        return;
    }

    try {
        // Sync users
        window.firebaseService.syncUsers((users) => {
            console.log('Users synced from Firebase:', users);
            // Update admin table jika sedang di halaman admin
            if (currentPage === 'adminDashboard') {
                loadUsers();
            }
        });

        // Sync products
        window.firebaseService.syncProducts((products) => {
            console.log('Products synced from Firebase:', products);
            // Update product grid jika sedang di halaman dashboard
            if (currentPage === 'dashboardPage') {
                loadProducts();
            }
        });

        // Sync settings
        window.firebaseService.syncSettings((settings) => {
            console.log('Settings synced from Firebase:', settings);
            // Update dashboard jika settings berubah
            if (currentPage === 'dashboardPage') {
                updateDashboard();
            }
        });
    } catch (error) {
        console.error('Error setting up real-time sync:', error);
    }
}

// Manajemen Data
async function initializeData() {
    // Initialize users
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    }
    
    if (users.length === 0) {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                phone: '08123456789',
                password: 'admin123',
                membership: 'Mytic',
                clicks: 1250,
                orders: 89,
                balance: 15000000,
                linksShared: 234
            }
        ];
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateUsers(defaultUsers);
        } else {
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
        users = defaultUsers;
    }

    // Initialize products
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    }
    
    if (products.length === 0) {
        const defaultProducts = [
            {
                id: 1,
                name: 'Smartphone Android Pro',
                price: 5000000,
                commission: 10,
                url: 'https://example.com/phone1',
                image: 'https://picsum.photos/seed/android-smartphone-pro/300/200.jpg'
            },
            {
                id: 2,
                name: 'Laptop Gaming Ultra',
                price: 15000000,
                commission: 15,
                url: 'https://example.com/laptop1',
                image: 'https://picsum.photos/seed/gaming-laptop-ultra/300/200.jpg'
            },
            {
                id: 3,
                name: 'Smartwatch Premium',
                price: 3000000,
                commission: 12,
                url: 'https://example.com/watch1',
                image: 'https://picsum.photos/seed/premium-smartwatch/300/200.jpg'
            },
            {
                id: 4,
                name: 'Headphone Wireless Pro',
                price: 1500000,
                commission: 8,
                url: 'https://example.com/headphone1',
                image: 'https://picsum.photos/seed/wireless-headphone-pro/300/200.jpg'
            },
            {
                id: 5,
                name: 'Tablet Pro 12inch',
                price: 8000000,
                commission: 10,
                url: 'https://example.com/tablet1',
                image: 'https://picsum.photos/seed/pro-tablet-12inch/300/200.jpg'
            }
        ];
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateProducts(defaultProducts);
        } else {
            localStorage.setItem('products', JSON.stringify(defaultProducts));
        }
        products = defaultProducts;
    }

    // Initialize settings
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    }
    
    if (Object.keys(settings).length === 0) {
        const defaultSettings = {
            bankInfo: {
                bankName: 'BCA',
                accountNumber: '1234567890',
                adminName: 'Admin AffiliatePro'
            },
            membershipPrices: {
                Warrior: 0,
                Master: 500000,
                Grandmaster: 1500000,
                Epic: 3000000,
                Legend: 5000000,
                Mytic: 10000000
            },
            membershipCommissions: {
                Warrior: 5,
                Master: 8,
                Grandmaster: 12,
                Epic: 15,
                Legend: 18,
                Mytic: 25
            },
            adminContact: 'https://wa.me/628123456789',
            withdrawEnabled: true
        };
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateSettings(defaultSettings);
        } else {
            localStorage.setItem('settings', JSON.stringify(defaultSettings));
        }
    }
}

// Navigasi Halaman
function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Tampilkan halaman yang dipilih
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;

    // Inisialisasi spesifik halaman
    if (pageId === 'dashboardPage') {
        updateDashboard();
        loadProducts();
        loadMembership();
    } else if (pageId === 'adminDashboard') {
        loadAdminData();
    }
}

// Switch Tab (Auth)
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabBtns[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabBtns[1].classList.add('active');
    }
}

// Switch Section Dashboard
function showDashboardSection(section) {
    const sections = document.querySelectorAll('.dashboard-section');
    const navBtns = document.querySelectorAll('.nav-btn');

    sections.forEach(s => s.classList.remove('active'));
    navBtns.forEach(btn => btn.classList.remove('active'));

    if (section === 'overview') {
        document.getElementById('overviewSection').classList.add('active');
        navBtns[0].classList.add('active');
    } else if (section === 'products') {
        document.getElementById('productsSection').classList.add('active');
        navBtns[1].classList.add('active');
        loadProducts();
    } else if (section === 'membership') {
        document.getElementById('membershipSection').classList.add('active');
        navBtns[2].classList.add('active');
        loadMembership();
    }
}

// Autentikasi
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    const user = users.find(u => u.email === email);
    
    if (user) {
        // Login berhasil meskipun password salah (sesuai permintaan)
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showPage('dashboardPage');
        updateDashboard();
        showToast('Login berhasil!', 'success');
    } else {
        showToast('Email tidak ditemukan!', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showToast('Password tidak cocok!', 'error');
        return;
    }
    
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    if (users.find(u => u.email === email)) {
        showToast('Email sudah terdaftar!', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        phone,
        password,
        membership: 'Warrior',
        clicks: 0,
        orders: 0,
        balance: 0,
        linksShared: 0
    };
    
    users.push(newUser);
    
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        await window.firebaseService.updateUsers(users);
    } else {
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showPage('dashboardPage');
    updateDashboard();
    showToast('Registrasi berhasil!', 'success');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showPage('landingPage');
    showToast('Anda telah logout', 'success');
}

// Lupa Password
function showForgotPassword() {
    document.getElementById('forgotPasswordModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Password tidak cocok!', 'error');
        return;
    }
    
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateUsers(users);
        } else {
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        showToast('Password berhasil direset!', 'success');
        closeModal();
    } else {
        showToast('Email tidak ditemukan!', 'error');
    }
}

// Fungsi Dashboard
function updateDashboard() {
    if (!currentUser) return;
    
    document.getElementById('userDisplayName').textContent = currentUser.username;
    document.getElementById('userMembership').textContent = currentUser.membership;
    document.getElementById('clickCount').textContent = currentUser.clicks || 0;
    document.getElementById('orderCount').textContent = currentUser.orders || 0;
    document.getElementById('balance').textContent = formatCurrency(currentUser.balance || 0);
    document.getElementById('linksShared').textContent = currentUser.linksShared || 0;
    
    // Get commission rate from settings
    const getCommissionRate = async () => {
        let settings = {};
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            settings = await window.firebaseService.getSettings();
        } else {
            settings = JSON.parse(localStorage.getItem('settings')) || {};
        }
        
        const commissionRate = settings.membershipCommissions?.[currentUser.membership] || 5;
        document.getElementById('commissionRate').textContent = commissionRate + '%';
    };
    
    getCommissionRate();
}

// Produk
async function loadProducts() {
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    } else {
        products = JSON.parse(localStorage.getItem('products')) || [];
    }
    
    // Saat halaman dimuat, tampilkan semua produk
    filterProducts('all');
}

function loadMoreProducts() {
    showToast('Upgrade membership untuk melihat lebih banyak produk!', 'error');
}

async function shareProduct(productId) {
    const productsGrid = document.getElementById('productsGrid');
    const productCards = productsGrid.querySelectorAll('.product-card');
    
    let product = null;
    productCards.forEach(card => {
        const shareBtn = card.querySelector('button[onclick*="shareProduct"]');
        if (shareBtn && shareBtn.getAttribute('onclick').includes(productId)) {
            const name = card.querySelector('.product-name').textContent;
            const priceText = card.querySelector('.product-price').textContent;
            const commissionText = card.querySelector('.product-commission').textContent;
            const image = card.querySelector('.product-image').src;
            
            const price = parseInt(priceText.replace(/[^0-9]/g, ''));
            // Extract commission percentage from text like "Komisi: 10% (Rp 500.000)"
            const commissionMatch = commissionText.match(/Komisi: (\d+)%/);
            const commission = commissionMatch ? parseInt(commissionMatch[1]) : 0;
            const commissionAmount = calculateCommissionInRupiah(price, commission);
            
            product = {
                id: productId,
                name,
                price,
                commission,
                commissionAmount,
                image,
                url: `https://example.com/product/${productId}`
            };
        }
    });
    
    if (product) {
        currentProduct = product;
        document.getElementById('productModalTitle').textContent = product.name;
        document.getElementById('productModalImage').src = product.image;
        document.getElementById('productModalName').textContent = product.name;
        document.getElementById('productModalPrice').textContent = formatCurrency(product.price);
        document.getElementById('productModalCommission').textContent = `${product.commission}% (${formatCurrency(product.commissionAmount)})`;
        
        document.getElementById('productModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        
        // Update links shared count
        currentUser.linksShared = (currentUser.linksShared || 0) + 1;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update in Firebase
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            window.firebaseService.updateUser(currentUser.id, { linksShared: currentUser.linksShared });
        }
        
        updateDashboard();
    }
}

function copyProductLink() {
    if (currentProduct) {
        const affiliateLink = `${currentProduct.url}?ref=${currentUser.id}`;
        navigator.clipboard.writeText(affiliateLink).then(() => {
            showToast('Link berhasil disalin!', 'success');
        }).catch(err => {
            console.error('Gagal menyalin link: ', err);
            showToast('Gagal menyalin link', 'error');
        });
    }
}

// Native Share Function
function shareProductNative() {
    if (currentProduct && navigator.share) {
        const affiliateLink = `${currentProduct.url}?ref=${currentUser.id}`;
        navigator.share({
            title: currentProduct.name,
            text: `Dapatkan komisi ${currentProduct.commission}% dengan membeli ${currentProduct.name} melalui link saya!`,
            url: affiliateLink
        }).then(() => {
            showToast('Produk berhasil dibagikan!', 'success');
        }).catch((error) => {
            console.log('Error sharing:', error);
            // Fallback to copying link if native share fails or is cancelled
            copyProductLink();
        });
    } else {
        // Fallback for browsers that do not support Web Share API
        copyProductLink();
    }
}

// Membership
async function loadMembership() {
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    const membershipGrid = document.getElementById('membershipGrid');
    membershipGrid.innerHTML = '';
    
    const levels = ['Warrior', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mytic'];
    const levelIcons = {
        'Warrior': 'fa-shield-alt',
        'Master': 'fa-user-graduate',
        'Grandmaster': 'fa-chess-king',
        'Epic': 'fa-gem',
        'Legend': 'fa-crown',
        'Mytic': 'fa-star'
    };
    
    // Contoh produk dengan harga rata-rata untuk menghitung estimasi komisi
    const sampleProductPrice = 5000000; // Rp 5.000.000
    
    levels.forEach(level => {
        const isCurrentLevel = currentUser.membership === level;
        const price = settings.membershipPrices?.[level] || 0;
        const commission = settings.membershipCommissions?.[level] || 0;
        const estimatedCommission = calculateCommissionInRupiah(sampleProductPrice, commission);
        
        const card = document.createElement('div');
        card.className = `membership-card ${isCurrentLevel ? 'current' : ''}`;
        card.innerHTML = `
            <div class="membership-header">
                <i class="fas ${levelIcons[level]}"></i>
                <h3 class="membership-level">${level}</h3>
            </div>
            <div class="membership-body">
                <div class="membership-commission">Komisi: ${commission}% (${formatCurrency(estimatedCommission)} dari produk Rp 5.000.000)</div>
                <div class="membership-price">Harga: ${price === 0 ? 'Gratis' : formatCurrency(price)}</div>
                <ul class="membership-features">
                    <li><i class="fas fa-check"></i> Akses ke ${level === 'Warrior' ? '10' : level === 'Master' ? '25' : level === 'Grandmaster' ? '50' : level === 'Epic' ? '100' : level === 'Legend' ? '150' : 'Semua'} produk</li>
                    <li><i class="fas fa-check"></i> Komisi hingga ${commission}%</li>
                    <li><i class="fas fa-check"></i> Dukungan prioritas</li>
                </ul>
            </div>
            <div class="membership-footer">
                ${!isCurrentLevel ? 
                    `<button class="btn btn-primary btn-full" onclick="showUpgradeModal('${level}')">
                        Upgrade ke ${level}
                    </button>` : 
                    `<span class="current-level-badge">Level Anda Saat Ini</span>`
                }
            </div>
        `;
        membershipGrid.appendChild(card);
    });
}

async function showUpgradeModal(level = null) {
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    const bankInfo = settings.bankInfo || {};
    
    document.getElementById('upgradeBankInfo').innerHTML = `
        <p><strong>Bank:</strong> ${bankInfo.bankName || 'BCA'}</p>
        <p><strong>Rekening:</strong> ${bankInfo.accountNumber || '1234567890'}</p>
        <p><strong>Atas Nama:</strong> ${bankInfo.adminName || 'Admin AffiliatePro'}</p>
    `;
    
    document.getElementById('upgradeWhatsAppBtn').onclick = () => {
        window.open(settings.adminContact || 'https://wa.me/628123456789', '_blank');
    };
    
    document.getElementById('upgradeModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function confirmUpgrade() {
    showToast('Silakan transfer dan hubungi admin untuk konfirmasi!', 'success');
    closeModal();
}

// Withdraw
async function showWithdrawForm() {
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    if (!settings.withdrawEnabled) {
        showToast('Penarikan sedang dinonaktifkan!', 'error');
        return;
    }
    
    if (currentUser.balance < 50000) {
        showToast('Minimal penarikan Rp 50.000!', 'error');
        return;
    }
    
    if (currentUser.membership === 'Warrior') {
        showToast('Upgrade membership untuk bisa melakukan penarikan!', 'error');
        return;
    }
    
    document.getElementById('withdrawModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function handleWithdraw(event) {
    event.preventDefault();
    
    const name = document.getElementById('withdrawName').value;
    const account = document.getElementById('withdrawAccount').value;
    const bank = document.getElementById('withdrawBank').value;
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    
    if (amount > currentUser.balance) {
        showToast('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    // TIDAK memotong saldo user - hanya menampilkan notifikasi
    showToast(`Permintaan penarikan sebesar ${formatCurrency(amount)} telah diterima! Silakan upgrade membership untuk memproses penarikan.`, 'success');
    
    // Tampilkan modal upgrade membership
    setTimeout(() => {
        closeModal();
        showUpgradeModal();
    }, 2000);
}

// Fungsi Admin
function showAdminAccess() {
    document.getElementById('adminAccessModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function handleAdminAccess(event) {
    event.preventDefault();
    
    const code = document.getElementById('adminCode').value;
    
    if (code === '521389') {
        showPage('adminDashboard');
        closeModal();
    } else {
        showToast('Kode akses salah!', 'error');
    }
}

function closeAdminDashboard() {
    showPage('dashboardPage');
}

function showAdminTab(tab) {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'users') {
        document.getElementById('usersTab').classList.add('active');
        tabBtns[0].classList.add('active');
        loadUsers();
    } else if (tab === 'products') {
        document.getElementById('productsTab').classList.add('active');
        tabBtns[1].classList.add('active');
        loadAdminProducts();
    } else if (tab === 'settings') {
        document.getElementById('settingsTab').classList.add('active');
        tabBtns[2].classList.add('active');
        loadSettings();
    }
}

async function loadAdminData() {
    await loadUsers();
    await loadAdminProducts();
    await loadSettings();
}

async function loadUsers() {
    console.log('=== FUNGSI LOAD USERS DIPANGGIL ===');
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    console.log('Users:', users);
    
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) {
        console.log('ERROR: usersTableBody tidak ditemukan!');
        return;
    }
    
    tbody.innerHTML = '';
    console.log('Tabel dibersihkan, menambahkan users...');
    
    users.forEach((user, index) => {
        console.log(`Menambahkan user ${index + 1}:`, user);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.membership}</td>
            <td>${user.clicks || 0}</td>
            <td>${user.orders || 0}</td>
            <td>${formatCurrency(user.balance || 0)}</td>
            <td class="table-actions">
                <button class="btn-edit" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('=== FUNGSI LOAD USERS SELESAI ===');
}

async function editUser(userId) {
    console.log('=== FUNGSI EDIT USER DIPANGGIL ===');
    console.log('editUser dipanggil dengan userId:', userId, 'tipe:', typeof userId);
    
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    const user = users.find(u => u.id == userId);
    
    if (user) {
        console.log('User ditemukan:', user);
        editingUserId = userId;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserPhone').value = user.phone;
        document.getElementById('editUserMembership').value = user.membership;
        document.getElementById('editUserClicks').value = user.clicks || 0;
        document.getElementById('editUserOrders').value = user.orders || 0;
        document.getElementById('editUserBalance').value = user.balance || 0;
        
        const modal = document.getElementById('editUserModal');
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            console.log('Membuka modal edit user');
            modal.classList.add('active');
            overlay.classList.add('active');
        } else {
            console.log('ERROR: Modal atau overlay tidak ditemukan');
        }
    } else {
        console.log('User tidak ditemukan dengan ID:', userId);
        showToast('User tidak ditemukan!', 'error');
    }
    console.log('=== FUNGSI EDIT USER SELESAI ===');
}

async function handleEditUser(event) {
    event.preventDefault();
    
    let users = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        users = await window.firebaseService.getUsers();
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    const userIndex = users.findIndex(u => u.id == editingUserId);
    
    if (userIndex !== -1) {
        users[userIndex] = {
            ...users[userIndex],
            email: document.getElementById('editUserEmail').value,
            phone: document.getElementById('editUserPhone').value,
            membership: document.getElementById('editUserMembership').value,
            clicks: parseInt(document.getElementById('editUserClicks').value),
            orders: parseInt(document.getElementById('editUserOrders').value),
            balance: parseInt(document.getElementById('editUserBalance').value)
        };
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateUsers(users);
        } else {
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Update current user jika mengedit diri sendiri
        if (currentUser && currentUser.id == editingUserId) {
            currentUser = users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateDashboard();
        }
        
        loadUsers();
        showToast('User berhasil diperbarui!', 'success');
        closeModal();
    } else {
        showToast('Gagal memperbarui user, ID tidak ditemukan!', 'error');
    }
}

async function deleteUser(userId) {
    console.log('=== FUNGSI DELETE USER DIPANGGIL ===');
    console.log('deleteUser dipanggil dengan userId:', userId, 'tipe:', typeof userId);
    
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        console.log('User mengkonfirmasi penghapusan');
        
        let users = [];
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            users = await window.firebaseService.getUsers();
        } else {
            users = JSON.parse(localStorage.getItem('users')) || [];
        }
        
        const filteredUsers = users.filter(u => u.id != userId);
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateUsers(filteredUsers);
        } else {
            localStorage.setItem('users', JSON.stringify(filteredUsers));
        }
        
        console.log('User dihapus, memuat ulang tabel...');
        loadUsers();
        showToast('User berhasil dihapus!', 'success');
    } else {
        console.log('User membatalkan penghapusan');
    }
    console.log('=== FUNGSI DELETE USER SELESAI ===');
}

async function loadAdminProducts() {
    console.log('loadAdminProducts dipanggil');
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    } else {
        products = JSON.parse(localStorage.getItem('products')) || [];
    }
    
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const commissionAmount = calculateCommissionInRupiah(product.price, product.commission);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.commission}% (${formatCurrency(commissionAmount)})</td>
            <td>${product.url}</td>
            <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td class="table-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddProductForm() {
    editingProductId = null;
    uploadedImageUrl = null;
    currentProductImage = null;
    
    document.getElementById('productFormTitle').textContent = 'Tambah Produk';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCommission').value = '';
    document.getElementById('productUrl').value = '';
    
    // Reset image upload
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').innerHTML = `
        <i class="fas fa-image"></i>
        <p>Klik untuk upload gambar</p>
    `;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('currentImage').style.display = 'none';
    
    document.getElementById('productFormModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

async function editProduct(productId) {
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    } else {
        products = JSON.parse(localStorage.getItem('products')) || [];
    }
    
    const product = products.find(p => p.id === productId);
    
    if (product) {
        editingProductId = productId;
        currentProductImage = product.image;
        uploadedImageUrl = null;
        
        document.getElementById('productFormTitle').textContent = 'Edit Produk';
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCommission').value = product.commission;
        document.getElementById('productUrl').value = product.url;
        
        // Show current image
        if (product.image) {
            document.getElementById('currentImageImg').src = product.image;
            document.getElementById('currentImage').style.display = 'block';
            document.getElementById('imagePreview').style.display = 'none';
        } else {
            document.getElementById('currentImage').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('imagePreview').innerHTML = `
                <i class="fas fa-image"></i>
                <p>Klik untuk upload gambar</p>
            `;
        }
        
        document.getElementById('productImage').value = '';
        
        document.getElementById('productFormModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
    }
}

async function deleteProduct(productId) {
    console.log('=== FUNGSI DELETE PRODUCT DIPANGGIL ===');
    console.log('deleteProduct dipanggil dengan productId:', productId, 'tipe:', typeof productId);
    
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        console.log('User mengkonfirmasi penghapusan produk');
        
        let products = [];
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            products = await window.firebaseService.getProducts();
        } else {
            products = JSON.parse(localStorage.getItem('products')) || [];
        }
        
        const productToDelete = products.find(p => p.id == productId);
        
        try {
            // Delete image from Cloudinary if available
            if (productToDelete?.image && window.cloudinaryService?.isInitialized()) {
                await window.cloudinaryService.deleteImage(productToDelete.image);
            }
            
            // Remove product from array
            const filteredProducts = products.filter(p => p.id != productId);
            
            if (window.firebaseService && window.firebaseService.isInitialized()) {
                await window.firebaseService.updateProducts(filteredProducts);
            } else {
                localStorage.setItem('products', JSON.stringify(filteredProducts));
            }
            
            loadAdminProducts();
            showToast('Produk berhasil dihapus!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Gagal menghapus produk: ' + error.message, 'error');
        }
    } else {
        console.log('User membatalkan penghapusan produk');
    }
    console.log('=== FUNGSI DELETE PRODUCT SELESAI ===');
}

async function handleProductForm(event) {
    event.preventDefault();
    
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    } else {
        products = JSON.parse(localStorage.getItem('products')) || [];
    }
    
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];
    
    // Show loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';
    submitBtn.disabled = true;
    
    // Add progress bar
    let progressContainer = null;
    if (file) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        submitBtn.parentNode.insertBefore(progressContainer, submitBtn);
    }
    
    let finalImageUrl = currentProductImage; // Default to existing image
    
    try {
        // If new image is selected, upload to Cloudinary
        if (file) {
            // Initialize Cloudinary if not already
            if (!window.cloudinaryService) {
                throw new Error('Cloudinary service not loaded');
            }
            
            const productId = editingProductId || Date.now();
            
            // Upload dengan progress tracking
            finalImageUrl = await window.cloudinaryService.uploadImage(
                file, 
                productId, 
                (progress) => {
                    if (progressContainer) {
                        progressContainer.querySelector('.progress-fill').style.width = progress + '%';
                        progressContainer.querySelector('.progress-text').textContent = Math.round(progress) + '%';
                    }
                }
            );
            
            if (!finalImageUrl) {
                throw new Error('Failed to upload image to Cloudinary');
            }
        }
        
        const productData = {
            name: document.getElementById('productName').value,
            price: parseInt(document.getElementById('productPrice').value),
            commission: parseInt(document.getElementById('productCommission').value),
            url: document.getElementById('productUrl').value,
            image: finalImageUrl
        };
        
        if (editingProductId) {
            // Edit existing product
            const productIndex = products.findIndex(p => p.id == editingProductId);
            if (productIndex !== -1) {
                // Delete old image from Cloudinary if new one uploaded
                if (file && window.cloudinaryService && products[productIndex].image) {
                    await window.cloudinaryService.deleteImage(products[productIndex].image);
                }
                
                products[productIndex] = { ...products[productIndex], ...productData };
            } else {
                throw new Error('Produk tidak ditemukan untuk diedit');
            }
        } else {
            // Add new product
            productData.id = Date.now();
            products.push(productData);
        }
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateProducts(products);
        } else {
            localStorage.setItem('products', JSON.stringify(products));
        }
        
        loadAdminProducts();
        loadProducts();
        showToast('Produk berhasil disimpan!', 'success');
        closeModal();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Gagal menyimpan produk: ' + error.message, 'error');
    } finally {
        // Restore button dan hapus progress bar
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        if (progressContainer) {
            progressContainer.remove();
        }
    }
}

// Fungsi Pengaturan
async function loadSettings() {
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    // Load info bank
    document.getElementById('bankName').value = settings.bankInfo?.bankName || '';
    document.getElementById('bankAccount').value = settings.bankInfo?.accountNumber || '';
    document.getElementById('adminName').value = settings.bankInfo?.adminName || '';
    
    // Load pengaturan membership
    const membershipSettings = document.getElementById('membershipSettings');
    membershipSettings.innerHTML = '';
    
    const levels = ['Warrior', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mytic'];
    levels.forEach(level => {
        const price = settings.membershipPrices?.[level] || 0;
        const commission = settings.membershipCommissions?.[level] || 0;
        
        const settingItem = document.createElement('div');
        settingItem.className = 'membership-setting-item';
        settingItem.innerHTML = `
            <label>${level}</label>
            <input type="number" id="price_${level}" placeholder="Harga" value="${price}">
            <input type="number" id="commission_${level}" placeholder="Komisi %" value="${commission}">
        `;
        membershipSettings.appendChild(settingItem);
    });
    
    // Load kontak admin
    document.getElementById('adminContact').value = settings.adminContact || '';
    
    // Load kontrol withdraw
    document.getElementById('withdrawEnabled').checked = settings.withdrawEnabled || false;
    
    // Update tombol WhatsApp
    document.getElementById('whatsappBtn').href = settings.adminContact || 'https://wa.me/628123456789';
}

async function saveBankInfo(event) {
    event.preventDefault();
    
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    settings.bankInfo = {
        bankName: document.getElementById('bankName').value,
        accountNumber: document.getElementById('bankAccount').value,
        adminName: document.getElementById('adminName').value
    };
    
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        await window.firebaseService.updateSettings(settings);
    } else {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
    
    showToast('Info rekening berhasil disimpan!', 'success');
}

async function saveAdminContact(event) {
    event.preventDefault();
    
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    settings.adminContact = document.getElementById('adminContact').value;
    
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        await window.firebaseService.updateSettings(settings);
    } else {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
    
    document.getElementById('whatsappBtn').href = settings.adminContact;
    showToast('Kontak admin berhasil disimpan!', 'success');
}

// Simpan pengaturan membership
document.addEventListener('DOMContentLoaded', function() {
    const membershipSettings = document.getElementById('membershipSettings');
    if (membershipSettings) {
        membershipSettings.addEventListener('change', async function() {
            let settings = {};
            if (window.firebaseService && window.firebaseService.isInitialized()) {
                settings = await window.firebaseService.getSettings();
            } else {
                settings = JSON.parse(localStorage.getItem('settings')) || {};
            }
            
            settings.membershipPrices = {};
            settings.membershipCommissions = {};
            
            const levels = ['Warrior', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mytic'];
            levels.forEach(level => {
                const priceInput = document.getElementById(`price_${level}`);
                const commissionInput = document.getElementById(`commission_${level}`);
                
                if (priceInput) {
                    settings.membershipPrices[level] = parseInt(priceInput.value) || 0;
                }
                if (commissionInput) {
                    settings.membershipCommissions[level] = parseInt(commissionInput.value) || 0;
                }
            });
            
            if (window.firebaseService && window.firebaseService.isInitialized()) {
                await window.firebaseService.updateSettings(settings);
            } else {
                localStorage.setItem('settings', JSON.stringify(settings));
            }
            
            showToast('Pengaturan membership berhasil disimpan!', 'success');
        });
    }
    
    // Kontrol withdraw
    const withdrawEnabled = document.getElementById('withdrawEnabled');
    if (withdrawEnabled) {
        withdrawEnabled.addEventListener('change', async function() {
            let settings = {};
            if (window.firebaseService && window.firebaseService.isInitialized()) {
                settings = await window.firebaseService.getSettings();
            } else {
                settings = JSON.parse(localStorage.getItem('settings')) || {};
            }
            
            settings.withdrawEnabled = this.checked;
            
            if (window.firebaseService && window.firebaseService.isInitialized()) {
                await window.firebaseService.updateSettings(settings);
            } else {
                localStorage.setItem('settings', JSON.stringify(settings));
            }
            
            showToast('Kontrol penarikan berhasil diperbarui!', 'success');
        });
    }
});

// Fungsi Export
function exportUsers() {
    const usersTable = document.getElementById('usersTableBody');
    const rows = usersTable.querySelectorAll('tr');
    
    let csv = 'Email,Nomor HP,Membership,Klik,Pesanan,Saldo\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
            cells[5].textContent.replace(/[^0-9]/g, '')
        ];
        csv += rowData.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Data user berhasil diexport!', 'success');
}

// Filter Produk
async function filterProducts(filter) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    let settings = {};
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        settings = await window.firebaseService.getSettings();
    } else {
        settings = JSON.parse(localStorage.getItem('settings')) || {};
    }
    
    const userCommission = settings.membershipCommissions?.[currentUser.membership] || 5;
    
    let products = [];
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        products = await window.firebaseService.getProducts();
    } else {
        products = JSON.parse(localStorage.getItem('products')) || [];
    }
    
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    let productsToShow = [];
    if (filter === 'all') {
        filterBtns[0].classList.add('active');
        // Tampilkan SEMUA produk
        productsToShow = products;
    } else if (filter === 'available') {
        filterBtns[1].classList.add('active');
        // Tampilkan produk yang KOMISINYA SESUAI level user
        productsToShow = products.filter(p => p.commission <= userCommission);
    }

    productsToShow.forEach(product => {
        const isLocked = product.commission > userCommission;
        const commissionAmount = calculateCommissionInRupiah(product.price, product.commission);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://picsum.photos/seed/product-placeholder/300/200.jpg'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">Harga: ${formatCurrency(product.price)}</p>
                <p class="product-commission">Komisi: ${product.commission}% (${formatCurrency(commissionAmount)})</p>
                <div class="product-actions">
                    ${isLocked ? 
                        `<button class="locked" onclick="showUpgradeModal()">
                            <i class="fas fa-lock"></i> Upgrade
                        </button>` :
                        `<button class="unlocked" onclick="shareProduct(${product.id})">
                            <i class="fas fa-share"></i> Share
                        </button>`
                    }
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Fungsi Modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('modalOverlay').classList.remove('active');
}

// Fungsi Utility
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Fungsi untuk menghitung komisi dalam rupiah
function calculateCommissionInRupiah(price, commissionPercentage) {
    return Math.round(price * commissionPercentage / 100);
}

// Fungsi untuk menampilkan komisi dengan format yang lebih baik
function formatCommissionDisplay(price, commissionPercentage) {
    const commissionAmount = calculateCommissionInRupiah(price, commissionPercentage);
    return `${commissionPercentage}% (${formatCurrency(commissionAmount)})`;
}

// Toast Notification Function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger reflow to enable transition
    toast.offsetHeight;

    // Show toast
    toast.classList.add('show');

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove from DOM after transition
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Testimonials - 27 Testimoni Statis Berputar
async function generateTestimonials() {
    const track = document.getElementById('testimonialsTrack');
    if (!track) return;

    // Array 27 testimoni statis
    const testimonials = [
        { id: 1, name: 'Budi Santoso', text: 'Sudah 3 bulan bergabung, komisi selalu tepat waktu! Dapat Rp 2.500.000/bulan.', rating: 5 },
        { id: 2, name: 'Siti Nurhaliza', text: 'Mudah sekali dapat uang dari HP, recommended! Sudah dapat Rp 3.000.000.', rating: 5 },
        { id: 3, name: 'Ahmad Fauzi', text: 'Program affiliate terbaik yang pernah saya ikuti. Komisi Rp 4.200.000/bulan.', rating: 5 },
        { id: 4, name: 'Dewi Lestari', text: 'Komisi besar dan produknya berkualitas. Dapat Rp 5.500.000/bulan.', rating: 5 },
        { id: 5, name: 'Rudi Hermawan', text: 'Sudah withdraw 5 kali, lancar semua! Total Rp 15.000.000.', rating: 5 },
        { id: 6, name: 'Maya Sari', text: 'Dari nol sekarang punya penghasilan tetap! Rp 3.800.000/bulan.', rating: 5 },
        { id: 7, name: 'Doni Prasetyo', text: 'Admin responsif, sistem transparan! Komisi Rp 4.100.000/bulan.', rating: 5 },
        { id: 8, name: 'Lina Wijaya', text: 'Modal HP saja sudah bisa hasilkan jutaan! Rp 2.900.000/bulan.', rating: 5 },
        { id: 9, name: 'Hendra Kusuma', text: 'Best affiliate program di Indonesia! Dapat Rp 6.200.000/bulan.', rating: 5 },
        { id: 10, name: 'Sarah Amalia', text: 'Komisi jutaan setiap bulan, mantap! Rp 5.100.000/bulan.', rating: 5 },
        { id: 11, name: 'Fajar Nugroho', text: 'Sudah beli motor dari komisi ini! Total Rp 18.000.000.', rating: 5 },
        { id: 12, name: 'Indah Puspita', text: 'Upgrade membership worth it banget! Komisi Rp 7.500.000/bulan.', rating: 5 },
        { id: 13, name: 'Bayu Setiawan', text: 'Sistemnya bagus dan terpercaya! Dapat Rp 4.300.000/bulan.', rating: 5 },
        { id: 14, name: 'Ratna Permata', text: 'Rekomendasi banget buat pemula! Rp 2.200.000/bulan.', rating: 5 },
        { id: 15, name: 'Rizki Hidayat', text: 'Admin ramah, komisi selalu dibayar! Rp 3.700.000/bulan.', rating: 5 },
        { id: 16, name: 'Andi Susanto', text: 'Produknya mudah dijual, komisi besar! Rp 5.800.000/bulan.', rating: 5 },
        { id: 17, name: 'Diana Kartika', text: 'Sudah 6 bulan bergabung, tidak pernah kecewa! Rp 4.600.000/bulan.', rating: 5 },
        { id: 18, name: 'Eko Pratama', text: 'Program yang mengubah hidup saya! Total Rp 25.000.000.', rating: 5 },
        { id: 19, name: 'Fitri Handayani', text: 'Komisi besar, produk laku keras! Rp 6.100.000/bulan.', rating: 5 },
        { id: 20, name: 'Gilang Wibowo', text: 'Dapat bonus tambahan setiap bulan! Rp 3.200.000 + bonus.', rating: 5 },
        { id: 21, name: 'Citra Dewi', text: 'Sangat puas dengan pelayanan admin! Rp 4.800.000/bulan.', rating: 5 },
        { id: 22, name: 'Reza Pahlevi', text: 'Modal kecil, untung besar! Rp 5.300.000/bulan.', rating: 5 },
        { id: 23, name: 'Nina Susanti', text: 'Sudah ajak teman-teman, semua suka! Rp 3.500.000/bulan.', rating: 5 },
        { id: 24, name: 'Omar Hakim', text: 'Affiliate termudah yang pernah ada! Rp 2.800.000/bulan.', rating: 5 },
        { id: 25, name: 'Putri Indah', text: 'Dapat komisi tiap hari, seru! Rp 4.200.000/bulan.', rating: 5 },
        { id: 26, name: 'Qori Ahmad', text: 'Sistem pembayaran paling cepat! Rp 5.600.000/bulan.', rating: 5 },
        { id: 27, name: 'Rani Amelia', text: 'Recommended banget untuk semua kalangan! Rp 3.900.000/bulan.', rating: 5 }
    ];

    // Function to generate star rating HTML
    function generateStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += `<i class="fas fa-star ${i < rating ? 'filled' : ''}" style="color: ${i < rating ? 'gold' : '#ccc'};"></i>`;
        }
        return stars;
    }

    // Function to update display
    function updateTestimonialsDisplay() {
        track.innerHTML = '';
        
        // Create two sets for smooth scrolling
        const doubledTestimonials = [...testimonials, ...testimonials];
        
        doubledTestimonials.forEach((testimonial) => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.innerHTML = `
                <div class="testimonial-header">
                    <div class="testimonial-avatar">${testimonial.name.charAt(0)}</div>
                    <div>
                        <div class="testimonial-name">${testimonial.name}</div>
                        <div class="testimonial-rating">
                            ${generateStars(testimonial.rating)}
                        </div>
                    </div>
                </div>
                <div class="testimonial-text">"${testimonial.text}"</div>
            `;
            track.appendChild(card);
        });
    }

    // Initial display
    updateTestimonialsDisplay();
}

// Notifications - Generate Penarikan dengan Auto Scroll (Lebih Cepat)
async function generateNotifications() {
    const scroll = document.getElementById('notificationsScroll');
    if (!scroll) return;

    // Array untuk menyimpan notifikasi
    let notifications = [];
    
    // Load existing notifications from Firebase or localStorage
    if (window.firebaseService && window.firebaseService.isInitialized()) {
        notifications = await window.firebaseService.getWithdrawalNotifications();
    } else {
        const savedNotifications = localStorage.getItem('withdrawalNotifications');
        if (savedNotifications) {
            notifications = JSON.parse(savedNotifications);
        }
    }
    
    if (notifications.length === 0) {
        // Initial notifications - hanya level Master ke atas
        notifications = [
            { id: 1, maskedPhone: '8812*****04', level: 'epic', amount: 42300000, timestamp: Date.now() - 3600000 },
            { id: 2, maskedPhone: '7654*****12', level: 'legend', amount: 28500000, timestamp: Date.now() - 7200000 },
            { id: 3, maskedPhone: '5432*****09', level: 'mytic', amount: 15750000, timestamp: Date.now() - 10800000 },
            { id: 4, maskedPhone: '9876*****15', level: 'master', amount: 31200000, timestamp: Date.now() - 14400000 },
            { id: 5, maskedPhone: '2345*****08', level: 'grandmaster', amount: 12800000, timestamp: Date.now() - 18000000 }
        ];
        
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateWithdrawalNotifications(notifications);
        } else {
            localStorage.setItem('withdrawalNotifications', JSON.stringify(notifications));
        }
    }

    // Function to generate random phone number
    function generateRandomPhone() {
        const prefix = Math.floor(Math.random() * 9000) + 1000;
        const suffix = Math.floor(Math.random() * 90000) + 10000;
        return `${prefix}*****${suffix.toString().slice(-2)}`;
    }

    // Function to generate random amount (min 5,000,000)
    function generateRandomAmount() {
        const min = 5000000;
        const max = 50000000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Function to generate new notification - HANYA LEVEL MASTER KE ATAS
    async function generateNewNotification() {
        // Hanya level Master ke atas, tanpa Warrior
        const levels = ['Master', 'Grandmaster', 'Epic', 'Legend', 'Mytic'];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        
        const newNotification = {
            id: Date.now(),
            maskedPhone: generateRandomPhone(),
            level: randomLevel,
            amount: generateRandomAmount(),
            timestamp: Date.now()
        };
        
        // Add to beginning of array
        notifications.unshift(newNotification);
        
        // Keep only last 20 notifications
        if (notifications.length > 20) {
            notifications = notifications.slice(0, 20);
        }
        
        // Save to Firebase or localStorage
        if (window.firebaseService && window.firebaseService.isInitialized()) {
            await window.firebaseService.updateWithdrawalNotifications(notifications);
        } else {
            localStorage.setItem('withdrawalNotifications', JSON.stringify(notifications));
        }
        
        // Update display
        updateNotificationsDisplay();
    }

    // Function to update display dengan auto scroll lebih cepat
    function updateNotificationsDisplay() {
        scroll.innerHTML = '';
        
        // Create container untuk scrolling
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'notifications-track';
        // Durasi scroll dipercepat dari 25s menjadi 15s
        scrollContainer.style.animation = 'scrollNotifications 25s linear infinite';
        
        // Create dua set untuk smooth looping
        const doubledNotifications = [...notifications, ...notifications];
        
        doubledNotifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> 
                ${notification.maskedPhone} 
                <span class="level-badge level-${notification.level}">${notification.level}</span>
                ${formatCurrency(notification.amount)}
            `;
            scrollContainer.appendChild(item);
        });
        
        scroll.appendChild(scrollContainer);
    }

    // Initial display
    updateNotificationsDisplay();

    // Set up auto-generation setiap 30 menit (dari 10 detik)
    setInterval(generateNewNotification, 1800000);

    // Make function globally accessible
    window.generateNewNotification = generateNewNotification;
}

// Update Real-time
function checkForUpdates() {
    if (currentUser && currentPage === 'dashboardPage') {
        updateDashboard();
    }
}

// Image Preview Function
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const currentImage = document.getElementById('currentImage');
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                <p style="margin-top: 10px; color: var(--success);">Gambar dipilih: ${file.name}</p>
            `;
            uploadedImageUrl = e.target.result; // Temporary preview
        };
        
        reader.readAsDataURL(file);
    }
}

// Remove Current Image
function removeCurrentImage() {
    currentProductImage = null;
    document.getElementById('currentImage').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('productImage').value = '';
}

// Mencegah kembali ke landing page saat refresh
window.addEventListener('beforeunload', function() {
    if (currentUser) {
        localStorage.setItem('lastPage', currentPage);
    }
});

window.addEventListener('load', function() {
    const lastPage = localStorage.getItem('lastPage');
    if (lastPage && currentUser) {
        showPage(lastPage);
    }
});

// Tutup modal saat klik di luar
document.getElementById('modalOverlay').addEventListener('click', closeModal);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
