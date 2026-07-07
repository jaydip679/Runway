const multer = require('multer');
const path = require('path');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'avatars';
    if (file.fieldname === 'receipt') folder = 'receipts';
    
    const uploadPath = path.join(__dirname, `../../../uploads/${folder}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'receipt' ? 'receipt' : 'avatar';
    cb(null, `${prefix}-${req.user.sub || req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400, errorCodes.VALIDATION_ERROR), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
