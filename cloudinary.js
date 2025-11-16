// Cloudinary Configuration
const cloudinaryConfig = {
  cloudName: 'dwkky1rp9',
  apiKey: '556278516576121',
  apiSecret: 'WVHLiT97gO9jBCSOwjxYFCJojrs',
  uploadPreset: 'affiliate_products'
};

// Cloudinary Service Object
window.cloudinaryService = {
  initialized: false,
  
  initialize: function() {
    try {
      console.log('Initializing Cloudinary...');
      
      // Set global status
      window.servicesReady = window.servicesReady || {};
      window.servicesReady.cloudinary = false;
      
      // Check if Cloudinary is already loaded
      if (typeof window.cloudinary !== 'undefined') {
        this.cloudinary = window.cloudinary;
        this.initialized = true;
        console.log('Cloudinary initialized successfully');
        window.servicesReady.cloudinary = true;
        this.checkAllServicesReady();
        return true;
      } else {
        // Load Cloudinary SDK if not already loaded
        this.loadCloudinarySDK();
        return false;
      }
    } catch (error) {
      console.error('Error initializing Cloudinary:', error);
      this.initialized = false;
      window.servicesReady.cloudinary = true;
      this.checkAllServicesReady();
      return false;
    }
  },
  
  loadCloudinarySDK: function() {
    console.log('Loading Cloudinary SDK...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/cloudinary-core@2.13.0/cloudinary-core-shrinkwrap.min.js';
    script.onload = () => {
      console.log('Cloudinary core loaded');
      // Load upload widget
      const uploadScript = document.createElement('script');
      uploadScript.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      uploadScript.onload = () => {
        console.log('Cloudinary upload widget loaded');
        this.initialize();
      };
      uploadScript.onerror = () => {
        console.log('Cloudinary upload widget failed to load');
        this.initialized = false;
        window.servicesReady.cloudinary = true;
        this.checkAllServicesReady();
      };
      document.head.appendChild(uploadScript);
    };
    script.onerror = () => {
      console.log('Cloudinary core failed to load');
      this.initialized = false;
      window.servicesReady.cloudinary = true;
      this.checkAllServicesReady();
    };
    document.head.appendChild(script);
  },
  
  isInitialized: function() {
    return this.initialized;
  },
  
  checkAllServicesReady: function() {
    // Check if all services are ready
    if (window.servicesReady.firebase && window.servicesReady.cloudinary) {
      console.log('All services are ready!');
      window.appReady = true;
      
      // Trigger app initialization if script.js is waiting
      if (typeof window.initializeApp === 'function') {
        window.initializeApp();
      }
    }
  },
  
  uploadImage: function(file, productId, onProgress = null) {
    return new Promise((resolve, reject) => {
      if (!this.initialized) {
        console.log('Cloudinary not initialized, using base64 fallback');
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      formData.append('folder', 'affiliate_products');
      formData.append('public_id', `product_${productId}_${Date.now()}`);
      
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error('No secure URL in response'));
            }
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Upload failed due to network error'));
      };
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, true);
      xhr.send(formData);
    });
  },
  
  deleteImage: function(imageUrl) {
    return new Promise((resolve, reject) => {
      // Note: Deleting images requires server-side authentication
      // This is a placeholder for client-side approach
      console.log(`Delete request for image: ${imageUrl}`);
      
      // Simulate deletion (in production, this should be a server call)
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  },
  
  // Get optimized image URL
  getOptimizedUrl: function(imageUrl, options = {}) {
    if (!this.initialized || !imageUrl) {
      return imageUrl;
    }
    
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      crop: 'fill',
      width: 300,
      height: 200
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      // Build transformation string
      const transformations = [];
      Object.keys(finalOptions).forEach(key => {
        if (finalOptions[key]) {
          transformations.push(`${key}_${finalOptions[key]}`);
        }
      });
      
      const transformationString = transformations.join(',');
      
      // Insert transformation into URL
      const urlParts = imageUrl.split('/');
      const versionIndex = urlParts.findIndex(part => part.includes('v'));
      
      if (versionIndex !== -1) {
        urlParts.splice(versionIndex + 1, 0, transformationString);
        return urlParts.join('/');
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Error optimizing image URL:', error);
      return imageUrl;
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      window.cloudinaryService.initialize();
    }, 500);
  });
} else {
  setTimeout(() => {
    window.cloudinaryService.initialize();
  }, 500);
}