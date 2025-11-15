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

// Firebase Service untuk Real-time Sync
class FirebaseService {
  constructor() {
    this.db = null;
    this.app = null;
    this.initialized = false;
    this.listeners = new Map();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Import Firebase SDK
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
      const { getDatabase, ref, onValue, set, get, update, remove } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;

      console.log('✅ Firebase connected successfully!');
      console.log('📊 Database URL:', firebaseConfig.databaseURL);
      
      // Initialize data dari localStorage ke Firebase
      this.initializeDataFromLocalStorage();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      this.initialized = false;
      return false;
    }
  }

  // Get Firebase app instance for Storage
  getApp() {
    return this.app;
  }

  // Initialize data dari localStorage ke Firebase
  async initializeDataFromLocalStorage() {
    if (!this.initialized) return;

    try {
      // Sync users
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (localUsers.length > 0) {
        await this.updateUsers(localUsers);
        console.log('📥 Users synced to Firebase:', localUsers.length);
      }

      // Sync products
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (localProducts.length > 0) {
        await this.updateProducts(localProducts);
        console.log('📥 Products synced to Firebase:', localProducts.length);
      }

      // Sync settings
      const localSettings = JSON.parse(localStorage.getItem('settings') || '{}');
      if (Object.keys(localSettings).length > 0) {
        await this.updateSettings(localSettings);
        console.log('📥 Settings synced to Firebase');
      }
    } catch (error) {
      console.error('Error initializing data from localStorage:', error);
    }
  }

  // Sync data users
  async syncUsers(callback) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, using localStorage fallback');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      callback(users);
      return;
    }

    try {
      const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const usersRef = ref(this.db, 'users');
      
      const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const users = data ? Object.values(data) : [];
        
        console.log('🔄 Users synced from Firebase:', users.length);
        
        // Update localStorage sebagai backup
        localStorage.setItem('users', JSON.stringify(users));
        callback(users);
      });

      // Store unsubscribe function
      this.listeners.set('users', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing users:', error);
      // Fallback ke localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      callback(users);
    }
  }

  // Sync data products
  async syncProducts(callback) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, using localStorage fallback');
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      callback(products);
      return;
    }

    try {
      const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const productsRef = ref(this.db, 'products');
      
      const unsubscribe = onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        
        console.log('🔄 Products synced from Firebase:', products.length);
        
        // Update localStorage sebagai backup
        localStorage.setItem('products', JSON.stringify(products));
        callback(products);
      });

      // Store unsubscribe function
      this.listeners.set('products', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing products:', error);
      // Fallback ke localStorage
      const products = JSON.parse(localStorage.getItem('products')) || '[]';
      callback(products);
    }
  }

  // Sync data settings
  async syncSettings(callback) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, using localStorage fallback');
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      callback(settings);
      return;
    }

    try {
      const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const settingsRef = ref(this.db, 'settings');
      
      const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        const settings = data || {};
        
        console.log('🔄 Settings synced from Firebase');
        
        // Update localStorage sebagai backup
        localStorage.setItem('settings', JSON.stringify(settings));
        callback(settings);
      });

      // Store unsubscribe function
      this.listeners.set('settings', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing settings:', error);
      // Fallback ke localStorage
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      callback(settings);
    }
  }

  // Update users di Firebase
  async updateUsers(users) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, users not synced');
      return false;
    }

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const usersRef = ref(this.db, 'users');
      await set(usersRef, users);
      
      console.log('✅ Users updated to Firebase:', users.length);
      
      // Update localStorage sebagai backup
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('❌ Error updating users:', error);
      return false;
    }
  }

  // Update products di Firebase
  async updateProducts(products) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, products not synced');
      return false;
    }

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const productsRef = ref(this.db, 'products');
      await set(productsRef, products);
      
      console.log('✅ Products updated to Firebase:', products.length);
      
      // Update localStorage sebagai backup
      localStorage.setItem('products', JSON.stringify(products));
      return true;
    } catch (error) {
      console.error('❌ Error updating products:', error);
      return false;
    }
  }

  // Update settings di Firebase
  async updateSettings(settings) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, settings not synced');
      return false;
    }

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const settingsRef = ref(this.db, 'settings');
      await set(settingsRef, settings);
      
      console.log('✅ Settings updated to Firebase');
      
      // Update localStorage sebagai backup
      localStorage.setItem('settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      return false;
    }
  }

  // Update user data spesifik
  async updateUser(userId, userData) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, user not synced');
      return false;
    }

    try {
      const { ref, update } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const userRef = ref(this.db, `users/${userId}`);
      await update(userRef, userData);
      
      console.log('✅ User updated to Firebase:', userId);
      
      // Update localStorage sebagai backup
      const users = JSON.parse(localStorage.getItem('users') || []);
      const userIndex = users.findIndex(u => u.id == userId);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  }

  // Stop listening untuk specific data type
  stopListening(dataType) {
    const unsubscribe = this.listeners.get(dataType);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(dataType);
      console.log(`🔇 Stopped listening to ${dataType}`);
    }
  }

  // Stop all listeners
  stopAllListeners() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    console.log('🔇 Stopped all listeners');
  }

  isInitialized() {
    return this.initialized;
  }

  getConnectionInfo() {
    return {
      initialized: this.initialized,
      databaseURL: firebaseConfig.databaseURL,
      projectId: firebaseConfig.projectId,
      listenersCount: this.listeners.size
    };
  }
}

// Export singleton instance
window.firebaseService = new FirebaseService();

// Auto-initialize when imported
window.firebaseService.initialize().then(success => {
  if (success) {
    console.log('🚀 Firebase service ready for real-time sync!');
  } else {
    console.log('⚠️ Firebase service failed, using localStorage fallback');
  }
}).catch(console.error);
