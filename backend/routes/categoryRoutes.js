// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/adminAuth');

// ✅ Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM category');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// ✅ Get all subcategories
router.get('/subcategories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subcategory');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
});

// ✅ Get subcategories by category_id
router.get('/categories/:id/subcategories', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM subcategory WHERE category_id = ?', [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
});

// ✅ Get nested sub-subcategories by parent subcategory
router.get('/categories/:categoryId/subcategories/:subcategoryId/sub-subcategories', async (req, res) => {
  const { subcategoryId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM subcategory WHERE parent_id = ? ORDER BY subcategory_name ASC',
      [subcategoryId]
    );
    res.json({ success: true, subSubcategories: rows });
  } catch (err) {
    console.error('Error fetching sub-subcategories:', err);
    res.status(500).json({ message: 'Error fetching sub-subcategories' });
  }
});

// ✅ Get products by subcategory name to id
router.get('/products/by-subcategory/:subcategory', async (req, res) => {
  const { subcategory } = req.params;
  try {
    // Find subcategory ID
    const [subRows] = await pool.query(
      'SELECT sno FROM subcategory WHERE subcategory_name = ?',
      [subcategory]
    );

    if (subRows.length === 0) {
      return res.json({ success: true, products: [] });
    }

    const subcategoryId = subRows[0].sno;

    // ✅ Fetch products from 'products' table instead of 'subcategory_1'
    const [prodRows] = await pool.query(
      'SELECT * FROM products WHERE subcategory_id = ?',
      [subcategoryId]
    );

    // Convert BLOB to base64 for each product
    const productsWithImages = prodRows.map(product => {
      let imageData = null;
      
      if (product.image) {
        try {
          // Handle Buffer object from MySQL
          if (Buffer.isBuffer(product.image)) {
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${product.image.toString('base64')}`;
          } else if (product.image.type === 'Buffer' && Array.isArray(product.image.data)) {
            // Handle JSON serialized Buffer
            const buffer = Buffer.from(product.image.data);
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          } else if (typeof product.image === 'string') {
            // Already a string (base64)
            imageData = product.image.startsWith('data:') ? product.image : `data:${product.image_type || 'image/jpeg'};base64,${product.image}`;
          }
        } catch (err) {
          console.error('Error converting image to base64:', err);
          imageData = null;
        }
      }
      
      return {
        ...product,
        image: imageData,
        discount_percent: Number(product.discount) || 0
      };
    });

    res.json({ success: true, products: productsWithImages });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// ✅ Get products by category name to id
router.get('/products/by-category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {

    // Fetch products belonging to this category_id
    const [prodRows] = await pool.query(
      'SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC',
      [categoryId]
    );

    // Convert images (same as your other function)
    const productsWithImages = prodRows.map(product => {
      let imageData = null;

      if (product.image) {
        try {
          if (Buffer.isBuffer(product.image)) {
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${product.image.toString('base64')}`;
          } else if (product.image?.type === 'Buffer' && Array.isArray(product.image.data)) {
            const buffer = Buffer.from(product.image.data);
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          } else if (typeof product.image === 'string') {
            imageData = product.image.startsWith('data:')
              ? product.image
              : `data:${product.image_type || 'image/jpeg'};base64,${product.image}`;
          }
        } catch (err) {
          console.error('Image conversion error:', err);
          imageData = null;
        }
      }

      return { ...product, image: imageData, discount_percent: Number(product.discount) || 0 };
    });

    res.json({ success: true, products: productsWithImages });

  } catch (err) {
    console.error("Error fetching category products:", err);
    res.status(500).json({ success: false, message: 'Error fetching category products' });
  }
});

// Add new category (admin only)
router.post('/categories', authenticateAdmin, async (req, res) => {
  const { category_name } = req.body;
  if (!category_name || !category_name.trim()) {
    return res.status(400).json({ success: false, message: 'category_name is required' });
  }
  try {
    const [existing] = await pool.query('SELECT * FROM category WHERE LOWER(category_name) = LOWER(?)', [category_name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    await pool.query('INSERT INTO category (category_name) VALUES (?)', [category_name.trim()]);
    res.json({ success: true, message: 'Category added' });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ success: false, message: 'Error adding category' });
  }
});

// Add new subcategory (admin only)
router.post('/subcategories', authenticateAdmin, async (req, res) => {
  const { subcategory_name, category_id } = req.body;
  if (!subcategory_name || !subcategory_name.trim() || !category_id) {
    return res.status(400).json({ success: false, message: 'subcategory_name and category_id are required' });
  }
  try {
    const [cats] = await pool.query('SELECT * FROM category WHERE sno = ?', [category_id]);
    if (cats.length === 0) {
      return res.status(404).json({ success: false, message: 'Parent category not found' });
    }
    const [existing] = await pool.query('SELECT * FROM subcategory WHERE LOWER(subcategory_name) = LOWER(?) AND category_id = ?', [subcategory_name.trim(), category_id]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Subcategory already exists for this category' });
    }
    await pool.query('INSERT INTO subcategory (subcategory_name, category_id) VALUES (?, ?)', [subcategory_name.trim(), category_id]);
    res.json({ success: true, message: 'Subcategory added' });
  } catch (err) {
    console.error('Error adding subcategory:', err);
    res.status(500).json({ success: false, message: 'Error adding subcategory' });
  }
});

// Update a category (admin only)
router.put('/categories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  if (!category_name || !category_name.trim()) return res.status(400).json({ success: false, message: 'category_name is required' });
  try {
    const [existing] = await pool.query('SELECT * FROM category WHERE sno = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    const [dupe] = await pool.query('SELECT * FROM category WHERE LOWER(category_name) = LOWER(?) AND sno != ?', [category_name.trim(), id]);
    if (dupe.length > 0) return res.status(409).json({ success: false, message: 'Category name already used' });
    await pool.query('UPDATE category SET category_name = ? WHERE sno = ?', [category_name.trim(), id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Error updating category' });
  }
});

// Delete a category (admin only)
router.delete('/categories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM category WHERE sno = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });

    // Remove or reassign dependent records: set products' category_id to NULL
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);

    // Delete subcategories under this category
    await pool.query('DELETE FROM subcategory WHERE category_id = ?', [id]);

    // Delete the category
    await pool.query('DELETE FROM category WHERE sno = ?', [id]);

    res.json({ success: true, message: 'Category and its subcategories deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
});

// Update a subcategory (admin only)
router.put('/subcategories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { subcategory_name, category_id } = req.body;
  if (!subcategory_name || !subcategory_name.trim() || !category_id) return res.status(400).json({ success: false, message: 'subcategory_name and category_id required' });
  try {
    const [existing] = await pool.query('SELECT * FROM subcategory WHERE sno = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    const [cats] = await pool.query('SELECT * FROM category WHERE sno = ?', [category_id]);
    if (cats.length === 0) return res.status(404).json({ success: false, message: 'Parent category not found' });
    const [dupe] = await pool.query('SELECT * FROM subcategory WHERE LOWER(subcategory_name) = LOWER(?) AND category_id = ? AND sno != ?', [subcategory_name.trim(), category_id, id]);
    if (dupe.length > 0) return res.status(409).json({ success: false, message: 'Subcategory name already used in this category' });
    await pool.query('UPDATE subcategory SET subcategory_name = ?, category_id = ? WHERE sno = ?', [subcategory_name.trim(), category_id, id]);
    res.json({ success: true, message: 'Subcategory updated' });
  } catch (err) {
    console.error('Error updating subcategory:', err);
    res.status(500).json({ success: false, message: 'Error updating subcategory' });
  }
});

// Delete a subcategory (admin only)
router.delete('/subcategories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM subcategory WHERE sno = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Subcategory not found' });

    // set products' subcategory to null
    await pool.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [id]);

    await pool.query('DELETE FROM subcategory WHERE sno = ?', [id]);
    res.json({ success: true, message: 'Subcategory deleted' });
  } catch (err) {
    console.error('Error deleting subcategory:', err);
    res.status(500).json({ success: false, message: 'Error deleting subcategory' });
  }
});

module.exports = router;
