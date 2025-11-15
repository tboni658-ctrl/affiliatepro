// Firebase Service untuk Real-time Sync - FIXED VERSION
class FirebaseService {
  constructor() {
    this.db = null;
    this.app = null;
    this.initialized = false;
    this.listeners = new Map();
    this.adminCode = '521389'; // Store admin code
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Import Firebase SDK
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
      const { getDatabase, ref, onValue, set, get, update, remove, push } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;

      console.log('✅ Firebase connected successfully!');
      
      // Initialize data dari localStorage ke Firebase
      await this.initializeDataFromLocalStorage();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      this.initialized = false;
      return false;
    }
  }

  // Get Firebase app instance
  getApp() {
    return this.app;
  }

  // Initialize data dari localStorage ke Firebase - FIXED
  async initializeDataFromLocalStorage() {
    if (!this.initialized) return;

    try {
      // Sync users dengan proper structure
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (localUsers.length > 0) {
        // Convert array to object for Firebase
        const usersObject = {};
        localUsers.forEach(user => {
          usersObject[user.id] = user;
        });
        await this.updateUsersObject(usersObject);
        console.log('📥 Users synced to Firebase:', Object.keys(usersObject).length);
      }

      // Sync products dengan proper structure
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (localProducts.length > 0) {
        const productsObject = {};
        localProducts.forEach(product => {
          productsObject[product.id] = product;
        });
        await this.updateProductsObject(productsObject);
        console.log('📥 Products synced to Firebase:', Object.keys(productsObject).length);
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

  // Sync data users - FIXED
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
        let users = [];
        
        if (data) {
          // Convert object to array for compatibility
          users = Object.values(data);
        }
        
        console.log('🔄 Users synced from Firebase:', users.length);
        
        // Update localStorage sebagai backup
        localStorage.setItem('users', JSON.stringify(users));
        callback(users);
      });

      this.listeners.set('users', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing users:', error);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      callback(users);
    }
  }

  // Sync data products - FIXED
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
        let products = [];
        
        if (data) {
          products = Object.values(data);
        }
        
        console.log('🔄 Products synced from Firebase:', products.length);
        
        localStorage.setItem('products', JSON.stringify(products));
        callback(products);
      });

      this.listeners.set('products', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing products:', error);
      const products = JSON.parse(localStorage.getItem('products')) || '[]';
      callback(products);
    }
  }

  // Update users di Firebase - FIXED
  async updateUsers(users) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, users not synced');
      return false;
    }

    try {
      // Convert array to object
      const usersObject = {};
      users.forEach(user => {
        usersObject[user.id] = user;
      });
      
      return await this.updateUsersObject(usersObject);
    } catch (error) {
      console.error('❌ Error updating users:', error);
      return false;
    }
  }

  // Update users object di Firebase - NEW
  async updateUsersObject(usersObject) {
    if (!this.initialized) return false;

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const usersRef = ref(this.db, 'users');
      await set(usersRef, usersObject);
      
      console.log('✅ Users updated to Firebase:', Object.keys(usersObject).length);
      
      // Update localStorage sebagai backup
      const usersArray = Object.values(usersObject);
      localStorage.setItem('users', JSON.stringify(usersArray));
      return true;
    } catch (error) {
      console.error('❌ Error updating users object:', error);
      return false;
    }
  }

  // Update products di Firebase - FIXED
  async updateProducts(products) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, products not synced');
      return false;
    }

    try {
      // Convert array to object
      const productsObject = {};
      products.forEach(product => {
        productsObject[product.id] = product;
      });
      
      return await this.updateProductsObject(productsObject);
    } catch (error) {
      console.error('❌ Error updating products:', error);
      return false;
    }
  }

  // Update products object di Firebase - NEW
  async updateProductsObject(productsObject) {
    if (!this.initialized) return false;

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const productsRef = ref(this.db, 'products');
      await set(productsRef, productsObject);
      
      console.log('✅ Products updated to Firebase:', Object.keys(productsObject).length);
      
      // Update localStorage sebagai backup
      const productsArray = Object.values(productsObject);
      localStorage.setItem('products', JSON.stringify(productsArray));
      return true;
    } catch (error) {
      console.error('❌ Error updating products object:', error);
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
      localStorage.setItem('settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      return false;
    }
  }

  // Update user data spesifik - COMPLETELY FIXED
  async updateUser(userId, userData) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, user not synced');
      return false;
    }

    try {
      const { ref, get, update } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      
      // Get current user data
      const userRef = ref(this.db, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        console.error('❌ User not found in Firebase:', userId);
        return false;
      }
      
      // Update specific user node
      await update(userRef, userData);
      
      // Update localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userIndex = users.findIndex(u => u.id == userId);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      console.log('✅ User updated in Firebase:', userId);
      return true;
      
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  }

  // Delete user - COMPLETELY FIXED
  async deleteUser(userId) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, user not deleted');
      return false;
    }

    try {
      const { ref, remove } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      
      // Delete specific user node
      const userRef = ref(this.db, `users/${userId}`);
      await remove(userRef);
      
      // Update localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const filteredUsers = users.filter(u => u.id != userId);
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      
      console.log('✅ User deleted from Firebase:', userId);
      return true;
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }

  // Delete product - COMPLETELY FIXED
  async deleteProduct(productId) {
    if (!this.initialized) {
      console.log('⚠️ Firebase not initialized, product not deleted');
      return false;
    }

    try {
      const { ref, remove } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      
      // Delete specific product node
      const productRef = ref(this.db, `products/${productId}`);
      await remove(productRef);
      
      // Update localStorage
      const products = JSON.parse(localStorage.getItem('products')) || [];
      const filteredProducts = products.filter(p => p.id != productId);
      localStorage.setItem('products', JSON.stringify(filteredProducts));
      
      console.log('✅ Product deleted from Firebase:', productId);
      return true;
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      return false;
    }
  }

  // Validate admin access - NEW
  validateAdminAccess(code) {
    return code === this.adminCode;
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
