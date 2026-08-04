const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage for images
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'runway/avatars';
    if (file.fieldname === 'receipt') folder = 'runway/receipts';
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix = 'avatar';
    if (file.fieldname === 'receipt') prefix = 'receipt';
    
    return {
      folder: folder,
      public_id: `${prefix}-${req.user.sub || req.user.id}-${uniqueSuffix}`,
    };
  }
});

// Local Disk Storage for CSV imports (or dev mode images)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'avatars';
    if (file.fieldname === 'receipt') folder = 'receipts';
    if (file.fieldname === 'file') folder = 'imports';
    
    const uploadPath = path.join(__dirname, `../../../uploads/${folder}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix = 'avatar';
    if (file.fieldname === 'receipt') prefix = 'receipt';
    if (file.fieldname === 'file') prefix = 'import';
    cb(null, `${prefix}-${req.user.sub || req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'file') {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError('Please upload only CSV files.', 400, errorCodes.VALIDATION_ERROR), false);
    }
  } else {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400, errorCodes.VALIDATION_ERROR), false);
    }
  }
};

const upload = multer({
  storage: (req, file, cb) => {
    // CSV imports always go to local disk (temporary worker processing)
    if (file.fieldname === 'file') {
      diskStorage._handleFile(req, file, cb);
    } 
    // In production, images go to Cloudinary. Locally, they stay on disk.
    else if (env.NODE_ENV === 'production') {
      cloudinaryStorage._handleFile(req, file, cb);
    } 
    else {
      diskStorage._handleFile(req, file, cb);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
