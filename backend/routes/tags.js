// backend/routes/tags.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getAllTags,
  addTag,
  updateTag,
  deleteTag,
  bulkUploadTags,
} = require('../controllers/tagController');

// Make sure the uploads/tags folder exists (it already does based on your screenshots,
// but this keeps it safe if the project is set up fresh elsewhere)
const tagsUploadDir = path.join(__dirname, '..', 'uploads', 'tags');
if (!fs.existsSync(tagsUploadDir)) {
  fs.mkdirSync(tagsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tagsUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `tag-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches your frontend check
});

// GET all tags
router.get('/', getAllTags);

// Add new tag (with optional image)
router.post('/', upload.single('image'), addTag);

// Update tag (with optional new image)
router.put('/:id', upload.single('image'), updateTag);

// Delete tag
router.delete('/:id', deleteTag);

// Bulk upload tags
router.post('/bulk-upload', upload.single('file'), bulkUploadTags);

module.exports = router;