// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXiyBtNYDNfmDGDkqVOs_8DFU40zi2cZA",
    authDomain: "affiliatepro-app.firebaseapp.com",
    databaseURL: "https://affiliatepro-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "affiliatepro-app",
    storageBucket: "affiliatepro-app.firebasestorage.app",
    messagingSenderId: "457035654100",
    appId: "1:457035654100:web:74b5896e1dc384b3c9ec41",
    measurementId: "G-GZFRL4TGN1"
};

// Initialize Firebase
let db = null;
let auth = null;

// Initialize Firebase when script loads
(function() {
    console.log('Firebase.js loaded');
    
    // Initialize immediately
    initializeFirebase();
})();

function initializeFirebase() {
    try {
        // Set global status
        window.servicesReady = window.servicesReady || {};
        window.servicesReady.firebase = false;
        
        // Check if Firebase is already loaded
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            setupFirebase();
            return;
        }
        
        // Load Firebase SDK if not already loaded
        console.log('Loading Firebase SDK...');
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
        script.onload = function() {
            console.log('Firebase app SDK loaded');
            loadFirebaseModules();
        };
        script.onerror = function() {
            console.error('Failed to load Firebase SDK');
            window.servicesReady.firebase = true;
            window.firebaseInitialized = false;
        };
        document.head.appendChild(script);
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        window.servicesReady.firebase = true;
        window.firebaseInitialized = false;
    }
}

function loadFirebaseModules() {
    try {
        // Load Firebase modules
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
        ];
        
        let loadedCount = 0;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = function() {
                loadedCount++;
                console.log(`Firebase module loaded: ${src}`);
                if (loadedCount === scripts.length) {
                    setupFirebase();
                }
            };
            script.onerror = function() {
                console.error('Failed to load Firebase module:', src);
                loadedCount++;
                if (loadedCount === scripts.length) {
                    setupFirebase();
                }
            };
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error('Error loading Firebase modules:', error);
        window.servicesReady.firebase = true;
        window.firebaseInitialized = false;
    }
}

function setupFirebase() {
    try {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase app initialized');
        }
        
        db = firebase.database();
        auth = firebase.auth();
        window.firebaseInitialized = true;
        window.servicesReady.firebase = true;
        
        console.log('Firebase initialized successfully');
        
        // Set up auth state listener
        if (auth) {
            auth.onAuthStateChanged(function(user) {
                if (user) {
                    console.log('User is signed in:', user.uid);
                } else {
                    console.log('User is signed out');
                }
            });
        }
        
        // Set up real-time sync if other services are ready
        if (window.servicesReady.cloudinary) {
            setupRealtimeSync();
        }
        
    } catch (error) {
        console.error('Error setting up Firebase:', error);
        window.firebaseInitialized = false;
        window.servicesReady.firebase = true;
    }
}

// Firebase Service Object
window.firebaseService = {
    initialize: function() {
        console.log('FirebaseService.initialize() called');
        // Firebase is already initialized during script load
        return window.firebaseInitialized;
    },
    
    isInitialized: function() {
        return window.firebaseInitialized && db !== null;
    },
    
    // Users operations
    getUsers: async function() {
        if (!this.isInitialized()) {
            // Fallback to localStorage
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        }
        
        try {
            const snapshot = await db.ref('users').once('value');
            const data = snapshot.val();
            return data ? Object.values(data) : [];
        } catch (error) {
            console.error('Error getting users:', error);
            // Fallback to localStorage
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        }
    },
    
    updateUsers: async function(users) {
        if (!this.isInitialized()) {
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        
        try {
            await db.ref('users').set(users);
            // Also save to localStorage as backup
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error updating users:', error);
            // Fallback to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            return false;
        }
    },
    
    updateUser: async function(userId, userData) {
        if (!this.isInitialized()) {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...userData };
                localStorage.setItem('users', JSON.stringify(users));
                return true;
            }
            return false;
        }
        
        try {
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...userData };
                await this.updateUsers(users);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    },
    
    syncUsers: function(callback) {
        if (!this.isInitialized()) {
            // Fallback - just call once with localStorage data
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            callback(users);
            return;
        }
        
        try {
            db.ref('users').on('value', function(snapshot) {
                const data = snapshot.val();
                const users = data ? Object.values(data) : [];
                callback(users);
                // Also update localStorage
                localStorage.setItem('users', JSON.stringify(users));
            });
        } catch (error) {
            console.error('Error syncing users:', error);
        }
    },
    
    // Products operations
    getProducts: async function() {
        if (!this.isInitialized()) {
            const products = localStorage.getItem('products');
            return products ? JSON.parse(products) : [];
        }
        
        try {
            const snapshot = await db.ref('products').once('value');
            const data = snapshot.val();
            return data ? Object.values(data) : [];
        } catch (error) {
            console.error('Error getting products:', error);
            const products = localStorage.getItem('products');
            return products ? JSON.parse(products) : [];
        }
    },
    
    updateProducts: async function(products) {
        if (!this.isInitialized()) {
            localStorage.setItem('products', JSON.stringify(products));
            return true;
        }
        
        try {
            await db.ref('products').set(products);
            localStorage.setItem('products', JSON.stringify(products));
            return true;
        } catch (error) {
            console.error('Error updating products:', error);
            localStorage.setItem('products', JSON.stringify(products));
            return false;
        }
    },
    
    syncProducts: function(callback) {
        if (!this.isInitialized()) {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            callback(products);
            return;
        }
        
        try {
            db.ref('products').on('value', function(snapshot) {
                const data = snapshot.val();
                const products = data ? Object.values(data) : [];
                callback(products);
                localStorage.setItem('products', JSON.stringify(products));
            });
        } catch (error) {
            console.error('Error syncing products:', error);
        }
    },
    
    // Settings operations
    getSettings: async function() {
        if (!this.isInitialized()) {
            const settings = localStorage.getItem('settings');
            return settings ? JSON.parse(settings) : {};
        }
        
        try {
            const snapshot = await db.ref('settings').once('value');
            const data = snapshot.val();
            return data || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            const settings = localStorage.getItem('settings');
            return settings ? JSON.parse(settings) : {};
        }
    },
    
    updateSettings: async function(settings) {
        if (!this.isInitialized()) {
            localStorage.setItem('settings', JSON.stringify(settings));
            return true;
        }
        
        try {
            await db.ref('settings').set(settings);
            localStorage.setItem('settings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            localStorage.setItem('settings', JSON.stringify(settings));
            return false;
        }
    },
    
    syncSettings: function(callback) {
        if (!this.isInitialized()) {
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            callback(settings);
            return;
        }
        
        try {
            db.ref('settings').on('value', function(snapshot) {
                const data = snapshot.val();
                callback(data || {});
                localStorage.setItem('settings', JSON.stringify(data || {}));
            });
        } catch (error) {
            console.error('Error syncing settings:', error);
        }
    },
    
    // Testimonials operations
    getTestimonials: async function() {
        if (!this.isInitialized()) {
            const testimonials = localStorage.getItem('testimonials');
            return testimonials ? JSON.parse(testimonials) : [];
        }
        
        try {
            const snapshot = await db.ref('testimonials').once('value');
            const data = snapshot.val();
            return data ? Object.values(data) : [];
        } catch (error) {
            console.error('Error getting testimonials:', error);
            const testimonials = localStorage.getItem('testimonials');
            return testimonials ? JSON.parse(testimonials) : [];
        }
    },
    
    updateTestimonials: async function(testimonials) {
        if (!this.isInitialized()) {
            localStorage.setItem('testimonials', JSON.stringify(testimonials));
            return true;
        }
        
        try {
            await db.ref('testimonials').set(testimonials);
            localStorage.setItem('testimonials', JSON.stringify(testimonials));
            return true;
        } catch (error) {
            console.error('Error updating testimonials:', error);
            localStorage.setItem('testimonials', JSON.stringify(testimonials));
            return false;
        }
    },
    
    // Withdrawal notifications operations
    getWithdrawalNotifications: async function() {
        if (!this.isInitialized()) {
            const notifications = localStorage.getItem('withdrawalNotifications');
            return notifications ? JSON.parse(notifications) : [];
        }
        
        try {
            const snapshot = await db.ref('withdrawalNotifications').once('value');
            const data = snapshot.val();
            return data ? Object.values(data) : [];
        } catch (error) {
            console.error('Error getting withdrawal notifications:', error);
            const notifications = localStorage.getItem('withdrawalNotifications');
            return notifications ? JSON.parse(notifications) : [];
        }
    },
    
    updateWithdrawalNotifications: async function(notifications) {
        if (!this.isInitialized()) {
            localStorage.setItem('withdrawalNotifications', JSON.stringify(notifications));
            return true;
        }
        
        try {
            await db.ref('withdrawalNotifications').set(notifications);
            localStorage.setItem('withdrawalNotifications', JSON.stringify(notifications));
            return true;
        } catch (error) {
            console.error('Error updating withdrawal notifications:', error);
            localStorage.setItem('withdrawalNotifications', JSON.stringify(notifications));
            return false;
        }
    }
};