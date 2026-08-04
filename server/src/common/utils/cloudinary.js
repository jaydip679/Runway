const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const env = require('../../config/env');
const logger = require('../../config/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file.
 * @param {string} localFilePath - Absolute path to the local file.
 * @param {string} folder - Cloudinary folder name.
 * @param {string} publicId - Optional public ID for the file.
 * @returns {Promise<Object>} Cloudinary upload result.
 */
const uploadImage = async (localFilePath, folder, publicId = undefined) => {
  try {
    const options = {
      folder: folder,
      resource_type: 'auto',
    };
    if (publicId) {
      options.public_id = publicId;
    }
    
    const result = await cloudinary.uploader.upload(localFilePath, options);
    return result;
  } catch (error) {
    logger.error(`Cloudinary upload failed for ${localFilePath}:`, error);
    throw error;
  } finally {
    // Always attempt to clean up the temporary local file
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupError) {
      logger.error(`Failed to delete temporary file ${localFilePath}:`, cleanupError);
    }
  }
};

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public ID of the image to delete.
 * @returns {Promise<Object>} Cloudinary deletion result.
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Cloudinary delete failed for ${publicId}:`, error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};
