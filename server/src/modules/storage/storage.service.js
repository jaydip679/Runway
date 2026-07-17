const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file to cloud storage and deletes the local file after upload.
 * @param {string} filePath - Local absolute path to the file
 * @param {string} folder - Folder name in storage
 * @returns {Promise<{ publicId: string, secureUrl: string }>}
 */
const uploadPdf = async (filePath, folder = 'runway_exports') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'raw', // Use raw for non-media files like PDFs
      format: 'pdf',
      access_mode: 'public'
    });
    
    // Delete local temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url
    };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error('Failed to upload file to storage: ' + error.message);
  }
};

module.exports = {
  uploadPdf
};
