const db = require('../config/db');
const xlsx = require("xlsx");
const fs = require("fs");
const path = require('path');
const uploadHistory = require('../helpers/uploadHistory');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const showAll = req.query.showAll === 'true';

    const query = `SELECT * FROM products ORDER BY created_at DESC`;

    const [products] = await db.query(query);

    // Determine a display image and normalized discount_percent for each product
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        // Determine image_url (either manual or first product_images entry)
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
          // Normalized percentage field for frontend
          discount_percent: Number(product.discount) || 0
        };
      })
    );

    res.status(200).json({ success: true, products: productsWithImages });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// 🎭 Get all products that have tags (Characters & Themes)
exports.getProductsWithTags = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT DISTINCT p.*
       FROM products p
       INNER JOIN product_tags pt ON p.id = pt.product_id
       ORDER BY p.created_at DESC`
    );

    // If product has manually set image_url, use that. Otherwise fetch first image from product_images
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        // Determine image_url (either manual or first product_images entry)
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
          // Normalized percentage field for frontend
          discount_percent: Number(product.discount) || 0
        };
      })
    );

    res.status(200).json({ success: true, products: productsWithImages });
  } catch (error) {
    console.error('Get products with tags error:', error);
    res.status(500).json({ message: 'Server error while fetching products with tags' });
  }
};

// ======================================================
// 🔐 ADMIN: UPLOAD PRODUCT IMAGES (USED BY + BUTTON)
// ======================================================
// exports.uploadProductImages = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No images uploaded",
//       });
//     }

//     // Get current max sort_order to append new images
//     const [[{ maxOrder = -1 } = {}]] = await db.query(
//       `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?`,
//       [id]
//     );
//     let startOrder = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) + 1 : 0;

//     const values = req.files.map((file, index) => [
//       id,
//       `/uploads/products/${file.filename}`,
//       startOrder + index,
//     ]);

//     await db.query(
//       `INSERT INTO product_images (product_id, image_url, sort_order)
//        VALUES ?`,
//       [values]
//     );

//     await pool.query(
//   "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
//   [productId, imagePath, index]
// );


//     // Set product.image_url to the first uploaded image so list thumbnails persist after refresh
//     if (req.files.length > 0) {
//       const primaryUrl = `/uploads/products/${req.files[0].filename}`;
//       await db.query(`UPDATE products SET image_url = ? WHERE id = ?`, [primaryUrl, id]);
//     }

//     res.json({
//       success: true,
//       message: "Images uploaded successfully",
//     });
//   } catch (err) {
//     console.error("uploadProductImages error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Image upload failed",
//     });
//   }
// };

exports.uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    let firstImagePath = null;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imagePath = `/uploads/products/${file.filename}`;

      // Save first image path to set as default later
      if (i === 0) {
        firstImagePath = imagePath;
      }

      await db.query(
        `INSERT INTO product_images (product_id, image_url, sort_order)
         VALUES (?, ?, ?)`,
        [productId, imagePath, i]
      );
    }

    // Set the first uploaded image as the default display image if product doesn't have one
    const [[product]] = await db.query(
      "SELECT image_url FROM products WHERE id = ?",
      [productId]
    );

    if (!product?.image_url && firstImagePath) {
      await db.query(
        "UPDATE products SET image_url = ? WHERE id = ?",
        [firstImagePath, productId]
      );
    }

    res.json({
      success: true,
      message: "Images uploaded successfully",
    });
  } catch (error) {
    console.error("uploadProductImages error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
};



//     // 1️⃣ Check product exists
//     const [products] = await db.query(
//       "SELECT id FROM products WHERE id = ?",
//       [id]
//     );

//     if (!products.length) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // 2️⃣ Get current max sort_order
//     const [[{ maxOrder = -1 } = {}]] = await db.query(
//       "SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?",
//       [id]
//     );

//     let sortOrder = Number(maxOrder) + 1;

//     // 3️⃣ Save images
//     for (const file of req.files) {
//       const imageUrl = `/uploads/products/${file.filename}`;

//       await db.query(
//         "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
//         [id, imageUrl, sortOrder++]
//       );
//     }

//     res.json({
//       success: true,
//       message: "Product images uploaded successfully"
//     });

//   } catch (error) {
//     console.error("Upload product images error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while uploading images"
//     });
//   }
// };


// Get ProductById


// exports.getProductById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 1️⃣ Fetch product
//     const [products] = await db.query(
//       "SELECT * FROM products WHERE id = ?",
//       [id]
//     );

//     if (!products.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found"
//       });
//     }

//     const product = products[0];

//     // 2️⃣ Fetch product images
//     const [images] = await db.query(
//       `SELECT id, image_url, sort_order
//        FROM product_images
//        WHERE product_id = ?
//        ORDER BY sort_order ASC`,
//       [id]
//     );

//     // 3️⃣ Attach images to product
//     product.product_images = images;

//     res.json({
//       success: true,
//       product
//     });

//   } catch (error) {
//     console.error("Get product by id error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching product"
//     });
//   }
// };
 

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1️⃣ Product details (NO image here)
    const [[product]] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2️⃣ Fetch ALL images from product_images
    const [images] = await db.query(
      `SELECT id, image_url, sort_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order ASC`,
      [productId]
    );

    // 3️⃣ Fetch tags for this product
    const [tags] = await db.query(
      `SELECT pt.tag_id, t.name, t.slug 
       FROM product_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id = ?`,
      [productId]
    );

    // 4️⃣ Attach images and tags
    product.product_images = images;
    // If product has no main image_url, use first product_images entry as default
    if ((!product.image_url || product.image_url === null) && images && images.length > 0) {
      product.image_url = images[0].image_url || null;
    }
    product.tag_ids = tags.map(t => t.tag_id);
    product.tags = tags;

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};



//   Add Product

 exports.addProduct = async (req, res) => {
  try {
    const {
      name, product_code, description, mrp, discount, price,
      category_id, subcategory_id, sub_subcategory_id, stock_quantity,
      age_range, gender,
      brand_name, is_new_arrival
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    let uploadedImages = [];
    if (Array.isArray(req.files)) uploadedImages = req.files;
    else if (req.file) uploadedImages = [req.file];

    uploadedImages = uploadedImages.slice(0, 5);

    const primary = uploadedImages[0];
    const image_url = primary ? `/uploads/products/${primary.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO products
      (name, product_code, description, mrp, discount, price, image_url,
       category_id, subcategory_id, sub_subcategory_id, stock_quantity, age_range, gender,
       brand_name, is_new_arrival)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, product_code, description || "", mrp, discount, price, image_url,
        category_id || null, subcategory_id || null, sub_subcategory_id || null, stock_quantity || 0,
        age_range || "", gender || "", brand_name || "", is_new_arrival ? 1 : 0
      ]
    );

    const productId = result.insertId;

    // Save ALL images to product_images table (including primary)
    // Primary image (sort_order=0) should match products.image_url
    for (let i = 0; i < uploadedImages.length; i++) {
      await db.query(
        `INSERT INTO product_images (product_id, image_url, sort_order)
         VALUES (?, ?, ?)`,
        [productId, `/uploads/products/${uploadedImages[i].filename}`, i]
      );
    }

    res.status(201).json({ success: true, message: "Product added", productId });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Server error while adding product" });
  }
};

// =====================================================
// 📥 BULK IMPORT: Smart Excel/CSV/TXT import (row-level validation)
// =====================================================
exports.importProducts = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.files[0];
    const ext = path.extname(file.originalname || '').toLowerCase();

    // Read file using xlsx. For CSV/TXT, normalize delimiters when needed.
    let workbook;
    if (ext === '.csv' || ext === '.txt' || ext === '.tsv') {
      const raw = fs.readFileSync(file.path, 'utf8');
      // detect delimiter (tab, pipe or comma)
      const delim = raw.indexOf('\t') !== -1 ? '\t' : raw.indexOf('|') !== -1 ? '|' : ',';
      let normalized = raw;
      if (delim !== ',') {
        // normalize to comma for xlsx parser
        normalized = raw.split('\n').map(line => line.split(delim).join(',')).join('\n');
      }
      workbook = xlsx.read(normalized, { type: 'string' });
    } else {
      workbook = xlsx.readFile(file.path);
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return res.status(400).json({ success: false, message: 'No sheet found in file' });

    let rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });

    // Skip completely empty rows
    rows = rows.filter(r => Object.values(r).some(v => v !== null && String(v).trim() !== ''));

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'No rows to process' });
    }

    // Helper: normalize header name to canonical keys
    const guessField = (header) => {
      if (!header) return null;
      const raw = String(header).toLowerCase().trim();
      const h = raw.replace(/[^a-z0-9]/g, '');
      // Prefer brand-specific detection first (avoid matching 'name' inside 'brand name')
      if (/\bbrand\b/.test(raw) || /brandname/.test(h)) return 'brand_name';
      if (/\b(name|productname|title)\b/.test(raw) && !/\bbrand\b/.test(raw)) return 'name';
      if (/code|sku|productcode/.test(h)) return 'product_code';
      if (/mrp/.test(h)) return 'mrp';
      if (/^price$|productprice/.test(h)) return 'price';
      if (/stock|stockquantity|quantity|qty/.test(h)) return 'stock_quantity';
      if (/description|details|productdescription/.test(h)) return 'description';
      if (/categoryid|category/.test(h) && !/subcategory/.test(h)) return 'category_id';
      if (/subcategory|subcategoryid/.test(h)) return 'subcategory_id';
      if (/age|agerange/.test(h)) return 'age_range';
      if (/gender/.test(h)) return 'gender';
      if (/discount/.test(h)) return 'discount';
      if (/isnew|newarrival/.test(h)) return 'is_new_arrival';
      return null;
    };

    // Build header mapping from first row keys
    const headers = Object.keys(rows[0] || {});
    const headerMap = {};
    headers.forEach(h => {
      const mapped = guessField(h);
      if (mapped) headerMap[h] = mapped;
    });

    // Helpers to normalize codes and names for comparisons (ignore spaces & case)
    const normalizeCode = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
    // Normalize names for comparison: NFKD normalize, strip diacritics, collapse whitespace, lowercase
    const normalizeName = (s) => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\S\n]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

    const accepted = [];
    const rejected = [];

    // Build canonical rows with mapping and keep original index
    const canonicalRows = rows.map((row, idx) => {
      const product = {};
      // Also capture uploaded_name and uploaded_brand explicitly from raw row
      let uploadedName = '';
      let uploadedBrand = '';

      for (const key of Object.keys(row)) {
        const mapped = headerMap[key] || guessField(key);
        let val = row[key];
        if (typeof val === 'string') val = val.trim();

        // Capture uploaded_name heuristically from any name-like header (but avoid matching brand headers)
        if (!uploadedName && /(?:productname|productname|name|title)/i.test(String(key)) && !/brand/i.test(String(key))) {
          uploadedName = String(row[key] || '').trim();
        }
        // Fallback: if header is 'product'+'name' combination, and it's not a brand header
        if (!uploadedName && /product/i.test(String(key)) && /name/i.test(String(key)) && !/brand/i.test(String(key))) {
          uploadedName = String(row[key] || '').trim();
        }
        // Capture brand explicitly and reliably
        if (!uploadedBrand && /brand/i.test(String(key))) {
          uploadedBrand = String(row[key] || '').trim();
        }

        if (!mapped) continue;
        product[mapped] = val;
      }

      // Do NOT fallback to an arbitrary non-name field (avoid accidentally using brand as the product name)
      // uploadedName will only be set when an explicit name-like header is present.
      // Attach uploaded_name and uploaded_brand to product for later use
      // Prefer the actual mapped `name` and `brand_name` if present; do not confuse brand with name
      product.uploaded_name = product.name ? String(product.name).trim() : uploadedName;
      product.uploaded_brand = product.brand_name ? String(product.brand_name).trim() : uploadedBrand;

      return { originalIndex: idx, raw: row, product };
    }).filter(r => Object.values(r.product).some(v => v !== null && String(v).trim() !== ''));

    // Detect duplicates within file by normalized product_code
    const fileCodeMap = new Map(); // normCode -> array of { idx, originalCode }
    for (let i = 0; i < canonicalRows.length; i++) {
      const rawCode = canonicalRows[i].product.product_code ? String(canonicalRows[i].product.product_code) : '';
      const normCode = normalizeCode(rawCode);
      if (!normCode) continue; // blank codes won't participate in duplicate-code detection
      if (!fileCodeMap.has(normCode)) fileCodeMap.set(normCode, []);
      fileCodeMap.get(normCode).push({ idx: i, originalCode: rawCode });
    }

    const duplicatedCodes = new Set();
    const consolidatedRows = []; // indices of canonicalRows to process

    // Any normalized code that appears more than once: if all names (normalized) are equal, consolidate (use last); otherwise reject all occurrences
    for (const [normCode, entries] of fileCodeMap.entries()) {
      if (entries.length === 1) {
        consolidatedRows.push(entries[0].idx);
        continue;
      }

      // Collect normalized names for these entries (prefer explicit mapped name, then uploaded_name)
      const names = entries.map(e => normalizeName(canonicalRows[e.idx].product.name || canonicalRows[e.idx].product.uploaded_name || '') );
      const distinctNames = [...new Set(names.filter(n => n !== ''))];

      if (distinctNames.length === 0) {
        // no valid names - reject all
        duplicatedCodes.add(normCode);
        entries.forEach(e => {
          const p = canonicalRows[e.idx].product;
          rejected.push({ name: p.name || p.uploaded_name || '', uploaded_name: p.uploaded_name || p.name || '', uploaded_brand: p.uploaded_brand || p.brand_name || '', product_code: e.originalCode, reason: 'Duplicate product code within file (no product name)' });
        });
      } else if (distinctNames.length === 1) {
        // same (normalized) name across duplicates -> consolidate and use the last occurrence
        const lastIdx = entries[entries.length - 1].idx;
        consolidatedRows.push(lastIdx);
      } else {
        // conflicting names for same code -> reject all rows for this code
        duplicatedCodes.add(normCode);
        entries.forEach(e => {
          const p = canonicalRows[e.idx].product;
          rejected.push({ name: p.name || p.uploaded_name || '', uploaded_name: p.uploaded_name || p.name || '', uploaded_brand: p.uploaded_brand || p.brand_name || '', product_code: e.originalCode, reason: 'Conflicting names for same product code in file' });
        });
      }
    }

    // Add rows that had no product_code (they will be inserted with generated codes) AND
    // include the unique-coded rows already collected above
    for (let i = 0; i < canonicalRows.length; i++) {
      const raw = canonicalRows[i].product.product_code ? String(canonicalRows[i].product.product_code) : '';
      const norm = normalizeCode(raw);
      if (!raw) {
        consolidatedRows.push(i);
      } else if (!duplicatedCodes.has(norm)) {
        if (!consolidatedRows.includes(i)) consolidatedRows.push(i);
      }
    }

    // Build set of normalized codes to check in DB (exclude duplicatedCodes)
    const codesToCheckNormalized = new Set();
    const normalizedToExample = new Map(); // normCode -> example original code
    consolidatedRows.forEach(i => {
      const raw = canonicalRows[i].product.product_code ? String(canonicalRows[i].product.product_code) : '';
      const norm = normalizeCode(raw);
      if (norm) {
        codesToCheckNormalized.add(norm);
        if (!normalizedToExample.has(norm)) normalizedToExample.set(norm, raw);
      }
    });

    // Query DB for existing product codes + full row using normalized match (ignore spaces and case)
    const existingMap = new Map(); // normCode -> { id, product_code, name, description, mrp, discount, price, image_url, category_id, subcategory_id, stock_quantity, age_range, gender, brand_name, is_new_arrival }
    if (codesToCheckNormalized.size) {
      const placeholders = Array.from(codesToCheckNormalized).map(() => '?').join(',');
      const [rowsDb] = await db.query(
        `SELECT id, product_code, name, description, mrp, discount, price, image_url, category_id, subcategory_id, stock_quantity, age_range, gender, brand_name, is_new_arrival FROM products WHERE REPLACE(LOWER(product_code),' ','') IN (${placeholders})`,
        Array.from(codesToCheckNormalized)
      );
      for (const r of rowsDb) {
        if (r.product_code) {
          const normEx = String(r.product_code).replace(/\s+/g, '').toLowerCase();
          existingMap.set(normEx, {
            id: r.id,
            product_code: r.product_code,
            name: String(r.name || '').trim(),
            description: r.description,
            mrp: r.mrp,
            discount: r.discount,
            price: r.price,
            image_url: r.image_url,
            category_id: r.category_id,
            subcategory_id: r.subcategory_id,
            stock_quantity: r.stock_quantity,
            age_range: r.age_range,
            gender: r.gender,
            brand_name: r.brand_name,
            is_new_arrival: r.is_new_arrival
          });
        }
      }
    }

    // Now process each consolidated row
    const processedCodes = new Set();
    for (const idx of consolidatedRows) {
      const obj = canonicalRows[idx];
      const product = obj.product;
      const errors = [];

      // Name required
      if (!product.name || !String(product.name).trim()) errors.push('Missing product name');

      // Price validation
      let price = null;
      if (product.price !== undefined && product.price !== null && String(product.price).trim() !== '') {
        const cleaned = String(product.price).replace(/[^0-9.\-]/g, '');
        price = parseFloat(cleaned);
        if (isNaN(price) || price < 0) errors.push('Invalid price');
      } else {
        errors.push('Missing price');
      }

      // Stock validation
      let stock = 0;
      if (product.stock_quantity !== undefined && product.stock_quantity !== null && String(product.stock_quantity).trim() !== '') {
        const cleaned = String(product.stock_quantity).replace(/[^0-9\-]/g, '');
        stock = parseInt(cleaned, 10);
        if (isNaN(stock) || stock < 0) errors.push('Invalid stock quantity');
      } else {
        stock = 0;
      }

      // Product code handling
      let pcode = product.product_code ? String(product.product_code).trim() : '';
      // auto-generate if missing
      if (!pcode) {
        pcode = `AUTO-${Date.now()}-${idx}`;
      }

      const normPcode = normalizeCode(pcode);

      // If this normalized code was marked duplicated in file earlier, skip (already rejected)
      if (normPcode && duplicatedCodes.has(normPcode)) continue;

      // Prevent processing same normalized code twice (in case)
      if (normPcode && processedCodes.has(normPcode)) {
        rejected.push({ name: product.name || product.uploaded_name || '', uploaded_name: product.uploaded_name || product.name || '', uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: 'Duplicate product code within file (ignored duplicate)' });
        continue;
      }

      // Check against DB using normalized code
      const existingEntry = normPcode ? existingMap.get(normPcode) : null;
      const existingName = existingEntry ? existingEntry.name : null;
      if (existingName) {
        // product exists in DB; compare names by normalizing (ignore spaces & case)
        const uploadedDisplay = String(product.name || product.uploaded_name || '').trim();
        if (normalizeName(existingName) === normalizeName(uploadedDisplay)) {
          // allowed: update existing row
          if (errors.length) {
            rejected.push({ name: uploadedDisplay, uploaded_name: uploadedDisplay, uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: errors.join('; ') });
            continue;
          }

          try {
            // Use the actual DB product_code in WHERE clause to be safe (matches DB row precisely)
            const dbCode = existingEntry.product_code;
            await db.query(
              `UPDATE products SET name = ?, description = ?, mrp = ?, discount = ?, price = ?, image_url = ?, category_id = ?, subcategory_id = ?, stock_quantity = ?, age_range = ?, gender = ?, brand_name = ?, is_new_arrival = ? WHERE product_code = ?`,
              [
                uploadedDisplay, product.description || '', product.mrp || null, product.discount || null,
                price, null, product.category_id || null, product.subcategory_id || null, stock,
                product.age_range || '', product.gender || '', product.brand_name || '', product.is_new_arrival ? 1 : 0,
                dbCode
              ]
            );
            accepted.push({ name: uploadedDisplay, product_code: pcode, status: 'Updated' });
            processedCodes.add(normPcode);
          } catch (err) {
            console.error('Row update error:', err);
            rejected.push({ name: uploadedDisplay, uploaded_name: uploadedDisplay, uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: err?.message || 'DB error on update' });
          }
        } else {
          // name mismatch with DB -> reject with explicit both names
          const uploadedDisplay = String(product.name || product.uploaded_name || '').trim();
          const reasonMsg = `Product code exists with different name in database (DB: "${existingName}", Uploaded: "${uploadedDisplay}")`;
          rejected.push({ name: uploadedDisplay, uploaded_name: uploadedDisplay, uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: reasonMsg, existing_name: existingName });
        }
      } else {
        // new product - validate errors and insert
        if (errors.length) {
          rejected.push({ name: product.name || product.uploaded_name || '', uploaded_name: product.uploaded_name || product.name || '', uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: errors.join('; ') });
          continue;
        }

        try {
          const result = await db.query(
            `INSERT INTO products
            (name, product_code, description, mrp, discount, price, image_url,
             category_id, subcategory_id, stock_quantity, age_range, gender,
             brand_name, is_new_arrival)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(product.name).trim(), pcode, product.description || '', product.mrp || null, product.discount || null,
              price, null,
              product.category_id || null, product.subcategory_id || null, stock,
              product.age_range || '', product.gender || '', product.brand_name || '', product.is_new_arrival ? 1 : 0
            ]
          );
          accepted.push({ name: product.name, product_code: pcode, status: 'Saved' });
          if (normPcode) processedCodes.add(normPcode);
        } catch (err) {
          console.error('Row insert error:', err);
          rejected.push({ name: product.name || product.uploaded_name || '', uploaded_name: product.uploaded_name || product.name || '', uploaded_brand: product.uploaded_brand || product.brand_name || '', product_code: pcode, reason: err?.message || 'DB error on insert' });
        }
      }
    }

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '..', 'uploads', 'import-reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    // Create accepted report with BOTH existing database products AND newly accepted products
    // Query all products from database WITHOUT any limit
    console.log('🔍 Starting to fetch all products from database...');
    const [allProducts] = await db.query(`
      SELECT id, name, product_code FROM products
    `);
    
    console.log(`📊 Total existing products in database: ${allProducts?.length || 0}`);
    console.log(`📊 Newly accepted products from this upload: ${accepted.length}`);
    
    // Combine both lists
    const allAcceptedData = [];
    
    // Add all existing database products with "Existing" status
    if (allProducts && Array.isArray(allProducts)) {
      allProducts.forEach((p) => {
        allAcceptedData.push({
          name: p.name || 'N/A', 
          product_code: p.product_code || `ID-${p.id}`, 
          status: 'Existing'
        });
      });
    }
    
    console.log(`After adding existing products: ${allAcceptedData.length} total`);
    
    // Add newly accepted products from current upload with their actual status (Saved/Updated)
    accepted.forEach(r => {
      allAcceptedData.push({
        name: r.name,
        product_code: r.product_code,
        status: r.status // 'Saved' or 'Updated'
      });
    });
    
    console.log(`📊 Total products in accepted file: ${allAcceptedData.length}`);
    
    // Create Excel using array of arrays approach for better large dataset handling
    const acceptedWb = xlsx.utils.book_new();
    const acceptedWs = xlsx.utils.aoa_to_sheet([
      ['name', 'product_code', 'status'], // Header row
      ...allAcceptedData.map(p => [p.name, p.product_code, p.status]) // Data rows
    ]);
    
    xlsx.utils.book_append_sheet(acceptedWb, acceptedWs, 'Accepted');
    
    const acceptedFileName = `accepted-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}.xlsx`;
    const acceptedPath = path.join(reportsDir, acceptedFileName);
    xlsx.writeFile(acceptedWb, acceptedPath);
    
    console.log(`✅ Accepted file created at: ${acceptedPath}`);
    
    // Verify file was created and check size
    const fileExists = fs.existsSync(acceptedPath);
    const fileSize = fileExists ? fs.statSync(acceptedPath).size : 0;
    console.log(`📁 File exists: ${fileExists}, File size: ${(fileSize / 1024).toFixed(2)} KB, Rows: ${allAcceptedData.length + 1}`);

    // Create rejected report
    const rejectedSheet = xlsx.utils.json_to_sheet(rejected.map(r => ({ name: r.name, product_code: r.product_code, reason: r.reason, existing_name: r.existing_name || '', uploaded_name: r.uploaded_name || '', uploaded_brand: r.uploaded_brand || '' })));
    const rejectedWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(rejectedWb, rejectedSheet, 'Rejected');
    const rejectedFileName = `rejected-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}.xlsx`;
    const rejectedPath = path.join(reportsDir, rejectedFileName);
    xlsx.writeFile(rejectedWb, rejectedPath);

    const hostBase = `${req.protocol}://${req.get('host')}`;

    // compute saved vs updated counts
    const savedCount = accepted.filter(a => a.status === 'Saved').length;
    const updatedCount = accepted.filter(a => a.status === 'Updated').length;

    res.json({
      success: true,
      message: 'Import completed',
      totalRows: rows.length,
      savedCount,
      updatedCount,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      acceptedFileUrl: `${hostBase}/uploads/import-reports/${acceptedFileName}`,
      rejectedFileUrl: `${hostBase}/uploads/import-reports/${rejectedFileName}`,
      acceptedRows: accepted,
      rejectedRows: rejected,
      totalExistingProducts: allProducts.length,
      totalAcceptedProducts: allAcceptedData.length
    });
  } catch (err) {
    console.error('Import products error:', err);
    res.status(500).json({ success: false, message: 'Server error during import' });
  }
};
   


// Update product image
// exports.updateProductImage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     let uploadedImages = [];
//     if (Array.isArray(req.files)) {
//       uploadedImages = req.files.filter(
//         file => file?.fieldname === 'image' || file?.fieldname === 'images'
//       );
//     } else if (req.files) {
//       if (Array.isArray(req.files.image)) uploadedImages = uploadedImages.concat(req.files.image);
//       if (Array.isArray(req.files.images)) uploadedImages = uploadedImages.concat(req.files.images);
//     }
//     if (uploadedImages.length === 0 && req.file) uploadedImages = [req.file];
//     if (uploadedImages.length === 0) {
//       return res.status(400).json({ success: false, message: 'No image file provided' });
//     }

//     const primaryIndexRaw = Array.isArray(req.body?.primaryImageIndex)
//       ? req.body.primaryImageIndex[0]
//       : req.body?.primaryImageIndex;
//     let primaryIndex = parseInt(primaryIndexRaw, 10);
//     if (Number.isNaN(primaryIndex) || primaryIndex < 0 || primaryIndex >= uploadedImages.length) {
//       const explicitPrimaryIdx = uploadedImages.findIndex(f => f.fieldname === 'image');
//       primaryIndex = explicitPrimaryIdx !== -1 ? explicitPrimaryIdx : 0;
//     }

//     const primaryFile = uploadedImages[primaryIndex];
//     const additionalImages = uploadedImages.filter((_, i) => i !== primaryIndex);

//     await db.query('UPDATE products SET image = ?, image_type = ? WHERE id = ?', [
//       primaryFile.buffer,
//       primaryFile.mimetype,
//       id,
//     ]);

//     let insertedCount = 0;
//     if (additionalImages.length > 0) {
//       // await ensureProductImagesTable();

//       const [[{ maxOrder = -1 } = {}]] = await db.query(
//         'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?',
//         [id]
//       );
//       const baseOrder = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) : -1;

//       await Promise.all(
//         additionalImages.map((file, index) =>
//           db.query(
//             `INSERT INTO product_images (product_id, image, image_type, sort_order) VALUES (?, ?, ?, ?)`,
//             [id, file.buffer, file.mimetype, baseOrder + 1 + index]
//           )
//         )
//       );
//       insertedCount = additionalImages.length;
//     }

//     res.status(200).json({
//       success: true,
//       message:
//         insertedCount > 0
//           ? `Product image updated. Added ${insertedCount} additional image${insertedCount > 1 ? 's' : ''}.`
//           : 'Product image updated successfully.',
//       primaryUpdated: true,
//       additionalInserted: insertedCount,
//     });
//   } catch (error) {
//     console.error('Update image error:', error);
//     res.status(500).json({ message: 'Server error while updating image' });
//   }
// };

// Bulk delete products by uploaded product codes (file)
exports.bulkDeleteProducts = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.files[0];
    const ext = path.extname(file.originalname || '').toLowerCase();

    // Read file
    let workbook;
    if (ext === '.csv' || ext === '.txt' || ext === '.tsv') {
      const raw = fs.readFileSync(file.path, 'utf8');
      const delim = raw.indexOf('\t') !== -1 ? '\t' : raw.indexOf('|') !== -1 ? '|' : ',';
      let normalized = raw;
      if (delim !== ',') {
        normalized = raw.split('\n').map(line => line.split(delim).join(',')).join('\n');
      }
      workbook = xlsx.read(normalized, { type: 'string' });
    } else {
      workbook = xlsx.readFile(file.path);
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return res.status(400).json({ success: false, message: 'No sheet found in file' });

    let rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });
    rows = rows.filter(r => Object.values(r).some(v => v !== null && String(v).trim() !== ''));
    if (!rows.length) return res.status(400).json({ success: false, message: 'No rows to process' });

    const guessField = (header) => {
      if (!header) return null;
      const h = String(header).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (/code|sku|productcode/.test(h)) return 'product_code';
      if (/brand|brandname/.test(h)) return 'brand_name';
      return null;
    };

    // Build header map
    const headers = Object.keys(rows[0] || {});
    const headerMap = {};
    headers.forEach(h => {
      const mapped = guessField(h);
      if (mapped) headerMap[h] = mapped;
    });

    const normalizeCode = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();

    const inputs = []; // { originalCode, norm, uploaded_brand }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let rawCode = '';
      // use explicit product_code column if present
      const codeKey = Object.keys(headerMap).find(k => headerMap[k] === 'product_code');
      if (codeKey) rawCode = String(row[codeKey] || '').trim();
      else {
        // fallback: first non-empty cell in the row (but we expect a code column normally)
        for (const k of Object.keys(row)) {
          const v = String(row[k] || '').trim();
          if (v) { rawCode = v; break; }
        }
      }

      const brandKey = Object.keys(headerMap).find(k => headerMap[k] === 'brand_name');
      const uploaded_brand = brandKey ? String(row[brandKey] || '').trim() : '';

      if (!rawCode) {
        inputs.push({ originalCode: '', norm: '', uploaded_brand, reason: 'Missing product code' });
        continue;
      }

      const norm = normalizeCode(rawCode);
      inputs.push({ originalCode: String(rawCode), norm, uploaded_brand });
    }

    // Build unique normalized set to query DB
    const normSet = new Set(inputs.filter(i => i.norm).map(i => i.norm));
    const normalizedToOriginal = new Map(); // norm -> example original
    inputs.forEach(i => {
      if (i.norm && !normalizedToOriginal.has(i.norm)) normalizedToOriginal.set(i.norm, i.originalCode);
    });

    const deleted = [];
    const notFound = [];

    if (normSet.size) {
      const placeholders = Array.from(normSet).map(() => '?').join(',');
      const [rowsDb] = await db.query(
        `SELECT id, product_code, name, REPLACE(LOWER(product_code),' ','') AS norm FROM products WHERE REPLACE(LOWER(product_code),' ','') IN (${placeholders})`,
        Array.from(normSet)
      );

      const foundNormToDb = new Map(); // norm -> { id, product_code, name }
      for (const r of rowsDb) {
        const n = String(r.norm || '').toLowerCase();
        foundNormToDb.set(n, { id: r.id, product_code: r.product_code, name: r.name });
      }

      const toDeleteIds = [];
      for (const n of normSet) {
        if (foundNormToDb.has(n)) {
          toDeleteIds.push(foundNormToDb.get(n).id);
        }
      }

      // Delete dependent rows and then each product individually so we can report per-product failures
      if (toDeleteIds.length) {
        for (const id of toDeleteIds) {
          const entry = rowsDb.find(r => r.id === id);
          try {
            await db.query('DELETE FROM product_tags WHERE product_id = ?', [id]);
          } catch (err) {
            console.warn('Could not delete product_tags for id', id, err?.message || err);
          }
          try {
            await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
          } catch (err) {
            console.warn('Could not delete product_images for id', id, err?.message || err);
          }

          try {
            const [delRes] = await db.query('DELETE FROM products WHERE id = ?', [id]);
            if (delRes && delRes.affectedRows && delRes.affectedRows > 0) {
              deleted.push({ product_code: entry ? entry.product_code : '', name: entry ? entry.name : '' });
            } else {
              notFound.push({ product_code: entry ? entry.product_code : '', uploaded_brand: '', reason: 'Could not delete (no rows affected)' });
            }
          } catch (err) {
            console.error('Could not delete product id', id, err.message || err);
            notFound.push({ product_code: entry ? entry.product_code : '', uploaded_brand: '', reason: err.message || 'Delete failed due to foreign key' });
          }
        }
      }

      // Prepare notFound list for norms not in DB
      for (const n of normSet) {
        if (!foundNormToDb.has(n)) {
          notFound.push({ product_code: normalizedToOriginal.get(n) || '', uploaded_brand: '', reason: 'Not found in database' });
        }
      }
    }

    // Also include rows with missing codes
    inputs.filter(i => !i.norm).forEach(i => {
      notFound.push({ product_code: i.originalCode || '', uploaded_brand: i.uploaded_brand || '', reason: i.reason || 'Missing product code' });
    });

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '..', 'uploads', 'import-reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    // Deleted report
    const deletedSheet = xlsx.utils.json_to_sheet(deleted.map(r => ({ product_code: r.product_code, name: r.name })));
    const deletedWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(deletedWb, deletedSheet, 'Deleted');
    const deletedFileName = `deleted-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}.xlsx`;
    const deletedPath = path.join(reportsDir, deletedFileName);
    xlsx.writeFile(deletedWb, deletedPath);

    // Not found report
    const notFoundSheet = xlsx.utils.json_to_sheet(notFound.map(r => ({ product_code: r.product_code, uploaded_brand: r.uploaded_brand || '', reason: r.reason })));
    const notFoundWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(notFoundWb, notFoundSheet, 'NotFound');
    const notFoundFileName = `notfound-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}.xlsx`;
    const notFoundPath = path.join(reportsDir, notFoundFileName);
    xlsx.writeFile(notFoundWb, notFoundPath);

    const hostBase = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      message: 'Bulk delete completed',
      totalRows: rows.length,
      deletedCount: deleted.length,
      notFoundCount: notFound.length,
      deletedFileUrl: `${hostBase}/uploads/import-reports/${deletedFileName}`,
      notFoundFileUrl: `${hostBase}/uploads/import-reports/${notFoundFileName}`,
      deletedRows: deleted,
      notFoundRows: notFound
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ success: false, message: 'Server error during bulk delete' });
  }
};

exports.updateProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    let files = [];
    if (Array.isArray(req.files)) files = req.files;
    else if (req.file) files = [req.file];

    if (!files.length) {
      return res.status(400).json({ message: "No image provided" });
    }

    const primary = files[0];
    const image_url = `/uploads/products/${primary.filename}`;

    await db.query(
      `UPDATE products SET image_url = ? WHERE id = ?`,
      [image_url, id]
    );

    const extra = files.slice(1);
    let order = 0;

    for (let f of extra) {
      await db.query(
        `INSERT INTO product_images (product_id, image_url, sort_order)
         VALUES (?, ?, ?)`,
        [id, `/uploads/products/${f.filename}`, order++]
      );
    }

    res.json({ success: true, message: "Images updated" });
  } catch (error) {
    console.error("Update image error:", error);
    res.status(500).json({ message: "Server error while updating image" });
  }
};



// Delete product image

// exports.deleteProductImage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await db.query(`UPDATE products SET image_url = NULL WHERE id = ?`, [id]);
//     await db.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);

//     res.json({ success: true, message: "Images deleted" });
//   } catch (error) {
//     console.error("Delete image error:", error);
//     res.status(500).json({ message: "Server error while deleting images" });
//   }
// };

exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    // Get image details including its URL
    const [[img]] = await db.query(
      "SELECT product_id, image_url FROM product_images WHERE id = ?",
      [imageId]
    );

    if (!img) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    const productId = img.product_id;
    const imageUrl = img.image_url;

    // Delete file from disk
    const path = require("path");
    const fs = require("fs");
    const filePath = path.join(__dirname, "..", imageUrl);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileErr) {
        console.warn("Could not delete file from disk:", fileErr.message);
        // Continue with DB deletion even if file deletion fails
      }
    }

    // Delete from DB
    await db.query("DELETE FROM product_images WHERE id = ?", [imageId]);

    // Check if this was the selected main image
    const [[product]] = await db.query(
      "SELECT image_url FROM products WHERE id = ?",
      [productId]
    );

    // If the deleted image was the main display image, clear the selection
    if (product && product.image_url === imageUrl) {
      await db.query(
        "UPDATE products SET image_url = NULL WHERE id = ?",
        [productId]
      );
      console.log("Cleared main image selection for product:", productId);
    }

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// Set image as main/display image
exports.setMainImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageId } = req.body;

    console.log("setMainImage called - Product ID:", id, "Image ID:", imageId);

    if (!imageId) {
      return res.status(400).json({ success: false, message: "Image ID is required" });
    }

    // Get the image details
    const [[img]] = await db.query(
      "SELECT image_url FROM product_images WHERE id = ? AND product_id = ?",
      [imageId, id]
    );

    console.log("Image found:", img);

    if (!img) {
      return res.status(404).json({ success: false, message: "Image not found for this product" });
    }

    // Update the product's main image
    await db.query(
      "UPDATE products SET image_url = ? WHERE id = ?",
      [img.image_url, id]
    );

    console.log("Product image updated to:", img.image_url);

    res.json({ success: true, message: "Main image updated successfully" });
  } catch (err) {
    console.error("Set main image error:", err);
    res.status(500).json({ success: false, message: "Failed to set main image" });
  }
};

exports.clearMainImage = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("clearMainImage called - Product ID:", id);

    // Clear the product's main image by setting it to NULL
    await db.query(
      "UPDATE products SET image_url = NULL WHERE id = ?",
      [id]
    );

    console.log("Product image cleared");

    res.json({ success: true, message: "Main image cleared successfully" });
  } catch (err) {
    console.error("Clear main image error:", err);
    res.status(500).json({ success: false, message: "Failed to clear main image" });
  }
};

exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity is required"
      });
    }

    await db.query(
      "UPDATE products SET stock_quantity = ? WHERE id = ?",
      [stock_quantity, id]
    );

    res.json({
      success: true,
      message: "Stock updated successfully"
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating stock"
    });
  }
};



// Update product details (name, description, specifications, highlights, age_range, brand_name, gender)
exports.updateProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept category_id and discount for editing, and keep existing allowed fields
    const { name, description, age_range, brand_name, gender, tag_ids, customized, category_id, subcategory_id, discount } = req.body;

    // Check if product exists
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Update product details including category, mrp, price and discount
    const finalCategoryId = category_id ? parseInt(category_id, 10) : null;
    const finalSubcategoryId = subcategory_id ? parseInt(subcategory_id, 10) : null;

    // Parse incoming numeric fields (mrp, price, discount) if provided
    const incomingMrp = (typeof req.body.mrp !== 'undefined' && req.body.mrp !== null && req.body.mrp !== '') ? Number(req.body.mrp) : null;
    const incomingPrice = (typeof req.body.price !== 'undefined' && req.body.price !== null && req.body.price !== '') ? Number(req.body.price) : null;
    const incomingDiscount = (typeof discount !== 'undefined' && discount !== null && discount !== '') ? Number(discount) : null;

    const currentProduct = products[0] || {};
    const currentMrp = currentProduct.mrp ? Number(currentProduct.mrp) : null;
    const currentPrice = currentProduct.price ? Number(currentProduct.price) : null;

    // Decide final values to save
    const mrpToSave = incomingMrp !== null && !isNaN(incomingMrp) ? incomingMrp : currentMrp;
    let priceToSave = incomingPrice !== null && !isNaN(incomingPrice) ? incomingPrice : currentPrice;
    let discountToSave = incomingDiscount !== null && !isNaN(incomingDiscount) ? incomingDiscount : (currentProduct.discount != null ? Number(currentProduct.discount) : null);

    // If admin provided discount, compute price from mrp (if mrp available)
    if (incomingDiscount !== null && !isNaN(incomingDiscount) && mrpToSave) {
      const d = Math.max(0, Math.min(100, incomingDiscount));
      priceToSave = parseFloat((mrpToSave * (1 - d / 100)).toFixed(2));
      discountToSave = d;
    }

    // If admin provided price or mrp (or both), compute discount from mrp/price when possible
    if ((incomingPrice !== null && !isNaN(incomingPrice)) || (incomingMrp !== null && !isNaN(incomingMrp))) {
      if (mrpToSave && priceToSave != null && !isNaN(priceToSave) && mrpToSave > 0) {
        const d = ((mrpToSave - priceToSave) / mrpToSave) * 100;
        discountToSave = parseFloat(Math.max(0, Math.min(100, d)).toFixed(2));
      } else {
        // if we can't compute discount, leave as provided or null
        discountToSave = discountToSave != null ? discountToSave : null;
      }
    }

    // Final safety: ensure numbers or null
    const finalMrp = (!isNaN(mrpToSave) && mrpToSave != null) ? mrpToSave : null;
    const finalPrice = (!isNaN(priceToSave) && priceToSave != null) ? priceToSave : null;
    const finalDiscount = (discountToSave != null && !isNaN(discountToSave)) ? discountToSave : 0;

    // Persist all fields (mrp, price, discount) along with other details
    await db.query(
      `UPDATE products 
       SET name = ?, description = ?, age_range = ?, brand_name = ?, gender = ?, customized = ?, category_id = ?, subcategory_id = ?, mrp = ?, price = ?, discount = ?
       WHERE id = ?`,
      [name, description, age_range, brand_name, gender, customized || 0, finalCategoryId, finalSubcategoryId, finalMrp, finalPrice, finalDiscount, id]
    );

    // 🎭 Update tags if provided
    if (tag_ids && Array.isArray(tag_ids)) {
      // Delete existing tags
      await db.query('DELETE FROM product_tags WHERE product_id = ?', [id]);
      
      // Insert new tags
      if (tag_ids.length > 0) {
        const tagValues = tag_ids.map(tagId => [id, tagId]);
        await db.query('INSERT INTO product_tags (product_id, tag_id) VALUES ?', [tagValues]);
      }
    }

    // Fetch updated product
    const [updatedProducts] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Product details updated successfully',
      product: updatedProducts[0]
    });

  } catch (error) {
    console.error('Update product details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating product details' 
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for existing order references (excluding cancelled orders)
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS referenceCount FROM order_items oi
         LEFT JOIN orders_new o ON oi.order_id = o.id
         WHERE oi.product_id = ? AND (o.id IS NULL OR o.order_status != 'cancelled')`,
        [id]
      );
      
      const referenceCount = rows?.[0]?.referenceCount || 0;

      if (referenceCount > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete product because it is referenced by existing active orders. Please cancel the related orders first.',
          references: referenceCount
        });
      }
    } catch (checkError) {
      console.log('Check order references error (will proceed with deletion):', checkError.message);
      // Continue with deletion even if check fails
    }

    // Delete all product images first
    await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);

    // Delete any orphaned order_items for this product
    await db.query('DELETE FROM order_items WHERE product_id = ?', [id]);

    // Delete the product itself
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    // Handle FK constraint error gracefully
    if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.message?.includes('FOREIGN KEY')) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product because it is referenced by existing orders. Please cancel the related orders first.',
        errorCode: 'FK_CONSTRAINT'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user orders with items
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    
    try {
      const [ordersResult] = await db.query(
        `SELECT * FROM orders_new WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        const [ordersResult] = await db.query(
          `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
          [userId]
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orderIds = orders.map(order => order.id);

    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (?) ORDER BY created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const formattedOrders = orders.map(order => {
      let paymentDetails = order.payment_details;
      if (paymentDetails) {
        try {
          paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
        } catch (err) {
          paymentDetails = null;
        }
      }

      const canModify = ['pending', 'processing'].includes(order.order_status);

      return {
        ...order,
        payment_details: paymentDetails,
        items: itemsByOrder[order.id] || [],
        isCancelable: canModify,
        canUpdateAddress: canModify,
      };
    });

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      `SELECT * FROM orders_new WHERE id = ?`,
      [orderId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
      [orderId]
    );

    let paymentDetails = order.payment_details;
    if (paymentDetails) {
      try {
        paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
      } catch (err) {
        paymentDetails = null;
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order,
        payment_details: paymentDetails,
        items,
        isCancelable: ['pending', 'processing'].includes(order.order_status),
        canUpdateAddress: ['pending', 'processing'].includes(order.order_status),
      },
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
};

// Admin: Get all orders with items (optionally filter by status)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    let tableName = 'orders_new';
    
    try {
      const whereClause = status ? 'WHERE order_status = ?' : '';
      const params = status ? [status] : [];

      const [ordersResult] = await db.query(
        `SELECT * FROM orders_new ${whereClause} ORDER BY created_at DESC`,
        params
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        tableName = 'orders';
        const whereClause = status ? 'WHERE order_status = ?' : '';
        const params = status ? [status] : [];

        const [ordersResult] = await db.query(
          `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC`,
          params
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);

    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (?) ORDER BY created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const formatted = orders.map(order => {
      let paymentDetails = order.payment_details;
      if (paymentDetails) {
        try {
          paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
        } catch (_) {
          paymentDetails = null;
        }
      }
      return {
        ...order,
        payment_details: paymentDetails,
        items: itemsByOrder[order.id] || []
      };
    });

    res.status(200).json({ success: true, orders: formatted });
  } catch (error) {
    console.error('Get all orders error:', error);
    // Ensure we always return JSON, even on error
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching all orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Accept an order (mark as 'accepted') - changes status from pending to accepted
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    let tableName = 'orders_new';
    
    try {
      const [ordersResult] = await db.query(
        `SELECT id, order_status FROM orders_new WHERE id = ?`,
        [orderId]
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        tableName = 'orders';
        const [ordersResult] = await db.query(
          `SELECT id, order_status FROM orders WHERE id = ?`,
          [orderId]
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    
    // Only allow accepting orders that are pending
    if (order.order_status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot accept order. Current status is '${order.order_status}'. Only pending orders can be accepted.` 
      });
    }

    // Update order status from pending to accepted
    await db.query(
      `UPDATE ${tableName} SET order_status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    res.status(200).json({ success: true, message: 'Order accepted successfully. Status changed from pending to accepted.' });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while accepting order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel order and restock items
// exports.cancelOrder = async (req, res) => {
//   const connection = await db.getConnection();

//   try {
//     const { orderId } = req.params;
//     const { userId } = req.body;

//     if (!orderId) {
//       connection.release();
//       return res.status(400).json({ success: false, message: 'Order ID is required' });
//     }

//     await connection.beginTransaction();

//     // const [orders] = await connection.query(
//     //   `SELECT id, user_id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
//     //   [orderId]
//     // );

//     // if (!orders.length) {
//     //   await connection.rollback();
//     //   connection.release();
//     //   return res.status(404).json({ success: false, message: 'Order not found' });
//     // }

//     // const order = orders[0];

//     // Allow cancellation if userId is provided and matches, or if no userId is provided (admin cancellation)
//     // if (userId && order.user_id && Number(order.user_id) !== Number(userId)) {
//     //   await connection.rollback();
//     //   connection.release();
//     //   return res.status(403).json({ success: false, message: 'You are not authorized to modify this order' });
//     // }

//     // if (['cancelled', 'delivered'].includes(order.order_status)) {
//     //   await connection.rollback();
//     //   connection.release();
//     //   return res.status(400).json({ success: false, message: `Order already ${order.order_status}` });
//     // }

//   //   const [items] = await connection.query(
//   //     `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
//   //     [orderId]
//   //   );

//   //   // Restock all items
//   //   for (const item of items) {
//   //     await connection.query(
//   //       'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
//   //       [item.quantity, item.product_id]
//   //     );
//   //   }

//   //   // Update order status to cancelled
//   //   await connection.query(
//   //     `UPDATE orders_new SET order_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
//   //     [orderId]
//   //   );

//   //   // Delete order items (cleanup)
//   //   await connection.query(
//   //     `DELETE FROM order_items WHERE order_id = ?`,
//   //     [orderId]
//   //   );

//   //   await connection.commit();
//   //   connection.release();

//   //   res.status(200).json({ success: true, message: 'Order cancelled successfully and items restocked' });

//   // } catch (error) {
//   //   await connection.rollback();
//   //   connection.release();
//   //   console.error('Cancel order error:', error);
//   //   res.status(500).json({ success: false, message: 'Server error while cancelling order' });
//   // }
// };

exports.cancelOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    if (order.order_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }

    const [items] = await connection.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    for (const item of items) {
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      `UPDATE orders_new SET order_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    await connection.commit();

    res.json({ success: true, message: 'Order cancelled successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error while cancelling order' });
  } finally {
    connection.release();
  }
};


exports.updateOrderAddress = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { orderId } = req.params;
    const { userId, shippingAddress } = req.body;

    if (!orderId || !userId || !shippingAddress) {
      connection.release();
      return res.status(400).json({
        message: 'Order ID, User ID and shipping address are required'
      });
    }

    const {
      fullName,
      email,
      phone,
      address,
      city,
      state = '',
      zipCode,
      country = 'India',
    } = shippingAddress;

    if (!fullName || !email || !phone || !address || !city || !zipCode) {
      connection.release();
      return res.status(400).json({
        message: 'Incomplete shipping address details'
      });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT user_id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (order.user_id && Number(order.user_id) !== Number(userId)) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({ message: 'You are not authorized to modify this order' });
    }

    if (!['pending', 'processing'].includes(order.order_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Address cannot be updated after order is shipped'
      });
    }

    await connection.query(
      `UPDATE orders_new SET 
        shipping_full_name = ?,
        shipping_email = ?,
        shipping_phone = ?,
        shipping_address = ?,
        shipping_city = ?,
        shipping_state = ?,
        shipping_zip_code = ?,
        shipping_country = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        fullName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        orderId,
      ]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: 'Shipping address updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Update order address error:', error);
    res.status(500).json({
      message: 'Server error while updating address'
    });
  }
};

// exports.getProductsBySubcategory = async (req, res) => {
//   try {
//     const { subcategoryId } = req.params;
    
//     const [products] = await db.query(
//       'SELECT * FROM products WHERE subcategory_id = ? ORDER BY created_at DESC',
//       [subcategoryId]
//     );
    
//   
//     res.status(200).json({
//       success: true,
//       products: productsWithImages
//     });
//   } catch (error) {
//     console.error('Get products by subcategory error:', error);
//     res.status(500).json({ message: 'Server error while fetching products' });
//   }
// };

// exports.getProductsByTag = async (req, res) => {
//   try {
//     const tagId = req.params.tagId;

//     // Fetch all products that belong to this tag
//     const [products] = await db.query(
//       `SELECT p.*
//        FROM products p
//        JOIN product_tags pt ON p.id = pt.product_id
//        WHERE pt.tag_id = ?`,
//       [tagId]
//     );


// exports.getProductsByTag = async (req, res) => {
//   const { tagId } = req.params;

//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         p.id,
//         p.name,
//         p.description,
//         p.price,
//         p.age_range,
//         p.brand_name,
//         p.stock_quantity,
//         MIN(pi.image_url) AS image
//       FROM products p
//       INNER JOIN product_tags pt ON p.id = pt.product_id
//       LEFT JOIN product_images pi ON p.id = pi.product_id
//       WHERE pt.tag_id = ?
//       GROUP BY p.id
//     `, [tagId]);

//     res.json({
//       success: true,
//       products: rows
//     });

//   } catch (error) {
//     console.error("getProductsByTag error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch products by tag"
//     });
//   }
// };




    // if (!orderId || !userId || !shippingAddress) {
    //   connection.release();
    //   return res.status(400).json({ message: 'Order ID, User ID and shipping address are required' });
    // }

    // const {
    //   fullName,
    //   email,
    //   phone,
    //   address,
    //   city,
    //   state = '',
    //   zipCode,
    //   country = 'India',
    // } = shippingAddress;

    // if (!fullName || !email || !phone || !address || !city || !zipCode) {
    //   connection.release();
    //   return res.status(400).json({ message: 'Incomplete shipping address details' });
    // }

    // await connection.beginTransaction();

//     const [orders] = await connection.query(
//       `SELECT user_id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
//       [orderId]
//     );

//     if (!orders.length) {
//       await connection.rollback();
//       connection.release();
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const order = orders[0];

//     if (order.user_id && Number(order.user_id) !== Number(userId)) {
//       await connection.rollback();
//       connection.release();
//       return res.status(403).json({ message: 'You are not authorized to modify this order' });
//     }

//     if (!['pending', 'processing'].includes(order.order_status)) {
//       await connection.rollback();
//       connection.release();
//       return res.status(400).json({ message: 'Address cannot be updated after order is shipped' });
//     }

//     await connection.query(
//       `UPDATE orders_new SET 
//         shipping_full_name = ?,
//         shipping_email = ?,
//         shipping_phone = ?,
//         shipping_address = ?,
//         shipping_city = ?,
//         shipping_state = ?,
//         shipping_zip_code = ?,
//         shipping_country = ?,
//         updated_at = CURRENT_TIMESTAMP
//        WHERE id = ?`,
//       [
//         fullName,
//         email,
//         phone,
//         address,
//         city,
//         state,
//         zipCode,
//         country,
//         orderId,
//       ]
//     );

//     await connection.commit();
//     connection.release();

//     res.status(200).json({ success: true, message: 'Shipping address updated successfully' });

//   } catch (error) {
//     await connection.rollback();
//     connection.release();
//     console.error('Update order address error:', error);
//     res.status(500).json({ message: 'Server error while updating address' });
//   }
// };

// Get products by subcategory

exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    // Check if it's a name (not a number) and look up the ID
    let finalSubcategoryId = subcategoryId;
    
    if (isNaN(subcategoryId)) {
      // It's a name — look up the sno from subcategory table
      const [rows] = await db.query(
        `SELECT sno FROM subcategory WHERE subcategory_name = ? LIMIT 1`,
        [subcategoryId]
      );
      if (!rows.length) {
        return res.json({ success: true, products: [] });
      }
      finalSubcategoryId = rows[0].sno;
    }

    const [products] = await db.query(
      `SELECT * FROM products WHERE subcategory_id = ? ORDER BY created_at DESC`,
      [finalSubcategoryId]
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
  } catch (error) {
    console.error('Get products by subcategory error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// Get ProductsByTag

exports.getProductsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    const [products] = await db.query(
      `SELECT p.*
       FROM products p
       JOIN product_tags pt ON p.id = pt.product_id
       WHERE pt.tag_id = ?
       ORDER BY p.created_at DESC`,
      [tagId]
    );

    // Normalize products to include discount_percent (image_url left as-is)
    const productsWithExtras = products.map((product) => ({
      ...product,
      discount_percent: Number(product.discount) || 0
    }));

    res.json({ success: true, products: productsWithExtras });
  } catch (error) {
    console.error("getProductsByTag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by tag"
    });
  }
};


// 📦 BULK UPLOAD PRODUCTS FROM EXCEL

// exports.uploadProductsFromExcel = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     const workbook = xlsx.readFile(req.file.path);
//     const sheetName = workbook.SheetNames[0];
//     const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ message: "Excel file is empty or invalid" });
//     }

//     const headers = Object.keys(data[0]).map(h => String(h).trim().toLowerCase());

//     const hasCategory = headers.includes("category_id") || headers.includes("category");
//     const hasSubcategory = headers.includes("subcategory_id") || headers.includes("subcategory");

//     const requiredAlways = [
//       "name", "product_code", "description", "mrp", "discount", "price",
//       "stock_quantity", "brand_name", "age_range", "gender"
//     ];
//     const missingAlways = requiredAlways.filter(h => !headers.includes(h));

//     const missing = [...missingAlways];
//     if (!hasCategory) missing.push("category_id (or category)");
//     if (!hasSubcategory) missing.push("subcategory_id (or subcategory)");

//     const hasHighlights = headers.includes("highlights");
//     const hasSpecifications = headers.includes("specifications");

//     if (missing.length > 0) {
//       return res.status(400).json({ message: "Invalid Excel headers", missing_headers: missing });
//     }

//     let inserted = 0, updated = 0;

//     for (const raw of data) {
//       const row = {};
//       for (const k in raw) row[k.toLowerCase()] = raw[k];

//       const product_code = String(row.product_code || "").trim();
//       if (!product_code) continue;

//       // Convert / clean fields
//       const name = String(row.name || "").trim();
//       const description = String(row.description || "");
//       const mrp = Number(row.mrp);
//       const discount = Number(row.discount);
//       const price = Number(row.price);

//       const category_id =
//         row.category_id !== "" ? Number(row.category_id) :
//           row.category !== "" ? Number(row.category) : null;

//       const subcategory_id =
//         row.subcategory_id !== "" ? Number(row.subcategory_id) :
//           row.subcategory !== "" ? Number(row.subcategory) : null;

//       const incoming_stock = Number(row.stock_quantity || 0);

//       const brand_name = String(row.brand_name || "");
//       const age_range = String(row.age_range || "");
//       const gender = String(row.gender || "");

//       const highlights = hasHighlights ? String(row.highlights || "") : "";
//       const specifications = hasSpecifications ? String(row.specifications || "") : "";

//       // 🔍 Check if product exists based on product_code
//       const [existingRows] = await db.query(
//         "SELECT id, stock_quantity FROM products WHERE product_code = ?",
//         [product_code]
//       );

//       if (existingRows.length > 0) {
//         const existingStock = Number(existingRows[0].stock_quantity || 0);
//         const newStock = existingStock + incoming_stock;

//         await db.query(
//           `UPDATE products SET 
//             name=?, description=?, mrp=?, discount=?, price=?, 
//             category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
//             highlights=?, specifications=?, stock_quantity=? 
//           WHERE product_code=?`,
//           [
//             name,
//             description,
//             mrp,
//             discount,
//             price,
//             Number.isNaN(category_id) ? null : category_id,
//             Number.isNaN(subcategory_id) ? null : subcategory_id,
//             brand_name,
//             age_range,
//             gender,
//             highlights,
//             specifications,
//             newStock, // 🔥 Add to stock instead of replacing
//             product_code
//           ]
//         );

//         updated++;

//       } else {
//         // ===============================
//         //  🆕 INSERT NEW PRODUCT
//         // ===============================
//         await db.query(
//           `INSERT INTO products 
//             (name, product_code, description, mrp, discount, price, category_id, subcategory_id,
//              stock_quantity, brand_name, age_range, gender, highlights, specifications)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             name,
//             product_code,
//             description,
//             mrp,
//             discount,
//             price,
//             Number.isNaN(category_id) ? null : category_id,
//             Number.isNaN(subcategory_id) ? null : subcategory_id,
//             incoming_stock,
//             brand_name,
//             age_range,
//             gender,
//             highlights,
//             specifications
//           ]
//         );

//         inserted++;
//       }
//     }

//     try { fs.unlinkSync(req.file.path); } catch (_) {}

//     return res.json({
//       message: "Bulk upload completed",
//       inserted,
//       updated
//     });

//   } catch (error) {
//     console.error("Error uploading Excel:", error);
//     try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
//     return res.status(500).json({ message: "Error uploading Excel", error: error.message });
//   }
// };
//Stock addition code ^


// exports.uploadProductsFromExcel = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     const workbook = xlsx.readFile(req.file.path);
//     const sheetName = workbook.SheetNames[0];
//     const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

//     if (!Array.isArray(data) || data.length === 0) {
//       return res.status(400).json({ message: "Excel file is empty or invalid" });
//     }

//     const headers = Object.keys(data[0]).map(h => String(h).trim().toLowerCase());

//     const hasCategory = headers.includes("category_id") || headers.includes("category");
//     const hasSubcategory = headers.includes("subcategory_id") || headers.includes("subcategory");

//     const requiredAlways = [
//       "name", "product_code", "description", "mrp", "discount", "price",
//       "stock_quantity", "brand_name", "age_range", "gender"
//     ];
//     const missingAlways = requiredAlways.filter(h => !headers.includes(h));

//     const missing = [...missingAlways];
//     if (!hasCategory) missing.push("category_id (or category)");
//     if (!hasSubcategory) missing.push("subcategory_id (or subcategory)");

//     const hasHighlights = headers.includes("highlights");
//     const hasSpecifications = headers.includes("specifications");

//     if (missing.length > 0) {
//       return res.status(400).json({ message: "Invalid Excel headers", missing_headers: missing });
//     }

//     let inserted = 0, updated = 0;

//     for (const raw of data) {
//       const row = {};
//       for (const k in raw) row[k.toLowerCase()] = raw[k];

//       const product_code = String(row.product_code || "").trim();
//       if (!product_code) continue;

//       // Convert / clean fields
//       const name = String(row.name || "").trim();
//       const description = String(row.description || "");
//       const mrp = Number(row.mrp);
//       const discount = Number(row.discount);
//       const price = Number(row.price);

//       const category_id =
//         row.category_id !== "" ? Number(row.category_id) :
//           row.category !== "" ? Number(row.category) : null;

//       const subcategory_id =
//         row.subcategory_id !== "" ? Number(row.subcategory_id) :
//           row.subcategory !== "" ? Number(row.subcategory) : null;

//       const incoming_stock = Number(row.stock_quantity || 0);

//       const brand_name = String(row.brand_name || "");
//       const age_range = String(row.age_range || "");
//       const gender = String(row.gender || "");

//       const highlights = hasHighlights ? String(row.highlights || "") : "";
//       const specifications = hasSpecifications ? String(row.specifications || "") : "";

//       // 🔍 Check if product exists based on product_code
//       const existing = await db.query(
//         "SELECT id, stock_quantity FROM products WHERE product_code = ?",
//         [product_code]
//       );

//       if (existing.length > 0) {
//         // ===============================
//         //  🔁 UPDATE EXISTING PRODUCT
//         // ===============================
//         const existingStock = Number(existing[0].stock_quantity || 0);
//         const newStock = existingStock + incoming_stock;

//         await db.query(
//           `UPDATE products SET 
//             name=?, description=?, mrp=?, discount=?, price=?, 
//             category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
//             highlights=?, specifications=?, stock_quantity=? 
//           WHERE product_code=?`,
//           [
//             name,
//             description,
//             mrp,
//             discount,
//             price,
//             Number.isNaN(category_id) ? null : category_id,
//             Number.isNaN(subcategory_id) ? null : subcategory_id,
//             brand_name,
//             age_range,
//             gender,
//             highlights,
//             specifications,
//             newStock, // 🔥 Add to stock instead of replacing
//             product_code
//           ]
//         );

//         updated++;

//       } else {
//         // ===============================
//         //  🆕 INSERT NEW PRODUCT
//         // ===============================
//         await db.query(
//           `INSERT INTO products 
//             (name, product_code, description, mrp, discount, price, category_id, subcategory_id,
//              stock_quantity, brand_name, age_range, gender, highlights, specifications)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             name,
//             product_code,
//             description,
//             mrp,
//             discount,
//             price,
//             Number.isNaN(category_id) ? null : category_id,
//             Number.isNaN(subcategory_id) ? null : subcategory_id,
//             incoming_stock,
//             brand_name,
//             age_range,
//             gender,
//             highlights,
//             specifications
//           ]
//         );

//         inserted++;
//       }
//     }

//     try { fs.unlinkSync(req.file.path); } catch (_) {}

//     return res.json({
//       message: "Bulk upload completed",
//       inserted,
//       updated
//     });

//   } catch (error) {
//     console.error("Error uploading Excel:", error);
//     try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
//     return res.status(500).json({ message: "Error uploading Excel", error: error.message });
//   }
// };

exports.uploadProductsFromExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Excel file is empty or invalid" });
    }

    // Be permissive on headers: we will process row-by-row and skip rows
    // that do not have required fields instead of rejecting the whole file.
    const headers = Object.keys(data[0] || {}).map(h => String(h).trim().toLowerCase());
    const hasTagIds = headers.includes("tag_ids");
    const hasCustomized = headers.includes("customized");

    let inserted = 0, updated = 0;
    const insertedProducts = [];
    const updatedProducts = [];

    for (const raw of data) {
      const row = {};
      for (const k in raw) row[k.toLowerCase()] = raw[k];

      const product_code = String(row.product_code || "").trim();
      if (!product_code) continue;

      // Convert / clean fields
      const name = String(row.name || "").trim();
      const description = String(row.description || "");
      const mrp = Number(row.mrp);
      const discount = Number(row.discount);
      const price = Number(row.price);

      const category_id =
        row.category_id !== "" ? Number(row.category_id) :
          row.category !== "" ? Number(row.category) : null;

      const subcategory_id =
        row.subcategory_id !== "" ? Number(row.subcategory_id) :
          row.subcategory !== "" ? Number(row.subcategory) : null;

      const incoming_stock = Number(row.stock_quantity || 0);

      const brand_name = String(row.brand_name || "");
      const age_range = String(row.age_range || "");
      const gender = String(row.gender || "");

      // Previously we accepted 'highlights' and 'specifications' from Excel. These fields are no longer used.
      // (Keep compatibility if they are present but we ignore them.)

      // 👉 TAG IDS PARSING
      let tagIds = [];
      if (hasTagIds && row.tag_ids) {
        tagIds = String(row.tag_ids)
          .split(",")
          .map(t => Number(t.trim()))
          .filter(t => !isNaN(t));
      }

        // 👉 CUSTOMIZED COLUMN PARSING (NEW)
      const customized = hasCustomized
        ? (row.customized === 1 ||
           row.customized === "1" ||
           String(row.customized).toLowerCase() === "true")
          ? 1 : 0
        : 0;

      // 🔍 Check if product exists based on product_code
      const [existingRows] = await db.query(
        "SELECT id, stock_quantity FROM products WHERE product_code = ?",
        [product_code]
      );

      if (existingRows.length > 0) {
        const existingProduct = existingRows[0];
        const productId = existingProduct.id;

        // ===============================
        // 🔁 UPDATE EXISTING PRODUCT
        // ===============================
        const newStock = Number(incoming_stock || 0);   // 🔥 Replace instead of add
 
//         const primaryImage = uploadedImages[0];
// const image_url = primaryImage
//   ? `/uploads/products/${primaryImage.filename}`
//   : null;


        // Update product without highlights/specifications (removed)
        // Attempt update, but gracefully handle FK constraint failures by retrying with nulls
        const updateParams = [
          name,
          description,
          mrp,
          discount,
          price,
          Number.isNaN(category_id) ? null : category_id,
          Number.isNaN(subcategory_id) ? null : subcategory_id,
          brand_name,
          age_range,
          gender,
          newStock,
          customized,
          product_code
        ];

        try {
          await db.query(
            `UPDATE products SET 
              name=?, description=?, mrp=?, discount=?, price=?, 
              category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
              stock_quantity=?, customized=?
            WHERE product_code=?`,
            updateParams
          );
        } catch (errUpdate) {
          // If FK fails due to missing category/subcategory, retry with those set to null
          if (errUpdate && errUpdate.code === 'ER_NO_REFERENCED_ROW_2') {
            let needRetry = false;
            if (String(errUpdate.message).includes('fk_products_subcategory')) {
              updateParams[5] = null; // subcategory_id position
              needRetry = true;
            }
            if (String(errUpdate.message).includes('fk_products_category')) {
              updateParams[4] = null; // category_id position (after price)
              needRetry = true;
            }
            if (needRetry) {
              try { await db.query(
                `UPDATE products SET 
                  name=?, description=?, mrp=?, discount=?, price=?, 
                  category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
                  stock_quantity=?, customized=?
                WHERE product_code=?`,
                updateParams
              ); } catch (e2) { throw e2; }
            } else {
              throw errUpdate;
            }
          } else {
            throw errUpdate;
          }
        }

        // 👉 UPDATE TAGS
        if (tagIds.length > 0) {
          await db.query("DELETE FROM product_tags WHERE product_id=?", [productId]);

          for (let t of tagIds) {
            await db.query(
              "INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)",
              [productId, t]
            );
          }
        }

        updated++;
        updatedProducts.push({ product_code, id: productId });

      } else {
        // ===============================
        // 🆕 INSERT NEW PRODUCT
        // ===============================
        // Insert new product (without highlights/specifications)
        const insertResult = await db.query(
          `INSERT INTO products 
            (name, product_code, description, mrp, discount, price, 
             category_id, subcategory_id, stock_quantity, 
             brand_name, age_range, gender, customized)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
          [
            name,
            product_code,
            description,
            mrp,
            discount,
            price,
            Number.isNaN(category_id) ? null : category_id,
            Number.isNaN(subcategory_id) ? null : subcategory_id,
            incoming_stock,
            brand_name,
            age_range,
            gender,
            customized
          ]
        );

        const productId = insertResult[0].insertId;

        // 👉 INSERT TAGS
        for (let t of tagIds) {
          await db.query(
            "INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)",
            [productId, t]
          );
        }

        // Track lists to return to frontend
        if (existingRows.length > 0) {
          updatedProducts.push({ product_code, id: productId });
        } else {
          insertedProducts.push({ product_code, id: productId });
        }

        inserted++;
      }
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    return res.json({
      message: "Bulk upload completed",
      inserted,
      updated,
      insertedProducts,
      updatedProducts
    });

  } catch (error) {
    console.error("Error uploading Excel:", error);
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(500).json({ message: "Error uploading Excel", error: error.message });
  }
};



exports.uploadProductsFromExcelV2 = async (req, res) => {
  try {
    console.log('📁 Upload request received');
    console.log('File info:', req.file ? { name: req.file.originalname, path: req.file.path, size: req.file.size, mimetype: req.file.mimetype } : 'NO FILE');

    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log('📖 Reading Excel file...');
    let workbook;
    try {
      if (req.file.path && req.file.path.length > 0 && fs.existsSync(req.file.path)) {
        workbook = xlsx.readFile(req.file.path);
      } else if (req.file.buffer && req.file.buffer.length) {
        // Multer may provide buffer instead of file path in some configs
        workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      } else {
        console.error('❌ Uploaded file missing path and buffer', { file: req.file });
        return res.status(400).json({ success: false, message: 'Uploaded file is not available on server' });
      }
    } catch (readErr) {
      console.error('❌ Error reading uploaded workbook:', readErr && readErr.message, { file: req.file });
      try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({ success: false, message: 'Failed to read uploaded Excel file', error: String(readErr && (readErr.stack || readErr.message)) });
    }

    const sheetName = workbook.SheetNames && workbook.SheetNames[0];
    console.log('📊 Sheet name:', sheetName);

    let data;
    try {
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      console.log('📋 Rows read:', Array.isArray(data) ? data.length : 'N/A');
    } catch (parseErr) {
      console.error('❌ Error parsing workbook to JSON:', parseErr && parseErr.message);
      return res.status(500).json({ success: false, message: 'Failed to parse Excel sheet', error: String(parseErr && (parseErr.stack || parseErr.message)) });
    }

    if (!Array.isArray(data) || data.length === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      console.error('❌ Excel file is empty or invalid');
      return res.status(400).json({ success: false, message: "Excel file is empty or invalid" });
    }

    let inserted = 0, updated = 0;
    const insertedProducts = [];
    const updatedProducts = [];
    const unprocessedProducts = [];
    const seenCodes = new Set();

    console.log('🔄 Processing rows...');
    for (const [index, raw] of data.entries()) {
      const rowNumber = index + 2;
      const row = {};
      for (const k in raw) row[k.toLowerCase()] = raw[k];

      const product_code = String(row.product_code || "").trim();
      if (!product_code) {
        unprocessedProducts.push({ rowNumber, reason: "missing product_code", row });
        continue;
      }

      if (seenCodes.has(product_code)) {
        unprocessedProducts.push({ rowNumber, product_code, reason: "duplicate product_code in file", row });
        continue;
      }
      seenCodes.add(product_code);

      const name = String(row.name || "").trim();
      const description = row.description !== undefined ? String(row.description) : null;
      const mrp = row.mrp !== undefined ? Number(row.mrp) : null;
      const discount = row.discount !== undefined ? Number(row.discount) : null;
      const price = row.price !== undefined ? Number(row.price) : null;

      let category_id = row.category_id !== undefined && row.category_id !== "" ? Number(row.category_id) :
        row.category !== undefined && row.category !== "" ? Number(row.category) : null;

      let subcategory_id = row.subcategory_id !== undefined && row.subcategory_id !== "" ? Number(row.subcategory_id) :
        row.subcategory !== undefined && row.subcategory !== "" ? Number(row.subcategory) : null;

      // Validate foreign keys: ensure category and subcategory exist in DB before using them
      try {
        if (category_id !== null && !Number.isNaN(category_id)) {
          // try common category table names
          const checkCatQueries = [
            "SELECT id FROM categories WHERE id = ? LIMIT 1",
            "SELECT id FROM category WHERE id = ? LIMIT 1",
            "SELECT sno as id FROM category WHERE sno = ? LIMIT 1"
          ];
          let found = false;
          for (const q of checkCatQueries) {
            try {
              const [r] = await db.query(q, [category_id]);
              if (Array.isArray(r) && r.length > 0) { found = true; break; }
            } catch (e) {
              // ignore individual query errors and try next
            }
          }
          if (!found) category_id = null;
        } else {
          category_id = null;
        }

        if (subcategory_id !== null && !Number.isNaN(subcategory_id)) {
          try {
            const [r] = await db.query("SELECT sno FROM subcategory WHERE sno = ? LIMIT 1", [subcategory_id]);
            if (!Array.isArray(r) || r.length === 0) subcategory_id = null;
          } catch (e) {
            // If table doesn't exist or query fails, fallback to null
            subcategory_id = null;
          }
        } else {
          subcategory_id = null;
        }
      } catch (fkCheckErr) {
        console.warn('FK validation failed, continuing with nulls', fkCheckErr?.message || fkCheckErr);
        category_id = null;
        subcategory_id = null;
      }

      const incoming_stock = row.stock_quantity !== undefined ? Number(row.stock_quantity || 0) : null;

      const brand_name = row.brand_name !== undefined ? String(row.brand_name) : null;
      const age_range = row.age_range !== undefined ? String(row.age_range) : null;
      const gender = row.gender !== undefined ? String(row.gender) : null;

      let tagIds = [];
      if (row.tag_ids) {
        tagIds = String(row.tag_ids).split(",").map(t => Number(t.trim())).filter(t => !isNaN(t));
      }

      const customized = row.customized !== undefined
        ? ((row.customized === 1 || row.customized === "1" || String(row.customized).toLowerCase() === "true") ? 1 : 0)
        : 0;

      try {
        const [existingRows] = await db.query(
          "SELECT id, stock_quantity, name FROM products WHERE product_code = ?",
          [product_code]
        );

      if (existingRows.length > 0) {
        const existingProduct = existingRows[0];
        const productId = existingProduct.id;
        const existingName = String(existingProduct.name || "").trim();

        if (!name) {
          unprocessedProducts.push({ rowNumber, product_code, reason: "product_name required for update", row });
          continue;
        }

        if (name.toLowerCase() !== existingName.toLowerCase()) {
          unprocessedProducts.push({ rowNumber, product_code, reason: "product name mismatch", dbName: existingName, fileName: name, row });
          continue;
        }

        const newStock = incoming_stock !== null ? incoming_stock : (existingProduct.stock_quantity || 0);

        let updateParams = [
          name,
          description,
          mrp,
          discount,
          price,
          Number.isNaN(category_id) ? null : category_id,
          Number.isNaN(subcategory_id) ? null : subcategory_id,
          brand_name,
          age_range,
          gender,
          newStock,
          customized,
          product_code
        ];

        try {
          await db.query(
            `UPDATE products SET 
              name=?, description=?, mrp=?, discount=?, price=?, 
              category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
              stock_quantity=?, customized=?
            WHERE product_code=?`,
            updateParams
          );
        } catch (errUpdate) {
          if (errUpdate && errUpdate.code === 'ER_NO_REFERENCED_ROW_2') {
            console.warn(`Row ${rowNumber}: FK constraint on UPDATE, nulling FKs and retrying`);
            updateParams[5] = null; // category_id
            updateParams[6] = null; // subcategory_id
            await db.query(
              `UPDATE products SET 
                name=?, description=?, mrp=?, discount=?, price=?, 
                category_id=?, subcategory_id=?, brand_name=?, age_range=?, gender=?, 
                stock_quantity=?, customized=?
              WHERE product_code=?`,
              updateParams
            );
          } else {
            throw errUpdate;
          }
        }

        if (tagIds.length > 0) {
          await db.query("DELETE FROM product_tags WHERE product_id=?", [productId]);
          for (let t of tagIds) {
            await db.query("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, t]);
          }
        }

        updated++;
        updatedProducts.push({ rowNumber, product_code, product_name: name, id: productId });

      } else {
        if (!name) {
          unprocessedProducts.push({ rowNumber, product_code, reason: "missing required fields for insert: name", row });
          continue;
        }

        const insertParams = [
          name,
          product_code,
          description,
          mrp,
          discount,
          price,
          Number.isNaN(category_id) ? null : category_id,
          Number.isNaN(subcategory_id) ? null : subcategory_id,
          incoming_stock || 0,
          brand_name,
          age_range,
          gender,
          customized
        ];

        let insertResult;
        try {
          insertResult = await db.query(
            `INSERT INTO products 
              (name, product_code, description, mrp, discount, price, 
               category_id, subcategory_id, stock_quantity, 
               brand_name, age_range, gender, customized)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
            insertParams
          );
        } catch (errInsert) {
          if (errInsert && errInsert.code === 'ER_NO_REFERENCED_ROW_2') {
            console.warn(`Row ${rowNumber}: FK constraint error, nulling FKs and retrying`);
            insertParams[6] = null; // category_id
            insertParams[7] = null; // subcategory_id
            insertResult = await db.query(
              `INSERT INTO products 
                (name, product_code, description, mrp, discount, price, 
                 category_id, subcategory_id, stock_quantity, 
                 brand_name, age_range, gender, customized)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
              insertParams
            );
          } else {
            throw errInsert;
          }
        }

        const productId = insertResult[0].insertId;

        for (let t of tagIds) {
          await db.query("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, t]);
        }

        inserted++;
        insertedProducts.push({ rowNumber, product_code, product_name: name, id: productId });
      }
    } catch (rowErr) {
      console.error(`Row ${rowNumber} failed to process: ${rowErr?.message ||rowErr}`);
      unprocessedProducts.push({ rowNumber, product_code, reason: rowErr?.message || "Error processing row", row });
    }
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // Prepare report files directory
    const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
    try { if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true }); } catch (_) {}

    // Helper to write CSV with proper formatting
    const writeCsv = (arr, filename, includeReason = false) => {
      if (!arr || arr.length === 0) return false;
      
      // If this is unprocessed/rejected products, include the reason
      if (includeReason) {
        const header = 'Row Number,Product Code,Reason,Details\n';
        const lines = arr.map(obj => {
          const rowNum = obj.rowNumber || '';
          const rawCode = obj.product_code || '';
          const code = rawCode != null ? String(rawCode) : '';
          const reason = obj.reason || '';
          const details = (() => {
            if (obj.dbName && obj.fileName) {
              return `DB Name: "${obj.dbName}", File Name: "${obj.fileName}"`;
            }
            return '';
          })();
          
          const escapeCsv = (val) => {
            if (!val) return '';
            const s = String(val).replace(/"/g, '""');
            return `"${s}"`;
          };
          // For product_code force Excel to treat it as text by prefixing with apostrophe inside quoted field
          const escCode = code === '' ? '' : '"' + "'" + code.replace(/"/g,'""') + '"';
          return [escapeCsv(rowNum), escCode, escapeCsv(reason), escapeCsv(details)].join(',');
        });
        const csv = header + lines.join('\n');
        const p = path.join(reportsDir, filename);
        fs.writeFileSync(p, csv, 'utf8');
        return true;
      }
      
      // For accepted products (inserted/updated)
      const keys = Array.from(arr.reduce((set, r) => { Object.keys(r || {}).forEach(k=>set.add(k)); return set; }, new Set()));
      const header = keys.join(',') + '\n';
      const lines = arr.map(obj => keys.map(k => {
        let val = obj[k];
        if (val === null || val === undefined) return '';
        const s = String(val).replace(/"/g, '""');
        // For product_code column, force Excel to treat as text by prefixing with apostrophe inside quoted field
        if (k === 'product_code') {
          return val === '' ? '' : '"' + "'" + s + '"';
        }
        return `"${s}"`;
      }).join(','));
      const csv = header + lines.join('\n');
      const p = path.join(reportsDir, filename);
      fs.writeFileSync(p, csv, 'utf8');
      return true;
    };

    const insertedFileExists = writeCsv(insertedProducts, 'inserted_products.csv');
    const updatedFileExists = writeCsv(updatedProducts, 'updated_products.csv');
    const unprocessedFileExists = writeCsv(unprocessedProducts, 'unprocessed_products.csv', true);

    // base host for direct file links
    const hostBase = `${req.protocol}://${req.get('host')}`;

    // Also create a combined accepted_products report (Inserted + Updated)
    let acceptedFileUrl = null;
    try {
      const acceptedProductsCombined = [];

      // fetch full product rows from DB for each saved/updated id so report contains full details
      const fetchFull = async (rec) => {
        try {
          const [[full]] = await db.query('SELECT * FROM products WHERE id = ?', [rec.id]);
          if (full) {
            return { ...full, rowNumber: rec.rowNumber, product_code: rec.product_code, status: rec.status };
          }
        } catch (err) {
          console.warn('Failed to fetch full product for report', rec.id, err?.message || err);
        }
        // fallback to minimal fields
        return { rowNumber: rec.rowNumber, product_code: rec.product_code, product_name: rec.product_name, id: rec.id, status: rec.status };
      };

      // build intermediate list marking status
      const toFetch = [];
      insertedProducts.forEach(p => toFetch.push({ ...p, status: 'Saved' }));
      updatedProducts.forEach(p => toFetch.push({ ...p, status: 'Updated' }));

      if (toFetch.length > 0) {
        const fullRows = await Promise.all(toFetch.map(fetchFull));
        fullRows.forEach(r => acceptedProductsCombined.push(r));

        // write CSV (legacy) and XLSX (preferred) with a unique filename per upload
        const ts = Date.now();
        const uid = uploadId || ts;
        const acceptedCsvName = `accepted_${ts}_${uid}.csv`;
        const acceptedXlsxName = `accepted_${ts}_${uid}.xlsx`;
        // CSV
        writeCsv(acceptedProductsCombined, acceptedCsvName);
        // XLSX
        try {
          // Ensure product_code is string for all rows so Excel treats the cell as text
          const normalized = acceptedProductsCombined.map(r => ({ ...r, product_code: r.product_code != null ? String(r.product_code) : '' }));
          const ws = xlsx.utils.json_to_sheet(normalized);

          // Robustly find product_code header column in the generated sheet (use header row values)
          let pcCol = null;
          Object.keys(ws).forEach(addr => {
            if (addr[0] === '!') return; // skip sheet meta keys
            // header cells are in row 1 (e.g., A1, B1, ...)
            if (/^[A-Z]+1$/.test(addr)) {
              const val = ws[addr] && ws[addr].v;
              if (val === 'product_code' || String(val).toLowerCase() === 'product_code') {
                pcCol = addr.replace(/1$/, '');
              }
            }
          });

          if (pcCol) {
            for (let i = 0; i < normalized.length; i++) {
              const addr = `${pcCol}${i + 2}`; // data starts at row 2
              // ensure cell exists
              if (!ws[addr]) ws[addr] = {};
              ws[addr].t = 's';
              ws[addr].v = String(normalized[i].product_code);
              // enforce Text format for Excel
              ws[addr].z = '@';
            }
          }

          const wb = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(wb, ws, 'accepted');
          const xlsxPath = path.join(reportsDir, acceptedXlsxName);
          xlsx.writeFile(wb, xlsxPath);
          const stats = fs.statSync(xlsxPath);
          console.log(`✅ ${acceptedXlsxName} written: size=${stats.size} bytes`);
          acceptedFileUrl = `${hostBase}/uploads/reports/${acceptedXlsxName}`;
        } catch (xlsxErr) {
          console.warn('Failed to write XLSX accepted report:', xlsxErr?.message || xlsxErr);
        }
      }
    } catch (e) {
      console.error('Failed to build/write combined accepted report:', e.message || e);
    }

    // 📊 Save upload history to database (bulk_uploads table)
    let uploadId = null;
    let totalRows = insertedProducts.length + updatedProducts.length + unprocessedProducts.length;
    let acceptedRows = insertedProducts.length + updatedProducts.length;
    let rejectedRows = unprocessedProducts.length;
    
    try {
      console.log('📊 Saving to bulk_uploads:', {
        uploaded_by: req.user?.id || null,
        total_rows: totalRows,
        accepted_rows: acceptedRows,
        rejected_rows: rejectedRows
      });
      
      uploadId = await uploadHistory.saveBulkUploadRecord({
        uploaded_by: req.user?.id || null,
        total_rows: totalRows,
        accepted_count: acceptedRows,
        rejected_count: rejectedRows
      });
      console.log('✅ Upload record saved with ID:', uploadId);
    } catch (err) {
      console.error('⚠️ Failed to save upload history:', err.message);
      // Continue anyway - history save is not critical for CSV downloads
    }

    return res.json({
      success: true,
      message: `✅ Processed ${totalRows} rows. New saved: ${inserted}, Updated: ${updated}, Rejected: ${rejectedRows}`,
      totalRows,
      total: totalRows,
      savedCount: inserted,
      updatedCount: updated,
      acceptedCount: inserted + updated,
      rejectedCount: rejectedRows,
      inserted,
      updated,
      rejected: rejectedRows,
      insertedProducts,
      updatedProducts,
      unprocessedProducts,
      acceptedRows: [...insertedProducts, ...updatedProducts],
      rejectedRows: unprocessedProducts,
      reportFiles: {
        inserted: insertedFileExists ? '/api/upload-report/inserted' : null,
        updated: updatedFileExists ? '/api/upload-report/updated' : null,
        unprocessed: unprocessedFileExists ? '/api/upload-report/unprocessed' : null,
        // accepted returns a direct file URL when created per-upload
        accepted: acceptedFileUrl || ((insertedFileExists || updatedFileExists) ? '/api/upload-report/accepted' : null)
      },
      // Convenience URLs for frontend immediate downloads (accepted returns XLSX per-upload when available)
      acceptedFileUrl: acceptedFileUrl || ((insertedFileExists || updatedFileExists) ? `${hostBase}/api/upload-report/accepted` : null),
      rejectedFileUrl: unprocessedFileExists ? `${hostBase}/api/upload-report/unprocessed` : null
    });
  } catch (error) {
    console.error("❌ Error uploading Excel:", error.message);
    console.error("🔧 Error type:", error.constructor.name);
    console.error("📍 Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    
    return res.status(500).json({ 
      success: false,
      message: "Error uploading Excel", 
      error: error.message 
    });
  }
};

// CSV/Excel template for product upload
exports.getProductsUploadTemplate = async (req, res) => {
  try {
    // Dynamically retrieve all column names from the products table
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' ORDER BY ORDINAL_POSITION`
    );

    const headers = (cols && cols.length > 0) ? cols.map(c => c.COLUMN_NAME) : [
      'name', 'product_code', 'description', 'mrp', 'discount', 'price',
      'stock_quantity', 'brand_name', 'age_range', 'gender', 'category_id', 'subcategory_id', 'tag_ids', 'customized'
    ];

    const csv = headers.join(',') + '\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
    console.log('Template requested, returning headers:', headers.join(', '));
    return res.send(csv);
  } catch (err) {
    console.error('Error sending template:', err);
    // Fallback to a conservative header set to ensure download works
    const fallback = ['name','product_code','description','mrp','discount','price','stock_quantity','brand_name','category_id','subcategory_id'];
    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
      return res.send(fallback.join(',') + '\n');
    } catch (err2) {
      console.error('Fallback template send failed:', err2);
      return res.status(500).json({ message: 'Failed to generate template' });
    }
  }
};

// Serve persisted upload reports
exports.getUploadReport = async (req, res) => {
  try {
    const { type } = req.params; // 'inserted'|'updated'|'unprocessed'
    const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
    const map = {
      inserted: 'inserted_products.csv',
      updated: 'updated_products.csv',
      unprocessed: 'unprocessed_products.csv'
    };

    if (!map[type]) return res.status(400).json({ message: 'Invalid report type' });
    const filename = map[type];
    const p = path.join(reportsDir, filename);
    if (!fs.existsSync(p)) return res.status(404).json({ message: 'Report not found' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(p);
    stream.pipe(res);
  } catch (err) {
    console.error('Get upload report error:', err);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
};

// Get tracking info for a specific order item
exports.getItemTracking = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    if (!orderId || !itemId) {
      return res.status(400).json({ success: false, message: 'Order ID and Item ID are required' });
    }

    // Load order (for overall status) and item (for item-level details if present)
    const [[orderRows], [itemRows]] = await Promise.all([
      db.query("SELECT id, order_status, created_at, updated_at FROM orders_new WHERE id = ?", [orderId]),
      db.query("SELECT * FROM order_items WHERE id = ? AND order_id = ?", [itemId, orderId])
    ]);

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!itemRows || itemRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const order = orderRows[0];
    const item = itemRows[0];

    // Some installations may not yet have tracking fields on order_items.
    // We will derive a simple timeline from order_status and include optional fields if present.
    const carrier = item.carrier || null;
    const trackingNumber = item.tracking_number || null;
    const itemStatus = item.item_status || null; // optional per-item status if schema supports it

    // Build a basic timeline based on known statuses
    const status = (itemStatus || order.order_status || 'pending').toLowerCase();
    const steps = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'processing', label: 'Processing' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const isCompleted = (stepKey) => {
      const orderOf = { placed: 0, pending: 0, processing: 1, accepted: 2, shipped: 3, delivered: 4, cancelled: -1 };
      const current = orderOf[status] ?? 0;
      const step = orderOf[stepKey] ?? -1;
      return step !== -1 && current >= step;
    };

    const timeline = steps.map(s => ({
      key: s.key,
      label: s.label,
      completed: isCompleted(s.key)
    }));

    // If cancelled, annotate
    const cancelled = status === 'cancelled';

    return res.status(200).json({
      success: true,
      tracking: {
        orderId: Number(orderId),
        itemId: Number(itemId),
        product_name: item.product_name,
        status: cancelled ? 'cancelled' : status,
        carrier,
        trackingNumber,
        timeline,
        updated_at: order.updated_at,
      }
    });
  } catch (error) {
    console.error('Get item tracking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching tracking info' });
  }
};



exports.getNewArrivals = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT * FROM products ORDER BY id DESC LIMIT 12`
    );
    
    // Add discount_percent field to each product
    const productsWithExtras = products.map((product) => ({
      ...product,
      discount_percent: Number(product.discount) || 0
    }));

    // Return products as-is without fallback to product_images
    // If image_url is NULL, it stays NULL (user cleared the selection)
    res.json({ success: true, products: productsWithExtras });
  } catch (err) {
    console.error("New Arrivals Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load new arrivals"
    });
  }
};

// ===============================
// 📌 GET PRODUCTS WITH DISCOUNT > 10
// ===============================
// exports.getHighDiscountProducts = async (req, res) => {
//   try {
//     // 1. MySQL query for discount > 10
//     const [products] = await db.query(
//       "SELECT * FROM products WHERE discount > 10"
//     );

//     // 2. Attach images (existing helper)
//     // const productsWithImages = await attachImagesToProducts(products);
// // res.status(200).json({ success: true, products });

// //     // 3. Send result
// //     res.status(200).json({
// //       success: true,
// //       count: productsWithImages.length,
// //       products: productsWithImages
// //     });
//   } catch (err) {
//     console.error("Error fetching discounted products:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error fetching discounted products"
//     });
//   }
// };


exports.getHighDiscountProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products WHERE discount > 10 ORDER BY created_at DESC"
    );
    
    // Add a normalized discount_percent field to each product
    const productsWithExtras = products.map((product) => ({
      ...product,
      discount_percent: Number(product.discount) || 0
    }));

    // If image_url is NULL, it stays NULL (user cleared the selection)
    res.json({ success: true, products: productsWithExtras });
  } catch (err) {
    console.error("Error fetching discounted products:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching discounted products"
    });
  }
};

exports.getCustomizedProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products WHERE customized = 1 ORDER BY created_at DESC"
    );

    // Add discount_percent field to each product
    const productsWithExtras = products.map((product) => ({
      ...product,
      discount_percent: Number(product.discount) || 0
    }));

    // Return products as-is without fallback to product_images
    // If image_url is NULL, it stays NULL (user cleared the selection)
    res.json({ success: true, products: productsWithExtras });
  } catch (err) {
    console.error("Error fetching customized products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customized products"
    });
  }
};


exports.bulkUploadImagesByCode = async (req, res) => {
  try {
    const files = req.files;
    if (!files || !files.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    let updated = 0;
    let skipped = [];
    const productMap = new Map(); // Track products and their images

    // First pass: collect all images by product code
    for (const file of files) {
      // Use path.parse to safely get filename without extension (handles multiple dots)
      const productCode = (path.parse(file.originalname).name || '').trim();
      const imageUrl = `/uploads/products/${file.filename}`;

      const [rows] = await db.query(
        "SELECT id FROM products WHERE product_code = ?",
        [productCode]
      );

      if (!rows.length) {
        skipped.push(file.originalname);
        continue;
      }

      const productId = rows[0].id;
      
      if (!productMap.has(productId)) {
        productMap.set(productId, []);
      }
      productMap.get(productId).push(imageUrl);
    }

    // Second pass: insert images and set defaults
    for (const [productId, imageUrls] of productMap) {
      // Get current max sort order
      const [[{ maxOrder = -1 } = {}]] = await db.query(
        "SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?",
        [productId]
      );

      let currentOrder = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) + 1 : 0;

      // Insert all images into product_images table
      for (const imageUrl of imageUrls) {
        await db.query(
          "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
          [productId, imageUrl, currentOrder]
        );
        currentOrder++;
      }

      // Set first image as default if product doesn't have one
      const [[product]] = await db.query(
        "SELECT image_url FROM products WHERE id = ?",
        [productId]
      );

      if (!product?.image_url && imageUrls.length > 0) {
        await db.query(
          "UPDATE products SET image_url = ? WHERE id = ?",
          [imageUrls[0], productId]
        );
      }

      updated++;
    }

    res.json({
      success: true,
      message: `Images updated: ${updated} products`,
      skipped
    });

  } catch (err) {
    console.error("Bulk image upload error:", err);
    res.status(500).json({ message: "Bulk image upload failed" });
  }
};


// ======================================================
// 📊 BULK UPLOAD HISTORY ENDPOINTS
// ======================================================


exports.getUploadHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const records = await uploadHistory.getUploadHistory(limit, offset);
    const totalCount = await uploadHistory.getUploadCount();

    res.json({
      success: true,
      uploads: records,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        recordsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload history'
    });
  }
};

/**
 * Get upload record details by ID
 */
exports.getUploadDetailsById = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const record = await uploadHistory.getUploadRecordById(uploadId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found'
      });
    }

    res.json({
      success: true,
      upload: record
    });
  } catch (error) {
    console.error('Error fetching upload details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload details'
    });
  }
};

/**
 * Download a report file from upload history
 */
exports.downloadUploadFile = async (req, res) => {
  try {
    const { uploadId, fileType } = req.params; // fileType: 'accepted', 'rejected', 'deleted', 'not_found'
    
    const record = await uploadHistory.getUploadRecordById(uploadId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found'
      });
    }

    let filePath = null;
    let fileName = null;

    switch (fileType) {
      case 'accepted':
        filePath = record.accepted_file_path;
        fileName = `accepted_products_${uploadId}.csv`;
        break;
      case 'rejected':
        filePath = record.rejected_file_path;
        fileName = `rejected_products_${uploadId}.csv`;
        break;
      case 'deleted':
        filePath = record.deleted_file_path;
        fileName = `deleted_products_${uploadId}.csv`;
        break;
      case 'not_found':
        filePath = record.not_found_file_path;
        fileName = `not_found_products_${uploadId}.csv`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid file type'
        });
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not available for this upload'
      });
    }

    // Construct full file path
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading file'
      });
    });
  } catch (error) {
    console.error('Error downloading upload file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
};

/**
 * Delete upload record
 */
exports.deleteUploadRecord = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const success = await uploadHistory.deleteUploadRecord(uploadId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found'
      });
    }

    res.json({
      success: true,
      message: 'Upload record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting upload record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete upload record'
    });
  }
};

/**
 * Download upload report files
 */
exports.downloadUploadReport = async (req, res) => {
  try {
    const { reportType } = req.params; // 'inserted'|'updated'|'unprocessed'|'accepted'|'rejected'

    const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');

    if (reportType === 'accepted') {
      // Prefer serving the most recent accepted_*.xlsx file so Excel opens it with correct text types
      try {
        const xlsxFiles = fs.readdirSync(reportsDir).filter(f => f.startsWith('accepted_') && f.endsWith('.xlsx'));
        if (xlsxFiles && xlsxFiles.length > 0) {
          // pick newest by mtime
          const fileStats = xlsxFiles.map(f => ({ name: f, stat: fs.statSync(path.join(reportsDir, f)) }));
          fileStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
          const chosen = fileStats[0].name;
          const filePath = path.join(reportsDir, chosen);
          const stats = fs.statSync(filePath);
          console.log(`📤 Serving accepted XLSX: ${chosen}, size=${stats.size}`);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${chosen}"`);
          const stream = fs.createReadStream(filePath);
          return stream.pipe(res);
        }

        // fallback: look for accepted_*.csv
        const csvFiles = fs.readdirSync(reportsDir).filter(f => f.startsWith('accepted_') && f.endsWith('.csv'));
        if (csvFiles && csvFiles.length > 0) {
          const fileStats = csvFiles.map(f => ({ name: f, stat: fs.statSync(path.join(reportsDir, f)) }));
          fileStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
          const chosen = fileStats[0].name;
          const filePath = path.join(reportsDir, chosen);
          const stats = fs.statSync(filePath);
          console.log(`📤 Serving accepted CSV fallback: ${chosen}, size=${stats.size}`);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${chosen}"`);
          const stream = fs.createReadStream(filePath);
          return stream.pipe(res);
        }

        // final fallback: static accepted_products.csv
        const staticPath = path.join(reportsDir, 'accepted_products.csv');
        if (fs.existsSync(staticPath)) {
          const stats = fs.statSync(staticPath);
          console.log(`📤 Serving static accepted_products.csv, size=${stats.size}`);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="accepted_products.csv"`);
          const stream = fs.createReadStream(staticPath);
          return stream.pipe(res);
        }

        return res.status(404).json({ message: 'No accepted report found' });
      } catch (err) {
        console.error('Error serving accepted XLSX:', err.message || err);
        return res.status(500).json({ message: 'Failed to serve accepted report' });
      }
    }

    // other report types: serve CSVs
    const fileMap = {
      inserted: 'inserted_products.csv',
      updated: 'updated_products.csv',
      unprocessed: 'unprocessed_products.csv',
      rejected: 'unprocessed_products.csv'
    };
    const fileName = fileMap[reportType];
    if (!fileName) return res.status(400).json({ message: 'Invalid report type' });
    const filePath = path.join(reportsDir, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Report not found' });
    try {
      const stats = fs.statSync(filePath);
      let lineCount = 0;
      try { const content = fs.readFileSync(filePath, 'utf8'); lineCount = content.split('\n').length - 1; } catch (_) {}
      console.log(`📤 Serving report ${fileName}: size=${stats.size} bytes, lines=${lineCount}`);
    } catch (logErr) {
      console.warn('Could not stat report file:', logErr.message || logErr);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report'
    });
  }
};

// ======================================================
// 🔥 GET BEST-SELLING PRODUCTS (TRENDING)
// ======================================================
exports.getBestSellingProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 12;

    // Query to get products sorted by quantity sold
    const [products] = await db.query(
      `SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       GROUP BY p.id
       HAVING total_sold > 4
       ORDER BY total_sold DESC, p.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    // Add discount_percent field to each product
    const productsWithExtras = products.map((product) => ({
      ...product,
      discount_percent: Number(product.discount) || 0
    }));

    res.json({ success: true, products: productsWithExtras });
  } catch (err) {
    console.error("Best Selling Products Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load best-selling products"
    });
  }
};
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { userId, items, totalAmount, shippingAddress, paymentMethod, paymentDetails } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    await connection.beginTransaction();

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);

    const [orderResult] = await connection.query(
      `INSERT INTO orders_new 
        (user_id, order_number, total_amount, subtotal, gst_amount,
         shipping_full_name, shipping_email, shipping_phone,
         shipping_address, shipping_city, shipping_state,
         shipping_zip_code, shipping_country,
         payment_method, payment_status, payment_details, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        orderNumber,
        totalAmount,
        subtotal,
        0,
        shippingAddress.fullName,
        shippingAddress.email,
        shippingAddress.phone,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state || '',
        shippingAddress.zipCode,
        shippingAddress.country || 'India',
        paymentMethod,
        paymentMethod === 'cod' ? 'pending' : 'paid',
        JSON.stringify(paymentDetails || {}),
        'pending'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_name, product_price, quantity, item_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity || 1,
          Number(item.price) * (Number(item.quantity) || 1)
        ]
      );

      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?`,
        [item.quantity || 1, item.id, item.quantity || 1]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderId,
      orderNumber
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error while placing order' });
  } finally {
    connection.release();
  }
};



