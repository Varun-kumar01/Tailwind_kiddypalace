const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');

// =====================================================
// 🖼️ IMAGE UPLOAD CONFIGURATION
// =====================================================
// const imageStorage = multer.memoryStorage();
// const uploadImage = multer({ 
//   storage: imageStorage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for images
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// =====================================================
// 🖼️ IMAGE UPLOAD CONFIGURATION (DISK STORAGE)
// =====================================================

const imageDir = path.join(__dirname, '..', 'uploads', 'products');

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// const imageStorage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, imageDir),
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, unique + path.extname(file.originalname));
//   }
// });

// const uploadImage = multer({ 
//   storage: imageStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });


// =====================================================
// 📊 EXCEL UPLOAD CONFIGURATION
// =====================================================

// Ensure "uploads" directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage for Excel
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Accept Excel/CSV files by extension (.xls, .xlsx, .csv)
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.xls', '.xlsx', '.csv', '.txt', '.tsv'];
    if (allowedExt.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel/CSV/TXT files are allowed!'), false);
  },
});

// Smart import endpoint: is registered after middleware is imported to avoid hoisting issues

// =====================================================
// 📦 PRODUCT ROUTES
// =====================================================


// 🎉 SPECIAL OFFERS — Products with discount > 10%
// ⚠️ Must be before /products/:id
router.get('/discount/high', productController.getHighDiscountProducts);

//new arrival
router.get("/new-arrivals", productController.getNewArrivals);

// 🔥 Best-selling/Trending products
router.get("/best-selling", productController.getBestSellingProducts);

// router.get('/settings/top-announcement', productController.getAnnouncement);
// router.post('/settings/top-announcement', productController.updateAnnouncement);

// ⭐ Get customized products
router.get('/products/customized', productController.getCustomizedProducts);

// 🎭 Get all products with tags (Characters & Themes)
// Must be before /products/:id
router.get('/products/with-tags', productController.getProductsWithTags);

router.get('/sub-subcategories/:subcategoryId', productController.getSubSubCategories);

// // Update product images (must be before /products/:id)
// router.put('/products/:id/image', uploadImage.any(), productController.updateProductImage);

// // Delete product images (must be before /products/:id)
// router.delete('/products/:id/image', productController.deleteProductImage);
const { authenticateAdmin } = require("../middleware/adminAuth");

// Bulk delete endpoint (admin only) - upload file with product codes to delete matching products
router.post('/bulk-delete', authenticateAdmin, uploadExcel.any(), productController.bulkDeleteProducts);

router.post(
  "/products/:id/images",
  authenticateAdmin,
  upload.array("images", 10),
  productController.uploadProductImages
);


router.delete(
  "/products/:productId/images/:imageId",
  authenticateAdmin,
  productController.deleteProductImage
);

// Set image as main/display image
router.put(
  "/products/:id/set-main-image",
  authenticateAdmin,
  productController.setMainImage
);

// Clear main image selection
router.put(
  "/products/:id/clear-main-image",
  authenticateAdmin,
  productController.clearMainImage
);

// Update product details (name, description, specifications, highlights, age_range, brand_name, gender)
// ⚠️ Must be before /products/:id - requires admin auth
router.put('/products/:id/details', authenticateAdmin, productController.updateProductDetails);

// Update product stock (must be before /products/:id)
router.put('/products/:id/stock', productController.updateProductStock);

// router.put(
//   "/products/:id",
//   authenticateAdmin,
//   updateProduct
// );

// router.post(
//   "/products/:id/images",
//   authenticateAdmin,
//   uploadImage
// );
// 📥 Export all products to Excel (admin only) — must be before /products/:id
router.get('/products/export', authenticateAdmin, productController.exportProducts);
// Get single product (MUST come after all specific product routes)
router.get('/products/:id', productController.getProductById);


// Get products by subcategory (MUST be before /products/:id)
router.get('/products/subcategory/:subcategoryId', productController.getProductsBySubcategory);
router.get('/subcategories/:parentId/children', async (req, res) => {
  try {
    const db = require('../config/db');
    const { parentId } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM subcategory WHERE parent_id = ? ORDER BY subcategory_name ASC',
      [parentId]
    );
    res.json({ success: true, subcategories: rows });
  } catch (err) {
    console.error('Error fetching child subcategories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subcategories' });
  }
});
router.get('/products/by-sub-subcategory/:subSubcategoryId', async (req, res) => {
  try {
    const db = require('../config/db');
    const { subSubcategoryId } = req.params;
    const [products] = await db.query(
      `SELECT * FROM products WHERE sub_subcategory_id = ? ORDER BY created_at DESC`,
      [subSubcategoryId]
    );
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        let image_url = product.image_url;
        if (!image_url) {
          const [[firstImage]] = await db.query(
            `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1`,
            [product.id]
          );
          image_url = firstImage?.image_url || null;
        }
        return {
          ...product,
          image_url,
          discount_percent: Number(product.discount) || 0
        };
      })
    );
    res.json({ success: true, products: productsWithImages });
  } catch (err) {
    console.error('Error fetching products by sub-subcategory:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});
router.get('/sub-subcategories/:subcategoryId', async (req, res) => {
  try {
    const db = require('../config/db');
    const { subcategoryId } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM sub_subcategory WHERE subcategory_id = ? ORDER BY sub_subcategory_name ASC',
      [subcategoryId]
    );
    res.json({ success: true, subSubcategories: rows });
  } catch (err) {
    console.error('Error fetching sub-subcategories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sub-subcategories' });
  }
});

router.get('/categories/:categoryId/subcategories/:subcategoryId/sub-subcategories', async (req, res) => {
  try {
    const db = require('../config/db');
    const { subcategoryId } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM sub_subcategory WHERE subcategory_id = ? ORDER BY sub_subcategory_name ASC',
      [subcategoryId]
    );
    res.json({ success: true, subSubcategories: rows });
  } catch (err) {
    console.error('Error fetching sub-subcategories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sub-subcategories' });
  }
});
  


// 🎭 Get all products by character or themes (MUST be before /products/:id)
router.get("/products/by-tag/:tagId", productController.getProductsByTag);

// ✅ Get products by brand name
router.get('/products/by-brand/:brandName', productController.getProductsByBrand);

// Add new product with one or more images (accept any image field name)
router.post('/products', upload.any(), productController.addProduct);

// Delete a product
router.delete('/products/:id', productController.deleteProduct);

// Create new order
router.post('/orders', productController.createOrder);

router.post(
  "/products/bulk-images",
  authenticateAdmin,
  upload.array("images", 200),
  productController.bulkUploadImagesByCode
);
 






// Get all orders (no auth required) - MUST come before /orders/:orderId
router.get('/orders', productController.getAllOrders);

// Fetch user's orders
router.get('/orders/user/:userId', productController.getUserOrders);

// Accept order (no auth required) - MUST come before /orders/:orderId
router.put('/orders/:orderId/accept', productController.acceptOrder);

// Get tracking info for a specific order item (must be before /orders/:orderId)
router.get('/orders/:orderId/items/:itemId/tracking', productController.getItemTracking);

// Fetch order details
router.get('/orders/:orderId', productController.getOrderDetails);

// Cancel order
router.put('/orders/:orderId/cancel', productController.cancelOrder);

// Update order shipping address
router.put('/orders/:orderId/address', productController.updateOrderAddress);

// 🎭 Get all Characters & Themes (tags)
router.get('/tags', async (req, res) => {
  try {
    const db = require('../config/db');

    const [rows] = await db.query(
      "SELECT * FROM tags ORDER BY name ASC"
    );

    res.json({
      success: true,
      tags: rows
    });
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tags"
    });
  }
});

// =====================================================
// 🎭 TAG IMAGE UPLOAD CONFIGURATION
// =====================================================
const tagImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tagsDir = path.join(__dirname, '..', 'uploads', 'tags');
    if (!fs.existsSync(tagsDir)) {
      fs.mkdirSync(tagsDir, { recursive: true });
    }
    cb(null, tagsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "tag-" + unique + path.extname(file.originalname));
  }
});

const uploadTagImage = multer({
  storage: tagImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for tag images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// 🎭 Create new tag with image upload (admin only)
router.post('/tags', authenticateAdmin, uploadTagImage.single('image'), async (req, res) => {
  try {
    const db = require('../config/db');
    const { name, slug } = req.body;

    if (!name || !name.trim()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Tag name is required"
      });
    }

    const tagSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    let imageUrl = null;

    // If file uploaded, generate URL
    if (req.file) {
      imageUrl = `/uploads/tags/${req.file.filename}`;
    }

    const result = await db.query(
      "INSERT INTO tags (name, slug, image) VALUES (?, ?, ?)",
      [name.trim(), tagSlug, imageUrl]
    );

    res.json({
      success: true,
      message: "Tag created successfully",
      tag: {
        id: result[0].insertId,
        name: name.trim(),
        slug: tagSlug,
        image: imageUrl
      }
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error deleting uploaded file:", e);
      }
    }
    console.error("Error creating tag:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create tag"
    });
  }
});

// 🎭 Delete tag (admin only)
router.delete('/tags/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    // Check if tag exists
    const [tags] = await db.query("SELECT * FROM tags WHERE id = ?", [id]);
    if (!tags.length) {
      return res.status(404).json({
        success: false,
        message: "Tag not found"
      });
    }

    // Delete tag (product_tags entries will be deleted by foreign key CASCADE)
    await db.query("DELETE FROM tags WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Tag deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting tag:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete tag"
    });
  }
});

// 🎭 Update tag with image (admin only)
router.put('/tags/:id', authenticateAdmin, uploadTagImage.single('image'), async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const { name, slug } = req.body;

    if (!name || !name.trim()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Tag name is required"
      });
    }

    const tagSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    // Get current tag to preserve image if not updated
    const [currentTag] = await db.query("SELECT image FROM tags WHERE id = ?", [id]);
    
    let imageUrl = currentTag[0]?.image || null;
    
    // If new image uploaded, use it
    if (req.file) {
      imageUrl = `/uploads/tags/${req.file.filename}`;
    }

    await db.query(
      "UPDATE tags SET name = ?, slug = ?, image = ? WHERE id = ?",
      [name.trim(), tagSlug, imageUrl, id]
    );

    res.json({
      success: true,
      message: "Tag updated successfully",
      tag: {
        id,
        name: name.trim(),
        slug: tagSlug,
        image: imageUrl
      }
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error deleting uploaded file:", e);
      }
    }
    console.error("Error updating tag:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update tag"
    });
  }
});

// 🎭 Bulk upload tags from CSV/Excel (admin only)
const bulkUploadStorage = multer.memoryStorage();
const bulkUpload = multer({
  storage: bulkUploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

router.post('/tags/bulk-upload', authenticateAdmin, bulkUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided"
      });
    }

    const db = require('../config/db');
    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    let successCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const tagName = row.name || '';
        const tagSlug = row.slug || tagName.toLowerCase().replace(/\s+/g, '-');
        const imageUrl = row.image_url || row.image || null;

        if (!tagName) {
          errors.push(`Row ${i + 1}: Tag name is required`);
          continue;
        }

        // Check if tag already exists
        const [existing] = await db.query(
          "SELECT id FROM tags WHERE name = ? OR slug = ?",
          [tagName, tagSlug]
        );

        if (!existing.length) {
          await db.query(
            "INSERT INTO tags (name, slug, image) VALUES (?, ?, ?)",
            [tagName, tagSlug, imageUrl]
          );
          successCount++;
        } else {
          errors.push(`Row ${i + 1}: Tag "${tagName}" already exists`);
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${successCount} tags`,
      successCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Error in bulk upload:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to process bulk upload"
    });
  }
});


// Fetch all products
router.get('/products', productController.getAllProducts);

// // Get products by tag slug (NEW FEATURE)
// router.get('/products/tag/:slug', productController.getProductsByTag);

// =====================================================
// 📂 BULK UPLOAD PRODUCTS FROM EXCEL
// =====================================================
router.post('/upload-excel', uploadExcel.single('file'), productController.uploadProductsFromExcelV2);

// Downloadable product upload template (CSV)
router.get('/products/template', productController.getProductsUploadTemplate);

// =====================================================
// 📊 BULK UPLOAD HISTORY ENDPOINTS
// =====================================================
// Get all upload history with pagination
router.get('/upload-history', productController.getUploadHistory);

// Get specific upload record details
router.get('/upload-history/:uploadId', productController.getUploadDetailsById);

// Download bulk upload report files (inserted, updated, unprocessed)
router.get('/upload-report/:reportType', productController.downloadUploadReport);

// Download a file from upload history
router.get('/upload-history/:uploadId/download/:fileType', productController.downloadUploadFile);

// Delete upload record
router.delete('/upload-history/:uploadId', authenticateAdmin, productController.deleteUploadRecord);

module.exports = router;
