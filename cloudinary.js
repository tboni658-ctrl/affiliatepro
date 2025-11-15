// Cloudinary Service untuk Upload Gambar
class CloudinaryService {
  constructor() {
    this.cloudName = 'dwkky1rp9';
    this.apiKey = '556278516576121';
    this.apiSecret = 'WVHLiT97gO9jBCSOwjxYFCJojrs';
    this.uploadPreset = 'affiliate_products';
    this.initialized = false;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB max
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  }
  
  // Inisialisasi service
  initialize() {
    if (this.apiKey && this.apiSecret && this.cloudName) {
      this.initialized = true;
      console.log('✅ Cloudinary service initialized!');
      console.log('📸 Cloud name:', this.cloudName);
      return true;
    } else {
      console.error('❌ Cloudinary credentials not complete');
      return false;
    }
  }
  
  // Validate file before upload
  validateFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    }
    
    if (file.size > this.maxFileSize) {
      throw new Error('File too large. Maximum size is 5MB');
    }
    
    return true;
  }
  
  // Upload image ke Cloudinary dengan progress tracking
  async uploadImage(file, productId, onProgress = null) {
    if (!this.initialized) {
      throw new Error('Cloudinary service not initialized');
    }
    
    try {
      // Validate file
      this.validateFile(file);
      
      // Create form data untuk unsigned upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('public_id', `product_${productId}_${Date.now()}`);
      formData.append('folder', 'affiliate_products');
      
      // Create XMLHttpRequest untuk progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              onProgress(progress);
            }
          });
        }
        
        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              console.log('✅ Upload successful:', response.secure_url);
              resolve(response.secure_url);
            } else {
              reject(new Error('Upload failed: No URL returned'));
            }
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        // Open and send request
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, true);
        xhr.send(formData);
      });
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }
  
  // Delete image dari Cloudinary (optional, memerlukan signed request)
  async deleteImage(imageUrl) {
    if (!this.initialized) {
      console.log('⚠️ Cloudinary service not initialized');
      return false;
    }
    
    try {
      // Extract public_id dari URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const publicId = `affiliate_products/${fileName.split('.')[0]}`;
      
      // Generate signature untuk delete
      const timestamp = Math.round(new Date().getTime() / 1000);
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
      
      // Create SHA-1 signature
      const signature = await this.generateSHA1(stringToSign);
      
      // Create form data untuk delete
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('signature', signature);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.result === 'ok') {
        console.log('✅ Image deleted successfully:', imageUrl);
        return true;
      } else {
        console.error('❌ Failed to delete image:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return false;
    }
  }
  
  // Generate SHA-1 signature
  async generateSHA1(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  // Get file info
  getFileInfo() {
    return {
      maxFileSize: this.maxFileSize,
      allowedTypes: this.allowedTypes,
      maxSizeMB: this.maxFileSize / (1024 * 1024),
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset
    };
  }
  
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
window.cloudinaryService = new CloudinaryService();

// Auto-initialize when imported
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dengan credentials yang ada
  window.cloudinaryService.initialize();
});
