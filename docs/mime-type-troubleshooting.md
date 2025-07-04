# MIME Type Upload Error Troubleshooting Guide

## 1. Common Causes of "mime type application/json is not supported" Error

### Primary Causes:
- **File Extension Mismatch**: File has wrong extension (e.g., `.json` instead of `.jpg`)
- **Server Configuration**: Upload endpoint only accepts specific MIME types
- **File Corruption**: File headers are corrupted or modified
- **Browser Detection Issues**: Browser incorrectly identifies file type
- **Storage Service Restrictions**: Cloud storage (like Supabase) has MIME type allowlists

### In Your Supabase Context:
Looking at your storage configuration, the `site-images` bucket only allows:
```sql
ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
```

## 2. How to Verify Current File Format and MIME Type

### Frontend JavaScript Methods:

```javascript
// Method 1: Check file.type property
function checkFileType(file) {
  console.log('File name:', file.name);
  console.log('File type (MIME):', file.type);
  console.log('File size:', file.size);
  console.log('Last modified:', file.lastModified);
}

// Method 2: Read file headers to detect actual format
function detectActualMimeType(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      
      // Common file signatures
      const signatures = {
        '89504e47': 'image/png',
        'ffd8ffe0': 'image/jpeg',
        'ffd8ffe1': 'image/jpeg',
        'ffd8ffe2': 'image/jpeg',
        '47494638': 'image/gif',
        '52494646': 'image/webp'
      };
      
      const detectedType = signatures[header] || 'unknown';
      console.log('File signature:', header);
      console.log('Detected MIME type:', detectedType);
      resolve(detectedType);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

// Method 3: Enhanced file validation
async function validateFile(file) {
  console.log('=== File Validation Report ===');
  console.log('Reported MIME type:', file.type);
  console.log('File extension:', file.name.split('.').pop());
  
  const actualType = await detectActualMimeType(file);
  console.log('Actual MIME type:', actualType);
  
  const isValid = file.type === actualType;
  console.log('MIME type matches:', isValid);
  
  return {
    reportedType: file.type,
    actualType,
    isValid,
    fileName: file.name,
    fileSize: file.size
  };
}
```

### Browser DevTools Method:
```javascript
// In browser console, after selecting a file
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const validation = await validateFile(file);
    console.table(validation);
  }
});
```

## 3. Supported MIME Types for Your Upload System

### Current Supabase Configuration:
```sql
-- Your current allowed types
ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
```

### Standard Image MIME Types:
```javascript
const supportedMimeTypes = [
  'image/jpeg',     // .jpg, .jpeg files
  'image/jpg',      // Alternative JPEG MIME type
  'image/png',      // .png files
  'image/webp',     // .webp files
  'image/gif',      // .gif files (not in your current config)
  'image/svg+xml',  // .svg files (not in your current config)
  'image/bmp',      // .bmp files (not in your current config)
  'image/tiff'      // .tiff files (not in your current config)
];
```

## 4. Specific Solutions to Resolve MIME Type Mismatch

### Solution 1: Enhanced File Validation (Recommended)
```javascript
// Add to your StorageService or upload component
export class FileValidator {
  static allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  static async validateFile(file) {
    // Check reported MIME type
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${this.allowedTypes.join(', ')}`);
    }
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!validExtensions.includes(extension)) {
      throw new Error(`File extension .${extension} is not supported. Allowed extensions: ${validExtensions.join(', ')}`);
    }
    
    // Verify actual file content matches MIME type
    const actualType = await this.detectActualMimeType(file);
    if (actualType === 'unknown') {
      throw new Error('Could not determine file type. File may be corrupted.');
    }
    
    // Allow some flexibility in MIME type reporting
    const typeMatches = this.isCompatibleType(file.type, actualType);
    if (!typeMatches) {
      throw new Error(`File content (${actualType}) doesn't match reported type (${file.type})`);
    }
    
    return true;
  }
  
  static isCompatibleType(reportedType, actualType) {
    // Handle JPEG variations
    if ((reportedType === 'image/jpeg' || reportedType === 'image/jpg') && 
        (actualType === 'image/jpeg' || actualType === 'image/jpg')) {
      return true;
    }
    
    return reportedType === actualType;
  }
  
  static async detectActualMimeType(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const arr = new Uint8Array(e.target.result).subarray(0, 4);
        let header = '';
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16);
        }
        
        const signatures = {
          '89504e47': 'image/png',
          'ffd8ffe0': 'image/jpeg',
          'ffd8ffe1': 'image/jpeg',
          'ffd8ffe2': 'image/jpeg',
          '47494638': 'image/gif',
          '52494646': 'image/webp'
        };
        
        resolve(signatures[header] || 'unknown');
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }
}
```

### Solution 2: Update Storage Configuration
If you need to support additional file types, update your Supabase bucket:

```sql
-- Add more supported MIME types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp',
  'image/gif',
  'image/svg+xml'
] 
WHERE id = 'site-images';
```

### Solution 3: File Type Conversion
```javascript
// Convert unsupported files to supported format
export class FileConverter {
  static async convertToJPEG(file, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.fillStyle = '#FFFFFF'; // White background for transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            // Create new file with JPEG MIME type
            const convertedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              { 
                type: 'image/jpeg',
                lastModified: Date.now()
              }
            );
            
            resolve(convertedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = URL.createObjectURL(file);
    });
  }
}
```

### Solution 4: Enhanced Upload Function
```javascript
// Updated upload function with comprehensive validation
export async function uploadImageWithValidation(file, path, options = {}) {
  try {
    // Step 1: Validate file
    console.log('Validating file:', file.name);
    await FileValidator.validateFile(file);
    
    // Step 2: Convert if necessary
    let processedFile = file;
    if (file.type === 'image/gif' || file.type === 'image/bmp') {
      console.log('Converting file to JPEG...');
      processedFile = await FileConverter.convertToJPEG(file);
    }
    
    // Step 3: Upload
    console.log('Uploading file:', processedFile.type);
    const result = await StorageService.uploadImage(processedFile, path, options);
    
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

## 5. Best Practices for Handling File Uploads with JSON Content

### Prevent JSON Files from Being Selected:
```javascript
// In your file input component
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/webp"
  onChange={handleFileSelect}
  className="hidden"
/>
```

### Client-Side Pre-validation:
```javascript
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Immediate MIME type check
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    toast.error(`File type ${file.type} is not supported. Please select an image file.`);
    event.target.value = ''; // Clear the input
    return;
  }
  
  // Additional validation
  validateAndUpload(file);
}

async function validateAndUpload(file) {
  try {
    // Show loading state
    setIsUploading(true);
    
    // Comprehensive validation
    const validation = await validateFile(file);
    
    if (!validation.isValid) {
      throw new Error('File validation failed');
    }
    
    // Proceed with upload
    const result = await uploadImageWithValidation(file, 'hero-backgrounds');
    
    // Handle success
    onImageUpdate(result.url);
    toast.success('Image uploaded successfully!');
    
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error.message || 'Upload failed');
  } finally {
    setIsUploading(false);
  }
}
```

### Error Handling Best Practices:
```javascript
// Comprehensive error handling
function handleUploadError(error) {
  console.error('Upload error details:', error);
  
  // Specific error messages based on error type
  if (error.message.includes('mime type')) {
    return 'File type not supported. Please select a valid image file (JPG, PNG, WebP).';
  }
  
  if (error.message.includes('size')) {
    return 'File is too large. Maximum size is 3MB.';
  }
  
  if (error.message.includes('Bucket not found')) {
    return 'Storage configuration error. Please contact support.';
  }
  
  return 'Upload failed. Please try again or contact support.';
}
```

## Quick Debugging Checklist

1. **Check file extension**: Is it actually an image file?
2. **Verify MIME type**: Use browser dev tools to inspect `file.type`
3. **Test file integrity**: Try opening the file in an image viewer
4. **Check file size**: Ensure it's under the 3MB limit
5. **Verify storage bucket**: Confirm the bucket exists and has correct MIME type restrictions
6. **Test with different files**: Try uploading a known-good image file
7. **Check network requests**: Look for detailed error messages in browser dev tools

## Common File Signature Reference

| File Type | Signature (Hex) | MIME Type |
|-----------|----------------|-----------|
| JPEG | FF D8 FF E0 | image/jpeg |
| PNG | 89 50 4E 47 | image/png |
| GIF | 47 49 46 38 | image/gif |
| WebP | 52 49 46 46 | image/webp |
| BMP | 42 4D | image/bmp |

Use this guide to systematically identify and resolve MIME type issues in your upload system.