// backend/src/middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // carpeta absoluta: /backend/uploads/hotels
    const dest = path.join(__dirname, '..', '..', 'uploads', 'hotels');
    fs.mkdirSync(dest, { recursive: true }); // crea si no existe
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // 1700000000000.jpg
  }
});

const upload = multer({ storage });

module.exports = upload;

