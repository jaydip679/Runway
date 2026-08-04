const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

// Local Disk Storage for all uploads
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
  storage: diskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
