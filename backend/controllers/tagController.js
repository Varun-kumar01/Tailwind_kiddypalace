// backend/controllers/tagController.js

// ⚠️ ADJUST THIS IMPORT to match how your other controllers connect to the DB.
// Look at the top of productController.js or brandController.js and copy the same line.
// Common patterns:
//   const db = require('../config/db');
//   const pool = require('../database/db');
const db = require('../config/db'); // <-- CHANGE THIS LINE if your path/name differs

// GET /api/tags  -> returns { success: true, tags: [...] }
exports.getAllTags = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tags ORDER BY sort_order ASC, id ASC');
    return res.json({ success: true, tags: rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tags' });
  }
};

// POST /api/tags  -> multipart/form-data { name, slug, type, image (file) }
exports.addTag = async (req, res) => {
  try {
    const { name, slug, type } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    // multer puts the uploaded file info here
    const imagePath = req.file ? `/uploads/tags/${req.file.filename}` : null;

    const finalSlug = slug && slug.trim() ? slug.trim() : name.trim().toLowerCase().replace(/\s+/g, '-');

    const [result] = await db.query(
      'INSERT INTO tags (name, slug, type, image, is_active, sort_order) VALUES (?, ?, ?, ?, 1, 0)',
      [name.trim(), finalSlug, type || 'theme', imagePath]
    );

    return res.json({
      success: true,
      message: 'Tag added successfully',
      tag: { id: result.insertId, name: name.trim(), slug: finalSlug, type: type || 'theme', image: imagePath },
    });
  } catch (error) {
    console.error('Error adding tag:', error);
    return res.status(500).json({ success: false, message: 'Failed to add tag' });
  }
};

// PUT /api/tags/:id -> multipart/form-data { name, slug, type, image (file, optional) }
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, type } = req.body;

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/tags/${req.file.filename}`;
    }

    if (imagePath) {
      await db.query(
        'UPDATE tags SET name = ?, slug = ?, type = ?, image = ? WHERE id = ?',
        [name, slug, type, imagePath, id]
      );
    } else {
      await db.query(
        'UPDATE tags SET name = ?, slug = ?, type = ? WHERE id = ?',
        [name, slug, type, id]
      );
    }

    return res.json({ success: true, message: 'Tag updated successfully' });
  } catch (error) {
    console.error('Error updating tag:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tag' });
  }
};

// DELETE /api/tags/:id
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tags WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete tag' });
  }
};

// POST /api/tags/bulk-upload -> multipart/form-data { file: csv/xlsx }
// NOTE: left as a stub — tell me your bulk file's column layout (name, slug, type, image_filename?)
// and I'll fill this in exactly to match, following the same pattern as your product bulk upload.
exports.bulkUploadTags = async (req, res) => {
  try {
    return res.status(501).json({ success: false, message: 'Bulk upload not yet implemented — share your CSV column format to complete this.' });
  } catch (error) {
    console.error('Error bulk uploading tags:', error);
    return res.status(500).json({ success: false, message: 'Failed bulk upload' });
  }
};
