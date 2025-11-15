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
      
      // --- PERUBAHAN KRUSIAL: NONAKTIFKAN INISIALISASI DARI LOCALSTORAGE ---
      // Fungsi ini adalah penyebab data hilang karena menimpa data server dengan data klien.
      // Jika Anda ingin memindahkan data dari localStorage lama, jalankan sekali lalu nonaktifkan kembali.
      // this.initializeDataFromLocalStorage();
      
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

  // --- FUNGSI-FUNGSI BARU YANG LEBIH AMAN ---

  // Tambahkan satu user baru ke database
  async addNewUser(userId, userData) {
    if (!this.initialized) {
      console.error('⚠️ Firebase not initialized, user not added');
      return false;
    }
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const userRef = ref(this.db, `users/${userId}`); // Path spesifik ke user
      await set(userRef, userData);
      console.log('✅ New user added to Firebase:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error adding new user:', error);
      return false;
    }
  }

  // Ambil data satu user berdasarkan ID
  async getUserById(userId) {
    if (!this.initialized) return null;
    try {
      const { ref, get } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const userRef = ref(this.db, `users/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // --- FUNGSI BARU: Cari user berdasarkan email ---
  async getUserByEmail(email) {
    if (!this.initialized) return null;
    try {
      const { ref, get } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const usersRef = ref(this.db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        // Cari user yang emailnya cocok
        for (const userId in users) {
          if (users[userId].email === email) {
            return { id: userId, ...users[userId] };
          }
        }
      }
      return null; // Tidak ditemukan
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  // Hapus satu user berdasarkan ID
  async deleteUser(userId) {
    if (!this.initialized) {
      console.error('⚠️ Firebase not initialized, user not deleted');
      return false;
    }
    try {
      const { ref, remove } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const userRef = ref(this.db, `users/${userId}`);
      await remove(userRef);
      console.log('✅ User deleted from Firebase:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }

  // --- FUNGSI SYNC YANG SUDAH DIPERBAIKI ---
  // Sync data users (membaca dari Firebase dan mengubahnya menjadi array untuk frontend)
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
        // Ubah objek menjadi array agar mudah digunakan di frontend
        const users = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        
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

  // Sync data products
  async syncProducts(callback) {
    if (!this.initialized) {
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

  // Sync data settings
  async syncSettings(callback) {
    if (!this.initialized) {
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
        localStorage.setItem('settings', JSON.stringify(settings));
        callback(settings);
      });
      this.listeners.set('settings', unsubscribe);
    } catch (error) {
      console.error('❌ Error syncing settings:', error);
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      callback(settings);
    }
  }

  // --- FUNGSI LAMA (HAPUS SAAT ANDA SUDAH SIAP) ---
  // Fungsi-fungsi ini berbahaya karena menimpa seluruh data.
  // Sebaiknya beralih ke fungsi baru (addNewUser, updateUser, deleteUser).
  
  async updateUsers(users) {
    console.warn("⚠️ updateUsers() is deprecated and can cause data loss. Use addNewUser() or updateUser() instead.");
    if (!this.initialized) return false;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const usersRef = ref(this.db, 'users');
      await set(usersRef, users);
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('❌ Error updating users:', error);
      return false;
    }
  }

  async updateProducts(products) {
    if (!this.initialized) return false;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const productsRef = ref(this.db, 'products');
      await set(productsRef, products);
      localStorage.setItem('products', JSON.stringify(products));
      return true;
    } catch (error) {
      console.error('❌ Error updating products:', error);
      return false;
    }
  }

  async updateSettings(settings) {
    if (!this.initialized) return false;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const settingsRef = ref(this.db, 'settings');
      await set(settingsRef, settings);
      localStorage.setItem('settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      return false;
    }
  }

  // Update user data spesifik (ini sudah aman)
  async updateUser(userId, userData) {
    if (!this.initialized) return false;
    try {
      const { ref, update } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js');
      const userRef = ref(this.db, `users/${userId}`);
      await update(userRef, userData);
      console.log('✅ User updated to Firebase:', userId);
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
