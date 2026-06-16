const multer = require('multer');
const path = require('path');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|xlsx|xls|csv|sheet|excel|spreadsheet|officedocument/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // Permitir explícitamente los MIME types de Excel
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen, PDFs, Excel o CSV.'));
  }
};

const uploadMiddleware = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
});

module.exports = uploadMiddleware;
